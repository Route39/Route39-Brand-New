import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { KycExpirationService } from './kyc-expiration.service';

@Injectable()
@Processor('kyc-expiration-checker')
export class KycExpirationProcessor extends WorkerHost {
  private readonly logger = new Logger(KycExpirationProcessor.name);

  constructor(private readonly kycExpirationService: KycExpirationService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing KYC expiration check job: ${job.id}`);

    try {
      await this.kycExpirationService.checkExpiringDocuments();
      this.logger.log(`KYC expiration check job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(
        `KYC expiration check job ${job.id} failed`,
        error,
      );
      throw error;
    }
  }
}
