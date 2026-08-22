import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  DriverEntity,
  DriverDocumentEntity,
  DriverToDriverDocumentEntity,
  EmailModule,
  getRedisConnectionConfig,
  RedisHelpersModule,
  SharedOrderModule,
} from '@ridy/database';
import { KycExpirationService } from './kyc-expiration.service';
import { KycExpirationProcessor } from './kyc-expiration.processor';

const KYC_EXPIRATION_QUEUE = 'kyc-expiration-checker';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DriverEntity,
      DriverDocumentEntity,
      DriverToDriverDocumentEntity,
    ]),
    BullModule.registerQueue({
      name: KYC_EXPIRATION_QUEUE,
      connection: getRedisConnectionConfig(),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { count: 10 },
      },
    }),
    EmailModule,
    RedisHelpersModule,
    SharedOrderModule,
  ],
  providers: [KycExpirationService, KycExpirationProcessor],
  exports: [KycExpirationService],
})
export class KycExpirationModule implements OnModuleInit {
  constructor(
    @InjectQueue(KYC_EXPIRATION_QUEUE)
    private readonly kycExpirationQueue: Queue,
  ) {}

  async onModuleInit() {
    // Get schedule from environment or use default (9 AM daily)
    const schedule = process.env.KYC_EXPIRATION_CHECK_SCHEDULE || '0 9 * * *';

    // Remove any existing repeatable jobs first
    const existingJobs = await this.kycExpirationQueue.getRepeatableJobs();
    for (const job of existingJobs) {
      await this.kycExpirationQueue.removeRepeatableByKey(job.key);
    }

    // Add the repeatable job with the configured schedule
    await this.kycExpirationQueue.add(
      'check-expiring-documents',
      {},
      {
        repeat: {
          pattern: schedule,
        },
      },
    );

    console.log(
      `KYC expiration check scheduled with pattern: ${schedule}`,
    );
  }
}
