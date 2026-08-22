import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BeforeUpdateOneHook,
  UpdateOneInputType,
} from '@ptc-org/nestjs-query-graphql';
import {
  DriverEntity,
  DriverNotificationService,
  DriverStatus,
  EmailNotificationService,
} from '@ridy/database';
import { Repository } from 'typeorm';
import { DriverDTO } from '../dto/driver.dto';

// Statuses that indicate the driver is pending approval
const PENDING_STATUSES: DriverStatus[] = [
  DriverStatus.WaitingDocuments,
  DriverStatus.PendingApproval,
  DriverStatus.SoftReject,
];

@Injectable()
export class DriverUpdateHook implements BeforeUpdateOneHook<DriverDTO> {
  private readonly logger = new Logger(DriverUpdateHook.name);

  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,
    private readonly driverNotificationService: DriverNotificationService,
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  async run(
    instance: UpdateOneInputType<DriverDTO>,
  ): Promise<UpdateOneInputType<DriverDTO>> {
    this.logger.log(`DriverUpdateHook triggered for driver ID: ${instance.id}`);

    // Extract the driver ID and the new status from the update input
    const driverId = instance.id as number;
    const newStatus = instance.update?.status as DriverStatus | undefined;

    // Only proceed if status is being updated to Offline (approved)
    if (newStatus !== DriverStatus.Offline) {
      return instance;
    }

    // Fetch the current driver to check their current status
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
      select: ['id', 'status', 'notificationPlayerId', 'email', 'firstName', 'lastName', 'mobileNumber', 'carPlate'],
      relations: ['car'],
    });

    if (!driver) {
      this.logger.warn(`Driver not found with ID: ${driverId}`);
      return instance;
    }

    // Check if this is an approval (status changing from pending to offline)
    if (PENDING_STATUSES.includes(driver.status)) {
      this.logger.log(
        `Driver ${driverId} is being approved (${driver.status} -> ${newStatus})`,
      );

      // Send the approval notifications asynchronously (don't await to not block the update)
      this.sendApprovalNotification(driver);
    }

    return instance;
  }

  private async sendApprovalNotification(
    driver: DriverEntity,
  ): Promise<void> {
    // Send push notification
    try {
      await this.driverNotificationService.approved(driver.notificationPlayerId);
      this.logger.log(`Push notification sent to driver ${driver.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to driver ${driver.id}: ${error}`,
      );
    }

    // Send email notification
    try {
      await this.emailNotificationService.sendDriverApproved({
        email: driver.email,
        firstName: driver.firstName,
        lastName: driver.lastName,
        mobileNumber: driver.mobileNumber,
        vehicleModel: driver.car?.name,
        licensePlate: driver.carPlate,
      });
      this.logger.log(`Approval email sent to driver ${driver.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send approval email to driver ${driver.id}: ${error}`,
      );
    }
  }
}
