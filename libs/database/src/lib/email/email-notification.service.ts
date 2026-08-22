import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailEventType } from '../entities/enums/email-event-type.enum';

/**
 * High-level service for sending email notifications triggered by various events.
 * This service provides convenience methods that map business events to email templates.
 */
@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);

  constructor(private emailService: EmailService) {}

  // ============================================
  // Driver Lifecycle Events
  // ============================================

  async sendDriverApproved(driver: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    mobileNumber?: string | null;
    vehicleModel?: string | null;
    licensePlate?: string | null;
  }): Promise<void> {
    if (!driver.email) {
      this.logger.debug('Driver has no email, skipping approval email');
      return;
    }

    await this.emailService.sendEmail({
      to: driver.email,
      eventType: EmailEventType.DRIVER_APPROVED,
      variables: {
        firstName: driver.firstName ?? '',
        lastName: driver.lastName ?? '',
        email: driver.email,
        phone: driver.mobileNumber ?? '',
        vehicleModel: driver.vehicleModel ?? '',
        licensePlate: driver.licensePlate ?? '',
      },
    });
  }

  async sendDriverRejected(driver: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    mobileNumber?: string | null;
  }): Promise<void> {
    if (!driver.email) {
      this.logger.debug('Driver has no email, skipping rejection email');
      return;
    }

    await this.emailService.sendEmail({
      to: driver.email,
      eventType: EmailEventType.DRIVER_REJECTED,
      variables: {
        firstName: driver.firstName ?? '',
        lastName: driver.lastName ?? '',
        email: driver.email,
        phone: driver.mobileNumber ?? '',
      },
    });
  }

  async sendDriverDocumentsPending(driver: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    mobileNumber?: string | null;
  }): Promise<void> {
    if (!driver.email) {
      this.logger.debug('Driver has no email, skipping documents pending email');
      return;
    }

    await this.emailService.sendEmail({
      to: driver.email,
      eventType: EmailEventType.DRIVER_DOCUMENTS_PENDING,
      variables: {
        firstName: driver.firstName ?? '',
        lastName: driver.lastName ?? '',
        email: driver.email,
        phone: driver.mobileNumber ?? '',
      },
    });
  }

  async sendDriverSuspended(driver: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    mobileNumber?: string | null;
  }): Promise<void> {
    if (!driver.email) {
      this.logger.debug('Driver has no email, skipping suspension email');
      return;
    }

    await this.emailService.sendEmail({
      to: driver.email,
      eventType: EmailEventType.DRIVER_SUSPENDED,
      variables: {
        firstName: driver.firstName ?? '',
        lastName: driver.lastName ?? '',
        email: driver.email,
        phone: driver.mobileNumber ?? '',
      },
    });
  }

  /**
   * Send notification when a driver completes their registration.
   * The primary purpose is to notify platform admins via CC (configured in the template)
   * that a new driver is awaiting approval.
   */
  async sendDriverRegistrationSubmitted(driver: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    mobileNumber?: string | null;
  }): Promise<void> {
    // For this event, even if the driver has no email, we still want to send
    // to the CC recipients (platform admins). Use a placeholder email if needed.
    const recipientEmail = driver.email ?? 'noreply@placeholder.local';

    await this.emailService.sendEmail({
      to: recipientEmail,
      eventType: EmailEventType.DRIVER_REGISTRATION_SUBMITTED,
      variables: {
        firstName: driver.firstName ?? '',
        lastName: driver.lastName ?? '',
        email: driver.email ?? 'Not provided',
        phone: driver.mobileNumber ?? '',
      },
    });
  }

  // ============================================
  // Order Lifecycle Events
  // ============================================

  async sendOrderConfirmed(order: {
    id: number | string;
    costAfterCoupon?: number;
    createdOn?: Date;
    addresses?: string[];
    rider?: {
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      mobileNumber?: string | null;
    } | null;
    driver?: {
      firstName?: string | null;
      lastName?: string | null;
      car?: { name?: string | null } | null;
      carPlate?: string | null;
    } | null;
  }): Promise<void> {
    const rider = order.rider;
    if (!rider?.email) {
      this.logger.debug('Rider has no email, skipping order confirmed email');
      return;
    }

    const driver = order.driver;
    const driverName = driver
      ? `${driver.firstName ?? ''} ${driver.lastName ?? ''}`.trim()
      : '';

    await this.emailService.sendEmail({
      to: rider.email,
      eventType: EmailEventType.ORDER_CONFIRMED,
      variables: {
        firstName: rider.firstName ?? '',
        lastName: rider.lastName ?? '',
        email: rider.email,
        phone: rider.mobileNumber ?? '',
        orderNumber: order.id.toString(),
        amount: order.costAfterCoupon?.toString() ?? '',
        date: order.createdOn?.toISOString() ?? '',
        pickup: order.addresses?.[0] ?? '',
        dropoff: order.addresses?.[order.addresses.length - 1] ?? '',
        driverName,
        vehicleModel: driver?.car?.name ?? '',
        licensePlate: driver?.carPlate ?? '',
      },
    });
  }

  async sendOrderCompleted(order: {
    id: number | string;
    costAfterCoupon?: number;
    createdOn?: Date;
    addresses?: string[];
    rider?: {
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      mobileNumber?: string | null;
    } | null;
    driver?: {
      firstName?: string | null;
      lastName?: string | null;
      car?: { name?: string | null } | null;
      carPlate?: string | null;
    } | null;
  }): Promise<void> {
    const rider = order.rider;
    if (!rider?.email) {
      this.logger.debug('Rider has no email, skipping order completed email');
      return;
    }

    const driver = order.driver;
    const driverName = driver
      ? `${driver.firstName ?? ''} ${driver.lastName ?? ''}`.trim()
      : '';

    await this.emailService.sendEmail({
      to: rider.email,
      eventType: EmailEventType.ORDER_COMPLETED,
      variables: {
        firstName: rider.firstName ?? '',
        lastName: rider.lastName ?? '',
        email: rider.email,
        phone: rider.mobileNumber ?? '',
        orderNumber: order.id.toString(),
        amount: order.costAfterCoupon?.toString() ?? '',
        date: order.createdOn?.toISOString() ?? '',
        pickup: order.addresses?.[0] ?? '',
        dropoff: order.addresses?.[order.addresses.length - 1] ?? '',
        driverName,
        vehicleModel: driver?.car?.name ?? '',
        licensePlate: driver?.carPlate ?? '',
      },
    });
  }

  async sendOrderCancelled(order: {
    id: number | string;
    rider?: {
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  }): Promise<void> {
    const rider = order.rider;
    if (!rider?.email) {
      this.logger.debug('Rider has no email, skipping order cancelled email');
      return;
    }

    await this.emailService.sendEmail({
      to: rider.email,
      eventType: EmailEventType.ORDER_CANCELLED,
      variables: {
        firstName: rider.firstName ?? '',
        lastName: rider.lastName ?? '',
        email: rider.email,
        orderNumber: order.id.toString(),
      },
    });
  }

  async sendOrderRefunded(order: {
    id: number | string;
    refundAmount?: number;
    rider?: {
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  }): Promise<void> {
    const rider = order.rider;
    if (!rider?.email) {
      this.logger.debug('Rider has no email, skipping order refunded email');
      return;
    }

    await this.emailService.sendEmail({
      to: rider.email,
      eventType: EmailEventType.ORDER_REFUNDED,
      variables: {
        firstName: rider.firstName ?? '',
        lastName: rider.lastName ?? '',
        email: rider.email,
        orderNumber: order.id.toString(),
        amount: order.refundAmount?.toString() ?? '',
      },
    });
  }

  // ============================================
  // Authentication Events
  // ============================================

  async sendWelcome(customer: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }): Promise<void> {
    if (!customer.email) {
      this.logger.debug('Customer has no email, skipping welcome email');
      return;
    }

    await this.emailService.sendEmail({
      to: customer.email,
      eventType: EmailEventType.AUTH_WELCOME,
      variables: {
        firstName: customer.firstName ?? '',
        lastName: customer.lastName ?? '',
        email: customer.email,
      },
    });
  }

  async sendPasswordReset(
    email: string,
    verificationCode: string,
    firstName?: string,
  ): Promise<void> {
    await this.emailService.sendEmail({
      to: email,
      eventType: EmailEventType.AUTH_PASSWORD_RESET,
      variables: {
        email,
        firstName: firstName ?? '',
        verificationCode,
      },
    });
  }

  async sendVerification(
    email: string,
    verificationCode: string,
    firstName?: string,
  ): Promise<void> {
    await this.emailService.sendEmail({
      to: email,
      eventType: EmailEventType.AUTH_VERIFICATION,
      variables: {
        email,
        firstName: firstName ?? '',
        verificationCode,
      },
    });
  }
}
