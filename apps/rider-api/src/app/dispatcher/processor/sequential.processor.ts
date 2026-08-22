import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { DispatchConfig, DriverRedisService } from '@ridy/database';
import { DispatchPubSubService } from '../pubsub/dispatch-pubsub.service';
import { DriverSelectionService } from '../driver-selection.service';
import { Logger } from '@nestjs/common';

@Processor('dispatch-sequential')
export class SequentialConsumer extends WorkerHost {
  private readonly logger = new Logger(SequentialConsumer.name);
  constructor(
    private readonly pubsub: DispatchPubSubService,
    @InjectQueue('dispatch-sequential')
    private readonly sequentialDispatchQueue: Queue<SequentialDispatchJobData>,
    private readonly driverSelectionService: DriverSelectionService,
    private readonly driverRedisService: DriverRedisService,
  ) {
    super();
  }

  async process(job: Job<SequentialDispatchJobData, any, string>) {
    const { orderId, config, retryCount, currentCandidateIndex } = job.data;

    this.logger.debug(
      `Processing sequential dispatch job for order ${orderId}, retry count: ${retryCount}`,
    );

    const rankedDriverIds = await this.driverSelectionService.getRankedDrivers({
      orderId,
      config,
    });

    this.logger.debug(
      `Found ${rankedDriverIds.length} drivers for order ${orderId}`,
    );
    const driver = await this.driverRedisService.getOnlineDriverMetaData(
      rankedDriverIds[currentCandidateIndex].toString(),
    );
    if (!driver) {
      this.logger.debug(
        `Driver ${rankedDriverIds[currentCandidateIndex]} is no longer online, skipping`,
      );
      const isLastDriverInList =
        currentCandidateIndex === rankedDriverIds.length - 1;
      await this.sequentialDispatchQueue.add('dispatch', {
        orderId,
        config,
        retryCount: isLastDriverInList ? retryCount + 1 : retryCount,
        currentCandidateIndex: isLastDriverInList
          ? 0
          : currentCandidateIndex + 1,
      });
      return;
    }

    const isFirstDispatch = retryCount === 0 && currentCandidateIndex === 0;
    const offerSent = await this.pubsub.sequentialDispatch(
      orderId,
      rankedDriverIds,
      config,
      currentCandidateIndex,
      isFirstDispatch,
    );

    if (retryCount < (config.sequentialConfig?.driverRetryLimit ?? 3)) {
      const isLastDriverInList =
        currentCandidateIndex === rankedDriverIds.length - 1;

      // If offer wasn't sent (driver busy/offline), move to next with short backoff
      // Otherwise wait for the full timeout period
      const delay = offerSent
        ? (config.sequentialConfig?.perDriverTimeoutSeconds ?? 30) * 1000
        : 5000; // 5 second backoff to prevent tight loops

      await this.sequentialDispatchQueue.add(
        'dispatch',
        {
          orderId,
          config,
          retryCount: isLastDriverInList ? retryCount + 1 : retryCount,
          currentCandidateIndex: isLastDriverInList
            ? 0
            : currentCandidateIndex + 1,
        },
        { delay },
      );

      this.logger.debug(
        offerSent
          ? `Scheduled next dispatch attempt for order ${orderId} with ${config.sequentialConfig?.perDriverTimeoutSeconds ?? 30}s delay`
          : `Driver unavailable, moving to next candidate for order ${orderId} with 5s backoff`,
      );
    }
  }
}

export interface SequentialDispatchJobData {
  orderId: number;
  config: DispatchConfig;
  retryCount: number;
  currentCandidateIndex: number;
}
