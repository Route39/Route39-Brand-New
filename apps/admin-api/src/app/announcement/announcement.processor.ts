import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import {
  AnnouncementEntity,
  AnnouncementUserType,
  CustomerEntity,
  DriverEntity,
  SMSService,
} from '@ridy/database';
import { messaging } from 'firebase-admin';

export interface AnnouncementNotificationJobData {
  announcementId: number;
  pushNotification: boolean;
  pushNotificationTitle?: string;
  pushNotificationBody?: string;
  smsNotification: boolean;
  smsNotificationBody?: string;
}

@Injectable()
@Processor('announcement-notifications')
export class AnnouncementNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(AnnouncementNotificationProcessor.name);

  constructor(
    @InjectRepository(AnnouncementEntity)
    private readonly announcementRepository: Repository<AnnouncementEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly smsService: SMSService,
  ) {
    super();
  }

  async process(job: Job<AnnouncementNotificationJobData>) {
    const { announcementId } = job.data;
    this.logger.log(`Processing notification job for announcement ${announcementId}`);

    const announcement = await this.announcementRepository.findOne({
      where: { id: announcementId },
    });

    if (!announcement) {
      this.logger.warn(`Announcement ${announcementId} not found, skipping notification`);
      return;
    }

    // Check if announcement is still valid (not expired)
    const now = new Date();
    if (announcement.expireAt && announcement.expireAt < now) {
      this.logger.warn(`Announcement ${announcementId} has expired, skipping notification`);
      return;
    }

    // Gather FCM tokens and mobile numbers based on user type
    const fcmTokens: string[] = [];
    const mobileNumbers: string[] = [];

    if (announcement.userType.includes(AnnouncementUserType.Driver)) {
      const drivers = await this.driverRepository.find({
        where: { notificationPlayerId: Not(IsNull()) },
        select: ['notificationPlayerId', 'mobileNumber'],
      });
      if (job.data.smsNotification) {
        mobileNumbers.push(...drivers.map((d) => d.mobileNumber));
      }
      if (job.data.pushNotification) {
        fcmTokens.push(...drivers.map((d) => d.notificationPlayerId));
      }
    }

    if (announcement.userType.includes(AnnouncementUserType.Rider)) {
      const customers = await this.customerRepository.find({
        where: { notificationPlayerId: Not(IsNull()) },
        select: ['notificationPlayerId', 'mobileNumber'],
      });
      if (job.data.smsNotification) {
        mobileNumbers.push(...customers.map((c) => c.mobileNumber));
      }
      if (job.data.pushNotification) {
        fcmTokens.push(...customers.map((c) => c.notificationPlayerId));
      }
    }

    // Deduplicate tokens and mobile numbers (same device may be logged into multiple accounts)
    const uniqueFcmTokens = [...new Set(fcmTokens)];
    const uniqueMobileNumbers = [...new Set(mobileNumbers)];

    this.logger.log(
      `Collected ${fcmTokens.length} FCM tokens (${uniqueFcmTokens.length} unique), ${mobileNumbers.length} mobile numbers (${uniqueMobileNumbers.length} unique)`,
    );

    // Send push notifications
    if (uniqueFcmTokens.length > 0 && job.data.pushNotification) {
      try {
        const result = await messaging().sendEachForMulticast({
          tokens: uniqueFcmTokens,
          notification: {
            title: job.data.pushNotificationTitle || announcement.title,
            body: job.data.pushNotificationBody || announcement.description || '',
          },
          data: {
            announcementId: announcement.id.toString(),
            ...(announcement.url ? { url: announcement.url } : {}),
          },
        });
        this.logger.log(
          `Push notifications sent for announcement ${announcementId}: ${result.successCount} success, ${result.failureCount} failed`,
        );
      } catch (error) {
        this.logger.error(`Failed to send push notifications for announcement ${announcementId}`, error);
        throw error;
      }
    }

    // Send SMS notifications
    if (uniqueMobileNumbers.length > 0 && job.data.smsNotification) {
      const smsBody = job.data.smsNotificationBody || announcement.description;
      let successCount = 0;
      let failureCount = 0;

      for (const mobileNumber of uniqueMobileNumbers) {
        try {
          await this.smsService.sendSMS(mobileNumber, smsBody);
          successCount++;
        } catch (error) {
          this.logger.error(`Failed to send SMS to ${mobileNumber}`, error);
          failureCount++;
        }
      }
      this.logger.log(
        `SMS notifications sent for announcement ${announcementId}: ${successCount} success, ${failureCount} failed`,
      );
    }

    // Update announcement to mark notifications as sent
    await this.announcementRepository.update(announcementId, {
      notificationSentAt: new Date(),
    });

    this.logger.log(`Completed notification job for announcement ${announcementId}`);
  }
}
