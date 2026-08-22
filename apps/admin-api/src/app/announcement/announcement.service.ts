import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AnnouncementEntity } from '@ridy/database';
import { Repository } from 'typeorm';
import { CreateAnnouncementInput } from './inputs/create-announcement.input';
import { AnnouncementDTO } from './dto/announcement.dto';
import { AnnouncementNotificationJobData } from './announcement.processor';

@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);

  constructor(
    @InjectRepository(AnnouncementEntity)
    private readonly announcementRepository: Repository<AnnouncementEntity>,
    @InjectQueue('announcement-notifications')
    private readonly notificationQueue: Queue<AnnouncementNotificationJobData>,
  ) {}

  async createAnnouncement(input: {
    announcement: CreateAnnouncementInput;
    operatorId?: number;
  }): Promise<AnnouncementDTO> {
    const announcement = this.announcementRepository.create(input.announcement);
    await this.announcementRepository.save(announcement);

    // Schedule notifications if enabled
    if (
      input.announcement.pushNotification === true ||
      input.announcement.smsNotification === true
    ) {
      await this.scheduleNotification(announcement.id, input.announcement);
    }

    return announcement;
  }

  private async scheduleNotification(
    announcementId: number,
    input: CreateAnnouncementInput,
  ): Promise<void> {
    const jobData: AnnouncementNotificationJobData = {
      announcementId,
      pushNotification: input.pushNotification ?? false,
      pushNotificationTitle: input.pushNotificationTitle,
      pushNotificationBody: input.pushNotificationBody,
      smsNotification: input.smsNotification ?? false,
      smsNotificationBody: input.smsNotificationBody,
    };

    const now = new Date();
    const startAt = input.startAt ? new Date(input.startAt) : now;
    const delay = Math.max(0, startAt.getTime() - now.getTime());

    if (delay > 0) {
      this.logger.log(
        `Scheduling notification for announcement ${announcementId} at ${startAt.toISOString()} (delay: ${delay}ms)`,
      );
    } else {
      this.logger.log(
        `Sending notification immediately for announcement ${announcementId}`,
      );
    }

    await this.notificationQueue.add(
      'send-notification',
      jobData,
      {
        jobId: `announcement:${announcementId}`,
        delay,
      },
    );
  }
}
