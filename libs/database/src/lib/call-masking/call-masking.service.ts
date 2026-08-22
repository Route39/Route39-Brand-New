import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RedisClientType } from 'redis';
import { TaxiOrderEntity } from '../entities/taxi/taxi-order.entity';
import { SMSProviderEntity } from '../entities/sms-provider.entity';
import { SMSProviderType } from '../entities/enums/sms-provider-type.enum';
import { OrderStatus } from '../entities/enums/order-status.enum';
import { CallerType } from './enums/caller-type.enum';
import { CallRoutingResult } from './dto/call-routing-result.dto';
import { CallMaskingConfigDTO } from './dto/call-masking-config.dto';
import { InitiateCallResultDTO } from './dto/initiate-call-result.dto';
import { REDIS } from '../redis';
import * as twilio from 'twilio';

// Statuses where calls are allowed (active order statuses)
const ACTIVE_ORDER_STATUSES = [
  OrderStatus.DriverAccepted,
  OrderStatus.Arrived,
  OrderStatus.Started,
  OrderStatus.WaitingForPostPay,
  OrderStatus.WaitingForReview,
];

// Time window for lost property calls (1 hour in milliseconds)
const LOST_PROPERTY_CALL_WINDOW_MS = 60 * 60 * 1000;

// Redis key prefix for call intents
const CALL_INTENT_PREFIX = 'call_intent:';
const CALL_INTENT_TTL_SECONDS = 1800; // 1800 seconds TTL (30 minutes)

@Injectable()
export class CallMaskingService {
  private readonly logger = new Logger(CallMaskingService.name);

  constructor(
    @Inject(REDIS) private readonly redisClient: RedisClientType,
    @InjectRepository(TaxiOrderEntity)
    private orderRepository: Repository<TaxiOrderEntity>,
    @InjectRepository(SMSProviderEntity)
    private smsProviderRepository: Repository<SMSProviderEntity>,
  ) {}

  /**
   * Get the Twilio SMS provider with call masking configuration
   */
  private async getTwilioProvider(): Promise<SMSProviderEntity | null> {
    return this.smsProviderRepository.findOne({
      where: { type: SMSProviderType.Twilio, isDefault: true },
    });
  }

  /**
   * Get the call masking configuration (masking number and enabled status)
   */
  async getMaskingConfig(): Promise<CallMaskingConfigDTO | null> {
    const provider = await this.getTwilioProvider();
    if (
      !provider ||
      !provider.callMaskingEnabled ||
      !provider.callMaskingNumber
    ) {
      this.logger.warn('Call masking not properly configured');
      return null;
    }
    return {
      enabled: provider.callMaskingEnabled,
      maskingNumber: provider.callMaskingNumber,
    };
  }

  /**
   * Initiate a call masking request - called when user presses "Call" button
   * Stores the call intent in Redis and returns the masking number to dial
   */
  async initiateCall(
    orderId: number,
    callerPhone: string,
    callerType: CallerType,
  ): Promise<InitiateCallResultDTO> {
    // Validate order exists and is active
    const order = await this.orderRepository.findOne({
      where: { id: orderId, status: In(ACTIVE_ORDER_STATUSES) },
      relations: ['driver', 'rider'],
    });

    if (!order) {
      this.logger.warn(`Order not found or not active: ${orderId}`);
      return { success: false, error: 'Order not found or not active' };
    }

    // Determine target based on caller's role
    let targetNumber: string;
    if (callerType === CallerType.DRIVER) {
      // Verify caller is the driver for this order
      if (
        order.driver?.mobileNumber?.toString() !==
        this.normalizePhoneNumber(callerPhone)
      ) {
        this.logger.warn(
          `Driver ${callerPhone} is not assigned to order ${orderId}`,
        );
        return { success: false, error: 'You are not assigned to this order' };
      }
      if (!order.rider?.mobileNumber) {
        return { success: false, error: 'Rider has no phone number' };
      }
      targetNumber = `+${order.rider.mobileNumber}`;
    } else {
      // Verify caller is the rider for this order
      if (
        order.rider?.mobileNumber?.toString() !==
        this.normalizePhoneNumber(callerPhone)
      ) {
        this.logger.warn(
          `Rider ${callerPhone} is not the customer for order ${orderId}`,
        );
        return {
          success: false,
          error: 'You are not the customer for this order',
        };
      }
      if (!order.driver?.mobileNumber) {
        return { success: false, error: 'Driver has no phone number' };
      }
      targetNumber = `+${order.driver.mobileNumber}`;
    }

    // Normalize caller phone and store intent in Redis
    const normalizedCaller = this.normalizePhoneNumber(callerPhone);
    const redisKey = `${CALL_INTENT_PREFIX}${normalizedCaller}`;

    const callIntent = {
      targetNumber,
      orderId: orderId.toString(),
      callerType,
    };

    // Store in Redis with TTL
    await this.redisClient.hSet(redisKey, callIntent);
    await this.redisClient.expire(redisKey, CALL_INTENT_TTL_SECONDS);

    this.logger.log(
      `Call intent registered in Redis: ${normalizedCaller} -> ${targetNumber} for order ${orderId}`,
    );

    const config = await this.getMaskingConfig();
    if (!config?.maskingNumber) {
      return { success: false, error: 'Call masking not configured' };
    }

    return { success: true, maskingNumber: config.maskingNumber };
  }

