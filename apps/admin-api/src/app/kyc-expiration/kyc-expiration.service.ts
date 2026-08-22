import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, LessThanOrEqual, Between } from 'typeorm';
import {
  DriverEntity,
  DriverDocumentEntity,
  DriverToDriverDocumentEntity,
  DriverRedisService,
  SharedDriverService,
  EmailService,
  EmailEventType,
  DriverStatus,
} from '@ridy/database';

// Mapping of days until expiry to email event types
const EXPIRY_DAYS_TO_EVENT: Record<number, EmailEventType> = {
  30: EmailEventType.EXPIRING_KYC_30_DAY_REMINDER,
  14: EmailEventType.EXPIRING_KYC_14_DAY_REMINDER,
  7: EmailEventType.EXPIRING_KYC_7_DAY_REMINDER,
  3: EmailEventType.EXPIRING_KYC_3_DAY_REMINDER,
  2: EmailEventType.EXPIRING_KYC_2_DAY_REMINDER,
  1: EmailEventType.EXPIRING_KYC_1_DAY_REMINDER,
};

const REMINDER_DAYS = [30, 14, 7, 3, 2, 1];

@Injectable()
export class KycExpirationService {
  private readonly logger = new Logger(KycExpirationService.name);

  constructor(
    @InjectRepository(DriverToDriverDocumentEntity)
    private readonly driverToDocumentRepo: Repository<DriverToDriverDocumentEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    private readonly driverRedisService: DriverRedisService,
    private readonly sharedDriverService: SharedDriverService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Main entry point - checks all driver documents for expiration
   */
  async checkExpiringDocuments(): Promise<void> {
    this.logger.log('Starting KYC expiration check...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process expired documents first
    await this.processExpiredDocuments(today);

    // Process documents expiring on reminder days
    for (const days of REMINDER_DAYS) {
      await this.processDocumentsExpiringInDays(today, days);
    }

    this.logger.log('KYC expiration check completed');
  }

  /**
   * Handle documents that have already expired
   */
  private async processExpiredDocuments(today: Date): Promise<void> {
    this.logger.log('Checking for expired documents...');

    // Find all documents that have expired (expiresAt < today)
    const expiredDocuments = await this.driverToDocumentRepo.find({
      where: {
        expiresAt: LessThanOrEqual(today),
      },
      relations: {
        driver: true,
        driverDocument: true,
      },
    });

    // Group by driver ID to avoid processing the same driver multiple times
    const expiredDriverIds = new Set<number>();
    for (const doc of expiredDocuments) {
      if (doc.driverId) {
        expiredDriverIds.add(doc.driverId);
      }
    }

    this.logger.log(
      `Found ${expiredDriverIds.size} drivers with expired documents`,
    );

    for (const driverId of expiredDriverIds) {
      try {
        await this.handleExpiredDriver(driverId);
      } catch (error) {
        this.logger.error(
          `Failed to handle expired documents for driver ${driverId}`,
          error,
        );
      }
    }
  }

  /**
   * Handle a driver with expired documents
   * - Remove from Redis pool
   * - Update status to WaitingDocuments
   */
  private async handleExpiredDriver(driverId: number): Promise<void> {
    this.logger.log(`Handling expired documents for driver ${driverId}`);

    // Remove driver from Redis pool
    await this.driverRedisService.expire([driverId]);
    this.logger.log(`Removed driver ${driverId} from Redis pool`);

    // Update driver status to WaitingDocuments
    await this.sharedDriverService.updateDriverStatus(
      driverId,
      DriverStatus.SoftReject,
      'KYC documents expired',
    );
    this.logger.log(`Updated driver ${driverId} status to WaitingDocuments`);
  }

  /**
   * Process documents expiring in a specific number of days
   */
  private async processDocumentsExpiringInDays(
    today: Date,
    days: number,
  ): Promise<void> {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);

    // Create a date range for the target day (start of day to end of day)
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const expiringDocuments = await this.driverToDocumentRepo.find({
      where: {
        expiresAt: Between(startOfDay, endOfDay),
      },
      relations: {
        driver: true,
        driverDocument: true,
      },
    });

    this.logger.log(
      `Found ${expiringDocuments.length} documents expiring in ${days} days`,
    );

    const eventType = EXPIRY_DAYS_TO_EVENT[days];
    if (!eventType) {
      this.logger.warn(`No event type configured for ${days} days reminder`);
      return;
    }

    for (const doc of expiringDocuments) {
      try {
        await this.sendExpirationReminder(doc, eventType);
      } catch (error) {
        this.logger.error(
          `Failed to send expiration reminder for document ${doc.id}`,
          error,
        );
      }
    }
  }

  /**
   * Send an expiration reminder email to the driver
   */
  private async sendExpirationReminder(
    driverDocument: DriverToDriverDocumentEntity,
    eventType: EmailEventType,
  ): Promise<void> {
    const driver = driverDocument.driver;
    const document = driverDocument.driverDocument;

    if (!driver || !document) {
      this.logger.warn(
        `Missing driver or document info for driver document ${driverDocument.id}`,
      );
      return;
    }

    if (!driver.email) {
      this.logger.warn(
        `Driver ${driver.id} has no email address, skipping reminder`,
      );
      return;
    }

    this.logger.log(
      `Sending ${eventType} reminder to driver ${driver.id} for document "${document.title}"`,
    );

    await this.emailService.sendEmail({
      to: driver.email,
      eventType,
      variables: {
        firstName: driver.firstName || 'Driver',
        documentType: document.title,
      },
    });
  }
}
