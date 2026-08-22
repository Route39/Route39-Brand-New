import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import {
  BetterConfigService,
  DispatchStrategy,
  DriverEventType,
  PubSubService,
  RideOfferRedisService,
  RiderOrderUpdateType,
  RiderRedisService,
  RiderEphemeralMessageType,
  TaxiOrderEntity,
  OrderStatus,
} from '@ridy/database';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SequentialDispatchJobData } from './sequential.processor';
import { BroadcastDispatchJobData } from './broadcast.processor';

@Injectable()
@Processor('dispatch-main')
export class MainConsumer extends WorkerHost {
  private readonly logger = new Logger(MainConsumer.name);
  constructor(
    @InjectQueue('dispatch-main')
    private readonly mainQueue: Queue<DispatchMainJobData>,
    @InjectQueue('dispatch-sequential')
    private readonly sequentialDispatchQueue: Queue<SequentialDispatchJobData>,
    @InjectQueue('dispatch-broadcast')
    private readonly broadcastDispatchQueue: Queue<BroadcastDispatchJobData>,
    @InjectRepository(TaxiOrderEntity)
    private readonly orderRepository: Repository<TaxiOrderEntity>,
    private readonly configService: BetterConfigService,

    private readonly pubsub: PubSubService,
    private readonly orderRedisService: RideOfferRedisService,
    private readonly riderRedisService: RiderRedisService,
  ) {
    super();
  }

  async process(job: Job<DispatchMainJobData>) {
    const { orderId } = job.data;
    switch (job.name) {
      case 'dispatch':
        return this.dispatchOrder(job);
      case `expire-order`:
        this.logger.debug(`Expiring order ${job.id} after timeout`);
        return this.expireOrder(orderId);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
        return { orderId };
    }
  }
  async expireOrder(orderId: number) {
    const orderMetaData = await this.orderRedisService.getRideOfferMetadata(
      orderId.toString(),
    );

    if (!orderMetaData) {
      this.logger.warn(`Order metadata not found for order ${orderId}`);
      return;
    }

    // Update database status to Expired
    await this.orderRepository.update(orderId, {
      status: OrderStatus.Expired,
    });
    this.logger.debug(`Updated order ${orderId} status to Expired in database`);

    // Save ephemeral message to Redis so it persists
    this.logger.debug(`Creating ephemeral message for rider ${orderMetaData.riderId} about expired order ${orderId}`);
    await this.riderRedisService.createEphemeralMessage(orderMetaData.riderId, {
      type: RiderEphemeralMessageType.RideExpired,
      orderId: orderId,
      serviceImageUrl: orderMetaData.serviceImageAddress,
      serviceName: orderMetaData.serviceName,
      vehicleName: null,
      driverFullName: null,
      driverProfileUrl: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    });

    // Clean up Redis
    this.orderRedisService.rideOfferExpired({
      orderId: orderId.toString(),
    });

    // Notify rider that no driver was found
    this.logger.debug(`Notifying rider ${orderMetaData.riderId} that no driver was found for order ${orderId}`);
    await this.pubsub.publish(
      'rider.order.updated',
      {
        riderId: parseInt(orderMetaData.riderId),
      },
      {
        type: RiderOrderUpdateType.NoDriverFound,
        orderId,
        riderId: parseInt(orderMetaData.riderId),
      },
    );

    // Send ephemeral message notification (for immediate display)
    await this.pubsub.publish(
      'rider.order.updated',
      {
        riderId: parseInt(orderMetaData.riderId),
      },
      {
        type: RiderOrderUpdateType.NewEphemeralMessage,
        orderId,
        riderId: parseInt(orderMetaData.riderId),
        message: {
          message: 'No drivers are available at the moment. Please try again later.',
          createdAt: new Date(),
          isFromMe: false,
          senderFullName: 'System',
        },
      },
    );

    // Notify drivers that the offer was revoked
    for (const driverId of orderMetaData?.offeredToDriverIds || []) {
      this.pubsub.publish(
        'driver.event',
        {
          driverId: parseInt(driverId),
        },
        {
          type: DriverEventType.RideOfferRevoked,
          orderId,
          driverId: parseInt(driverId),
        },
      );
    }
  }

  async dispatchOrder(job: Job<DispatchMainJobData>) {
    const { orderId } = job.data;
    const config = await this.configService.getDispatchConfig();

    this.logger.debug(
      `Processing dispatch job for order ${orderId} with strategy ${config.strategy}`,
    );

    switch (config.strategy) {
      case DispatchStrategy.Broadcast:
        this.logger.debug(`Adding broadcast dispatch job for order ${orderId}`);
        this.broadcastDispatchQueue.add(
          'dispatch',
          {
            orderId,
            config,
            wave: 1,
          },
          {
            jobId: `dispatch:${orderId}`,
          },
        );
        break;
      case DispatchStrategy.Sequential:
        this.logger.debug(
          `Adding sequential dispatch job for order ${orderId}`,
        );
        this.sequentialDispatchQueue.add(
          'dispatch',
          {
            orderId,
            config,
            currentCandidateIndex: 0,
            retryCount: 0,
          },
          {
            jobId: `dispatch:${orderId}`,
          },
        );
    }

    this.mainQueue.add(
      `expire-order`,
      { orderId },
      {
        removeOnComplete: true,
        removeOnFail: true,
        delay: config.requestTimeoutSeconds * 1000,
        jobId: `expire:${orderId}`,
      },
    );
  }
}

export interface DispatchMainJobData {
  orderId: number;
}