  /**
   * Route an incoming call from Twilio webhook
   * Looks up the pre-registered call intent from Redis
   */
  async routeCall(fromNumber: string): Promise<CallRoutingResult> {
    const normalizedFrom = this.normalizePhoneNumber(fromNumber);
    this.logger.log(`Routing call from: ${normalizedFrom}`);

    const redisKey = `${CALL_INTENT_PREFIX}${normalizedFrom}`;

    // Look up pre-registered call intent from Redis
    const intent = await this.redisClient.hGetAll(redisKey);

    if (!intent || !intent.targetNumber) {
      this.logger.warn(`No valid call intent found for: ${normalizedFrom}`);
      return {
        success: false,
        error: 'NO_CALL_INTENT',
        message: 'No active call request found. Please try again from the app.',
        twiml: this.generateErrorTwiml(
          'Your call request has expired. Please tap the call button in the app and try again.',
        ),
      };
    }

    // Remove used intent (one-time use)
    await this.redisClient.del(redisKey);

    this.logger.log(
      `Routing ${intent.callerType} to ${intent.targetNumber} for order ${intent.orderId}`,
    );

    return {
      success: true,
      callerType: intent.callerType as CallerType,
      orderId: parseInt(intent.orderId, 10),
      targetNumber: intent.targetNumber,
      twiml: await this.generateCallTwiml(intent.targetNumber),
    };
  }

