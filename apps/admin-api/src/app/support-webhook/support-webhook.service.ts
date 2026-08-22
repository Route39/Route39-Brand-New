import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CustomerEntity,
  DriverEntity,
  DriverNotificationService,
  RiderNotificationService,
} from '@ridy/database';
import { ChatwootWebhookPayload } from './dto/chatwoot-webhook.dto';

@Injectable()
export class SupportWebhookService {
  private readonly logger = new Logger(SupportWebhookService.name);

  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,
    private readonly driverNotificationService: DriverNotificationService,
    private readonly riderNotificationService: RiderNotificationService,
  ) {}

  async handleSupportMessageSent(payload: ChatwootWebhookPayload): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log(
      `Processing support message webhook: ${JSON.stringify(payload)}`,
    );

    // Only process outgoing messages (from agent to user)
    if (payload.message_type !== 'outgoing') {
      this.logger.debug(
        `Skipping non-outgoing message type: ${payload.message_type}`,
      );
      return {
        success: true,
        message: 'Skipped: not an outgoing message',
      };
    }

    // Extract user_type and user_id from conversation.meta.sender.custom_attributes
    const customAttributes =
      payload.conversation?.meta?.sender?.custom_attributes;
    const userType = customAttributes?.user_type;
    const userId = customAttributes?.user_id;

    if (!userType || !userId) {
      this.logger.warn(
        `Missing user_type or user_id in custom_attributes: ${JSON.stringify(customAttributes)}`,
      );
      return {
        success: false,
        message: 'Missing user_type or user_id in custom_attributes',
      };
    }

    // Strip HTML tags and trim whitespace from message content
    const rawContent = payload.content || 'You have a new message from support';
    const messageContent = rawContent
      .replace(/<[^>]*>/g, '')
      .replace(/\n/g, ' ')
      .trim();

    try {
      if (userType === 'passenger') {
        await this.sendNotificationToPassenger(parseInt(userId, 10), messageContent);
      } else if (userType === 'driver') {
        await this.sendNotificationToDriver(parseInt(userId, 10), messageContent);
      } else {
        this.logger.warn(`Unknown user_type: ${userType}`);
        return {
          success: false,
          message: `Unknown user_type: ${userType}`,
        };
      }

      return {
        success: true,
        message: `Notification sent to ${userType} with ID ${userId}`,
      };
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error}`);
      return {
        success: false,
        message: `Failed to send notification: ${error}`,
      };
    }
  }

  private async sendNotificationToPassenger(
    customerId: number,
    message: string,
  ): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      select: ['id', 'notificationPlayerId'],
    });

    if (!customer) {
      this.logger.warn(`Customer not found with ID: ${customerId}`);
      throw new Error(`Customer not found with ID: ${customerId}`);
    }

    if (!customer.notificationPlayerId) {
      this.logger.warn(`Customer ${customerId} has no FCM token`);
      throw new Error(`Customer ${customerId} has no FCM token`);
    }

    this.logger.log(
      `Sending support message notification to passenger ${customerId}`,
    );
    await this.riderNotificationService.message(
      customer.notificationPlayerId,
      message,
    );
  }

  private async sendNotificationToDriver(
    driverId: number,
    message: string,
  ): Promise<void> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
      select: ['id', 'notificationPlayerId'],
    });

    if (!driver) {
      this.logger.warn(`Driver not found with ID: ${driverId}`);
      throw new Error(`Driver not found with ID: ${driverId}`);
    }

    if (!driver.notificationPlayerId) {
      this.logger.warn(`Driver ${driverId} has no FCM token`);
      throw new Error(`Driver ${driverId} has no FCM token`);
    }

    this.logger.log(
      `Sending support message notification to driver ${driverId}`,
    );
    await this.driverNotificationService.message(
      driver.notificationPlayerId,
      message,
    );
  }
}
