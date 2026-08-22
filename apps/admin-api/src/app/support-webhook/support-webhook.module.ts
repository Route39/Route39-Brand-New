import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CustomerEntity,
  DriverEntity,
  FirebaseNotificationModule,
} from '@ridy/database';
import { SupportWebhookService } from './support-webhook.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerEntity, DriverEntity]),
    FirebaseNotificationModule.register(),
  ],
  providers: [SupportWebhookService],
  exports: [SupportWebhookService],
})
export class SupportWebhookModule {}