  /**
   * Check if lost property call is allowed for an order
   * Returns whether call is allowed (within 1 hour of completion) or email should be used
   */
  async checkLostPropertyEligibility(
    orderId: number,
  ): Promise<{ canCall: boolean; finishedAt?: Date }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, status: OrderStatus.Finished },
      select: ['id', 'finishTimestamp'],
    });

    if (!order || !order.finishTimestamp) {
      return { canCall: false };
    }

    const now = new Date();
    const finishedAt = new Date(order.finishTimestamp);
    const timeSinceFinish = now.getTime() - finishedAt.getTime();

    return {
      canCall: timeSinceFinish <= LOST_PROPERTY_CALL_WINDOW_MS,
      finishedAt,
    };
  }

  /**
   * Initiate a lost property call - for contacting driver/rider after ride completion
   * Only allowed within 1 hour of ride completion
   */
  async initiateLostPropertyCall(
    orderId: number,
    callerPhone: string,
    callerType: CallerType,
  ): Promise<InitiateCallResultDTO> {
    // Find finished order
    const order = await this.orderRepository.findOne({
      where: { id: orderId, status: OrderStatus.Finished },
      relations: ['driver', 'rider'],
    });

    if (!order) {
      this.logger.warn(`Finished order not found: ${orderId}`);
      return { success: false, error: 'Order not found or not finished' };
    }

    // Check if within 1 hour window
    if (!order.finishTimestamp) {
      return { success: false, error: 'Order finish time not available' };
    }

    const now = new Date();
    const finishedAt = new Date(order.finishTimestamp);
    const timeSinceFinish = now.getTime() - finishedAt.getTime();

    if (timeSinceFinish > LOST_PROPERTY_CALL_WINDOW_MS) {
      this.logger.warn(
        `Lost property call not allowed - order ${orderId} finished more than 1 hour ago`,
      );
      return {
        success: false,
        error: 'Call window expired. Please use email to contact about lost property.',
      };
    }

    // Determine target based on caller's role
    let targetNumber: string;
    if (callerType === CallerType.DRIVER) {
      // Verify caller is the driver for this order
      if (
        order.driver?.mobileNumber?.toString() !==
        this.normalizePhoneNumber(callerPhone)
      ) {
        this.logger.warn(
          `Driver ${callerPhone} is not assigned to order ${orderId}`,
        );
        return { success: false, error: 'You are not assigned to this order' };
      }
      if (!order.rider?.mobileNumber) {
        return { success: false, error: 'Rider has no phone number' };
      }
      targetNumber = `+${order.rider.mobileNumber}`;
    } else {
      // Verify caller is the rider for this order
      if (
        order.rider?.mobileNumber?.toString() !==
        this.normalizePhoneNumber(callerPhone)
      ) {
        this.logger.warn(
          `Rider ${callerPhone} is not the customer for order ${orderId}`,
        );
        return {
          success: false,
          error: 'You are not the customer for this order',
        };
      }
      if (!order.driver?.mobileNumber) {
        return { success: false, error: 'Driver has no phone number' };
      }
      targetNumber = `+${order.driver.mobileNumber}`;
    }

    // Normalize caller phone and store intent in Redis
    const normalizedCaller = this.normalizePhoneNumber(callerPhone);
    const redisKey = `${CALL_INTENT_PREFIX}${normalizedCaller}`;

    const callIntent = {
      targetNumber,
      orderId: orderId.toString(),
      callerType,
      purpose: 'lost_property',
    };

    // Store in Redis with TTL
    await this.redisClient.hSet(redisKey, callIntent);
    await this.redisClient.expire(redisKey, CALL_INTENT_TTL_SECONDS);

    this.logger.log(
      `Lost property call intent registered: ${normalizedCaller} -> ${targetNumber} for order ${orderId}`,
    );

    const config = await this.getMaskingConfig();
    if (!config?.maskingNumber) {
      return { success: false, error: 'Call masking not configured' };
    }

    return { success: true, maskingNumber: config.maskingNumber };
  }

  /**
   * Validate Twilio webhook signature for security
   */
  async validateWebhookSignature(
    signature: string,
    url: string,
    params: Record<string, string>,
  ): Promise<boolean> {
    const provider = await this.getTwilioProvider();
    if (!provider?.authToken) {
      this.logger.warn(
        'Twilio auth token not configured, skipping signature validation',
      );
      return true; // Skip validation if not configured (dev mode)
    }

    try {
      return twilio.validateRequest(provider.authToken, signature, url, params);
    } catch (error) {
      this.logger.error('Failed to validate Twilio signature', error);
      return false;
    }
  }

  /**
   * Normalize phone number by removing + prefix and non-digit characters
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    return phoneNumber.replace(/\D/g, '');
  }

  /**
   * Generate TwiML for connecting a call
   */
  private async generateCallTwiml(targetNumber: string): Promise<string> {
    const provider = await this.getTwilioProvider();
    const callerId = provider?.callMaskingNumber || provider?.fromNumber;

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    response.say({ voice: 'alice' }, 'For safety, all calls are recorded.');
    const dial = response.dial({
      callerId: callerId,
      timeout: 30,
      answerOnBridge: true,
    });
    dial.number(targetNumber);

    return response.toString();
  }

  /**
   * Generate TwiML for error messages
   */
  private generateErrorTwiml(message: string): string {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    response.say({ voice: 'alice' }, message);
    response.hangup();

    return response.toString();
  }
}
