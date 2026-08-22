import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ActiveOrderCommonRedisService,
  ActiveOrderRedisSnapshot,
  AnnouncementUserType,
  ChatMessageRedisSnapshot,
  DriverEventType,
  DriverRedisService,
  GoogleServicesService,
  OrderCancelReasonEntity,
  PaymentMode,
  PubSubService,
  RequestActivityType,
  RiderEphemeralMessageType,
  RiderNotificationService,
  RiderOrderUpdateType,
  RiderRedisService,
  SharedOrderService,
  WaypointBase,
  DriverEphemeralMessageType,
  REDIS,
  PricingMode,
  SharedCustomerService,
  DriverReviewEntity,
} from '@ridy/database';
import { OrderStatus } from '@ridy/database';
import { PaymentStatus } from '@ridy/database';
import { PaymentEntity } from '@ridy/database';
import { RequestActivityEntity } from '@ridy/database';
import { TaxiOrderEntity } from '@ridy/database';
import { RideOfferRedisService } from '@ridy/database';
import { ServiceEntity, ServiceService, RangePolicy } from '@ridy/database';
import { ForbiddenError } from '@nestjs/apollo';
import { firstValueFrom } from 'rxjs';
import { In, Repository } from 'typeorm';
import { DriverEntity } from '@ridy/database';
import { RiderReviewInput } from './dto/rider-review.input';
import { RiderReviewEntity } from '@ridy/database';
import { CustomerEntity } from '@ridy/database';
import { ActiveOrderDTO } from './dto/active-order.dto';
import { UpdateStatusDTO } from './dto/update-status.dto';
import { PastOrderDTO } from './dto/past-order.dto';
import { OrderCancelReasonDTO } from './dto/cancel-reason.dto';
import { RedisClientType } from 'redis';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(TaxiOrderEntity)
    public orderRepository: Repository<TaxiOrderEntity>,
    @InjectRepository(RequestActivityEntity)
    public activityRepository: Repository<RequestActivityEntity>,
    @InjectRepository(PaymentEntity)
    public paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(RiderReviewEntity)
    public reviewRepository: Repository<RiderReviewEntity>,
    @InjectRepository(DriverReviewEntity)
    public driverReviewRepository: Repository<DriverReviewEntity>,
    @InjectRepository(DriverEntity)
    public driverRepository: Repository<DriverEntity>,
    @InjectRepository(CustomerEntity)
    public riderRepository: Repository<CustomerEntity>,
    @InjectRepository(OrderCancelReasonEntity)
    public cancelReasonRepository: Repository<OrderCancelReasonEntity>,
    @InjectRepository(ServiceEntity)
    public serviceRepository: Repository<ServiceEntity>,
    private googleServices: GoogleServicesService,
    private sharedOrderService: SharedOrderService,
    private serviceService: ServiceService,
    private rideOfferRedisService: RideOfferRedisService,
    private activeOrderRedisService: ActiveOrderCommonRedisService,
    private readonly driverRedisService: DriverRedisService,
    private riderRedisService: RiderRedisService,
    private readonly pubsub: PubSubService,
    private httpService: HttpService,
    private riderNotificationService: RiderNotificationService,
    private sharedCustomerService: SharedCustomerService,
    @Inject(REDIS) private readonly redisClient: RedisClientType,
  ) {}

  async submitReview(
    input: RiderReviewInput & { driverId: number },
  ): Promise<void> {
    const order = await this.orderRepository.findOneBy({
      id: input.orderId,
      driverId: input.driverId,
    });
    if (order == null) {
      throw new ForbiddenError('ORDER_NOT_FOUND');
    }
    if (order.status != OrderStatus.Finished) {
      throw new ForbiddenError('ORDER_NOT_FINISHED');
    }
    const review = await this.reviewRepository.findOneBy({
      orderId: order.id,
    });
    if (review != null) {
      throw new ForbiddenError('ALREADY_REVIEWED');
    }
    const rider = await this.riderRepository.findOneBy({
      id: order.riderId,
    });
    if (rider == null) {
      throw new ForbiddenError('RIDER_NOT_FOUND');
    }
    const newReview = this.reviewRepository.create({
      orderId: order.id,
      riderId: rider.id,
      driverId: order.driverId,
      score: input.score,
      description: input.description,
    });
    await this.reviewRepository.save(newReview);

    // Recalculate and update customer's rating aggregate
    const reviews = await this.reviewRepository.find({
      where: { riderId: rider.id },
    });
    const averageRating = Math.round(
      reviews.reduce((total, next) => total + next.score, 0) / reviews.length,
    );
    await this.sharedCustomerService.setRating(
      rider.id,
      averageRating,
      reviews.length,
    );
  }

  async acceptRideOffer(input: {
    orderId: number;
    driverId: number;
  }): Promise<ActiveOrderDTO> {
    // Distributed lock configuration
    const lockKey = `lock:order:${input.orderId}`;
    const lockValue = `driver:${input.driverId}:${Date.now()}`;
    const lockTTL = 30; // 30 seconds timeout to cover Google API calls

    // Acquire distributed lock
    const lockAcquired = await this.redisClient.set(lockKey, lockValue, {
      NX: true, // Only set if key doesn't exist
      EX: lockTTL, // Set expiration in seconds
    });

    if (!lockAcquired) {
      throw new ForbiddenError('ORDER_ALREADY_BEING_ACCEPTED');
    }

    try {
      // Re-verify the offer still exists (inside lock)
      const orderMetadata =
        await this.rideOfferRedisService.getRideOfferMetadata(
          input.orderId.toString(),
        );

      if (!orderMetadata) {
        throw new ForbiddenError(`ORDER_ALREADY_TAKEN`);
      }

      if (
        !orderMetadata.offeredToDriverIds.includes(input.driverId.toString())
      ) {
        throw new ForbiddenError('ORDER_NOT_OFFERED_TO_DRIVER');
      }

      // Fetch driver and rider metadata
      const driver = await this.driverRedisService.getOnlineDriverMetaData(
        input.driverId.toString(),
      );
      if (driver == null) {
        throw new ForbiddenError(`Driver with ID ${input.driverId} not found`);
      }

      const rider = await this.riderRedisService.getOnlineRider(
        orderMetadata.riderId,
      );

      // Calculate ETAs with Google Services
      const driverTravelMetrics =
        driver?.location != null
          ? await this.googleServices.getSumDistanceAndDuration([
              driver.location,
              orderMetadata.waypoints[0].location,
            ])
          : { distance: 0, duration: 0, directions: [] };

      const tripTravelMetrics =
        await this.googleServices.getSumDistanceAndDuration(
          orderMetadata.waypoints.map((w) => w.location),
        );

      const pickupEta = new Date(
        new Date().getTime() + driverTravelMetrics.duration * 1000,
      );
      const dropoffEta = new Date(
        pickupEta.getTime() + tripTravelMetrics.duration * 1000,
      );

      // Accept offer in Redis
      await this.rideOfferRedisService.acceptOfferByDriver({
        orderId: input.orderId.toString(),
        driverId: input.driverId.toString(),
        driverFirstName: driver.firstName ?? null,
        driverAvatarUrl: driver.avatarImageAddress ?? null,
        riderFirstName: rider?.firstName ?? null,
        riderAvatarUrl: rider?.profileImageUrl ?? null,
        pickupEta,
        dropoffEta,
        driverDirections: driverTravelMetrics.directions,
      });

      // CRITICAL FIX: Await the database update
      await this.orderRepository.update(input.orderId, {
        status: OrderStatus.DriverAccepted,
        driverId: input.driverId,
      });

      // Notify all drivers that the offer is revoked
      for (const driverId of orderMetadata.offeredToDriverIds) {
        this.pubsub.publish(
          'driver.event',
          {
            driverId: parseInt(driverId),
          },
          {
            type: DriverEventType.RideOfferRevoked,
            orderId: input.orderId,
            driverId: parseInt(driverId),
          },
        );
      }

      // Notify rider
      if (rider?.fcmTokens?.[0]) {
        this.riderNotificationService.accepted(rider?.fcmTokens?.[0]);
      }

      // Publish rider order update
      this.pubsub.publish(
        'rider.order.updated',
        {
          riderId: parseInt(rider!.id),
        },
        {
          type: RiderOrderUpdateType.DriverAssigned,
          driver: {
            ...driver,
            mobileNumber: driver!.mobileNumber,
            fullName: driver!.firstName ?? null,
            profileImageUrl: driver!.avatarImageAddress,
            vehicleName: driver!.vehicleName,
            vehicleColor: driver!.vehicleColor,
            vehiclePlate: driver!.vehiclePlate,
            location: driver!.location,
          },
          orderId: input.orderId,
          status: OrderStatus.DriverAccepted,
          driverLocation: driver.location,
          pickupEta: pickupEta,
          directions: tripTravelMetrics.directions,
          riderId: parseInt(rider!.id),
        },
      );

      // Retrieve and return active order
      const activeOrder = await this.activeOrderRedisService.getActiveOrder(
        input.orderId.toString(),
      );
      const dto = this.convertToActiveOrderDTO(activeOrder, rider);
      return dto;
    } finally {
      // Release lock (only if we still own it)
      const currentLock = await this.redisClient.get(lockKey);
      if (currentLock === lockValue) {
        await this.redisClient.del(lockKey);
      }
    }
  }

  async rejectRideOffer(input: {
    orderId: number;
    driverId: number;
  }): Promise<boolean> {
    await this.rideOfferRedisService.rideOfferRejected({
      orderId: input.orderId.toString(),
      driverId: input.driverId.toString(),
    });
    return true;
  }

  async arrivedToPickup(input: {
    orderId: number;
    driverId: number;
  }): Promise<UpdateStatusDTO> {
    const order = await this.activeOrderRedisService.getActiveOrder(
      input.orderId.toString(),
    );
    await this.activeOrderRedisService.updateOrderStatus(
      input.orderId.toString(),
      {
        status: OrderStatus.Arrived,
      },
    );
    this.activityRepository.insert({
      requestId: parseInt(order.id),
      type: RequestActivityType.ArrivedToPickupPoint,
    });
    this.orderRepository.update(order.id, { status: OrderStatus.Arrived });

    const rider = await this.riderRedisService.getOnlineRider(order.riderId);
    this.pubsub.publish(
      'rider.order.updated',
      {
        riderId: parseInt(order.riderId),
      },
      {
        type: RiderOrderUpdateType.StatusUpdated,
        orderId: input.orderId,
        riderId: parseInt(order.riderId),
        status: OrderStatus.Arrived,
      },
    );
    this.riderNotificationService.arrived(rider?.fcmTokens?.[0]);
    return {
      orderId: input.orderId,
      status: OrderStatus.Arrived,
    };
  }

  async initiateRide(input: {
    orderId: number;
    driverId: number;
  }): Promise<UpdateStatusDTO> {
    const order = await this.activeOrderRedisService.getActiveOrder(
      input.orderId.toString(),
    );
    const driver = await this.driverRedisService.getOnlineDriverMetaData(
      input.driverId.toString(),
    );
    order.currentLegIndex = 1;
    const rider = await this.riderRedisService.getOnlineRider(order.riderId);
    this.orderRepository.update(order.id, { status: OrderStatus.Started });
    await this.activeOrderRedisService.updateOrderStatus(
      input.orderId.toString(),
      {
        status: OrderStatus.Started,
        currentLegIndex: 1,
        // Initialize actual distance/duration tracking
        actualDistance: 0,
        actualDuration: 0,
        rideStartTime: Date.now(),
        lastTrackingPoint: driver?.location,
      },
    );
    this.pubsub.publish(
      'rider.order.updated',
      {
        riderId: parseInt(order.riderId),
      },
      {
        type: RiderOrderUpdateType.StatusUpdated,
        orderId: input.orderId,
        riderId: parseInt(order.riderId),
        status: OrderStatus.Started,
        directions: order.tripDirections,
      },
    );
    this.riderNotificationService.started(rider?.fcmTokens?.[0]);
    return {
      orderId: input.orderId,
      status: OrderStatus.Started,
      directions: order.tripDirections,
      nextDestination:
        this.createNextDestination(order.waypoints, order.currentLegIndex) ??
        undefined,
    };
  }

  async arrivedToDestination(input: {
    orderId: number;
    driverId: number;
  }): Promise<UpdateStatusDTO> {
    Logger.debug(
      `Driver ${input.driverId} arrived to destination for order ${input.orderId}`,
      'OrderService.arrivedToDestination',
    );

    let order = await this.activeOrderRedisService.getActiveOrder(
      input.orderId.toString(),
    );
    if (order.driverId !== input.driverId.toString()) {
      throw new Error('Driver is not authorized to update this order');
    }
    const nextDestination = this.createNextDestination(
      order.waypoints,
      order.currentLegIndex,
    );
    const isLastArrivalLeg =
      order.currentLegIndex >= order.waypoints.length - 1;

    Logger.debug(
      `Order ${input.orderId}: isLastArrivalLeg=${isLastArrivalLeg}, currentLegIndex=${order.currentLegIndex}, waypoints=${order.waypoints.length}`,
      'OrderService.arrivedToDestination',
    );

    if (isLastArrivalLeg) {
      this.activityRepository.insert({
        requestId: parseInt(order.id),
        type: RequestActivityType.ArrivedToDestination,
      });

      // Calculate actual duration from ride start time (for analytics only)
      const actualDurationSeconds = order.rideStartTime
        ? Math.round((Date.now() - order.rideStartTime) / 1000)
        : 0;

      // IMPORTANT: Use estimated values for pricing calculations
      // Actual tracked values are stored separately for analytics, dispute resolution,
      // and potential future pricing models - but do NOT affect current pricing
      const distanceForPricing = order.estimatedDistance;
      const durationForPricing = order.estimatedDuration;

      // Actual tracked values (for analytics/records only)
      const actualDistanceTracked = order.actualDistance ?? 0;
      const actualDurationTracked =
        actualDurationSeconds > 0 ? actualDurationSeconds : 0;

      Logger.debug(
        `Order ${order.id}: actualDistance=${actualDistanceTracked}m, estimatedDistance=${distanceForPricing}m, actualDuration=${actualDurationTracked}s, estimatedDuration=${durationForPricing}s (using estimates for pricing)`,
        'OrderService.arrivedToDestination',
      );

      // Update Redis with actual tracked values for analytics
      // Note: distance/duration fields use estimates for backward compatibility
      await this.activeOrderRedisService.updateOrderStatus(order.id, {
        distance: distanceForPricing.toString(),
        duration: durationForPricing.toString(),
        actualDistance: actualDistanceTracked,
        actualDuration: actualDurationTracked,
      });

      // Check if service uses RANGE pricing mode
      const dbOrder = await this.orderRepository.findOne({
        where: { id: parseInt(order.id) },
        relations: { service: true, options: true },
      });

      if (dbOrder?.service?.pricingMode === PricingMode.RANGE) {
        // For RANGE pricing, don't finish yet - wait for driver to enter fee
        Logger.log(
          `Order ${order.id} uses RANGE pricing - waiting for driver fee input`,
          'OrderService.arrivedToDestination',
        );

        // Use estimated values for pricing calculations (not actual tracked values)
        const distance = distanceForPricing;
        const duration = durationForPricing;

        Logger.debug(
          `Calculating cost range for order ${order.id} with estimated distance=${distance}m, duration=${duration}s`,
          'OrderService.arrivedToDestination',
        );

        // Calculate option fees from database order
        const optionFee = (dbOrder.options ?? [])
          .map((opt) => opt.additionalFee ?? 0)
          .reduce((sum, fee) => sum + fee, 0);

        const waitMinutes =
          typeof order.waitMinutes === 'string'
            ? parseInt(order.waitMinutes)
            : (order.waitMinutes ?? 0);

        const costCalculation = this.serviceService.calculateCost(
          dbOrder.service,
          distance,
          duration,
          new Date(),
          1, // fleetMultiplier - already applied in original calculation
          waitMinutes,
          optionFee,
        );

        // Calculate fee range, ensuring we have valid values
        const minFee =
          costCalculation.min ??
          costCalculation.cost * dbOrder.service.priceRangeMinPercent;
        const maxFee =
          costCalculation.max ??
          costCalculation.cost * dbOrder.service.priceRangeMaxPercent;

        // Validate that we have valid fee range values
        if (!Number.isFinite(minFee) || !Number.isFinite(maxFee)) {
          Logger.error(
            `Invalid fee range calculated for order ${order.id}: min=${minFee}, max=${maxFee}, cost=${costCalculation.cost}`,
            'OrderService.arrivedToDestination',
          );
          throw new Error(
            `Unable to calculate fee range for order ${order.id}. Please ensure distance and duration are properly tracked.`,
          );
        }

        Logger.log(
          `Fee range for order ${order.id}: ${minFee} - ${maxFee}`,
          'OrderService.arrivedToDestination',
        );

        // Update order status to WaitingForDriverFee
        await this.activeOrderRedisService.updateOrderStatus(order.id, {
          status: OrderStatus.WaitingForDriverFee,
          // Store the range in Redis for later validation
          costMin: minFee,
          costMax: maxFee,
        });

        this.pubsub.publish(
          'rider.order.updated',
          {
            riderId: parseInt(order.riderId),
          },
          {
            type: RiderOrderUpdateType.StatusUpdated,
            orderId: parseInt(order.id),
            riderId: parseInt(order.riderId),
            status: OrderStatus.WaitingForDriverFee,
          },
        );

        return {
          orderId: input.orderId,
          totalCost: null,
          status: OrderStatus.WaitingForDriverFee,
          nextDestination: undefined,
        };
      }

      // For FIXED pricing mode, proceed with normal finish flow
      const finishResult = await this.sharedOrderService.finish(
        parseInt(order.id),
        0,
        true,
      );
      if (finishResult == null) {
        // Order settled immediately — send ephemeral review prompts, notify both sides
        this.askRiderForReview(order);
        this.pubsub.publish(
          'rider.order.updated',
          { riderId: parseInt(order.riderId) },
          {
            type: RiderOrderUpdateType.OrderCompleted,
            orderId: parseInt(order.id),
            riderId: parseInt(order.riderId),
            status: OrderStatus.Finished,
          },
        );
        this.pubsub.publish(
          'driver.event',
          { driverId: parseInt(order.driverId) },
          {
            type: DriverEventType.ActiveOrderCompleted,
            orderId: parseInt(order.id),
            driverId: parseInt(order.driverId),
          },
        );
      } else {
        // Order needs post-pay — notify rider to pay, driver to wait
        this.pubsub.publish(
          'rider.order.updated',
          { riderId: parseInt(order.riderId) },
          {
            type: RiderOrderUpdateType.StatusUpdated,
            orderId: parseInt(order.id),
            riderId: parseInt(order.riderId),
            status: OrderStatus.WaitingForPostPay,
          },
        );
        this.pubsub.publish(
          'driver.event',
          { driverId: parseInt(order.driverId) },
          {
            type: DriverEventType.ActiveOrderUpdated,
            orderId: parseInt(order.id),
            driverId: parseInt(order.driverId),
            status: OrderStatus.WaitingForPostPay,
          },
        );
      }
      return {
        orderId: input.orderId,
        totalCost: finishResult == null ? null : order.costEstimateForRider,
        status:
          finishResult == null
            ? OrderStatus.Finished
            : OrderStatus.WaitingForPostPay,
        nextDestination:
          finishResult == null ? null : (nextDestination ?? undefined),
      };
    } else {
      this.pubsub.publish(
        'rider.order.updated',
        {
          riderId: parseInt(order.riderId),
        },
        {
          type: RiderOrderUpdateType.StatusUpdated,
          orderId: input.orderId,
          riderId: parseInt(order.riderId),
          status: OrderStatus.Started,
          nextDestination: nextDestination ?? undefined,
        },
      );
      Logger.debug(
        `Order ${input.orderId} continuing to next leg ${order.currentLegIndex + 1}`,
        'OrderService.arrivedToDestination',
      );

      await this.activeOrderRedisService.updateOrderStatus(
        input.orderId.toString(),
        {
          currentLegIndex: order.currentLegIndex + 1,
        },
      );
      return {
        orderId: input.orderId,
        status: OrderStatus.Started,
        nextDestination: nextDestination ?? undefined,
      };
    }
  }

  private async askRiderForReview(order: ActiveOrderRedisSnapshot) {
    const [driver, rider] = await Promise.all([
      this.driverRedisService.getOnlineDriverMetaData(order.driverId),
      this.riderRedisService.getOnlineRider(order.riderId),
    ]);
    await Promise.all([
      this.riderRedisService.createEphemeralMessage(order.riderId, {
        type: RiderEphemeralMessageType.RateDriver,
        orderId: parseInt(order.id),
        serviceImageUrl: order.serviceImageAddress,
        serviceName: order.serviceName,
        vehicleName: driver?.vehicleName ?? null,
        driverFullName: driver?.firstName ?? order.driverFirstName ?? null,
        driverProfileUrl: driver?.avatarImageAddress ?? order.driverAvatarUrl ?? null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      }),
      this.driverRedisService.createEphemeralMessage(order.driverId, {
        type: DriverEphemeralMessageType.RateRider,
        orderId: parseInt(order.id),
        serviceImageUrl: order.serviceImageAddress,
        serviceName: order.serviceName,
        riderFullName: rider?.firstName ?? order.riderFirstName ?? null,
        riderProfileUrl: rider?.profileImageUrl ?? order.riderAvatarUrl ?? null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      }),
    ]);
  }

  private createNextDestination(
    waypoints: WaypointBase[],
    currentLegIndex: number,
  ): WaypointBase | null {
    if (!waypoints || waypoints.length === 0) {
      return null;
    }
    const nextPlace =
      waypoints[currentLegIndex] ?? waypoints[waypoints.length - 1] ?? null;
    return nextPlace;
  }

  async getActiveOrders(driverId: number): Promise<ActiveOrderDTO[]> {
    const driverMeta = await this.driverRedisService.getOnlineDriverMetaData(
      driverId.toString(),
    );
    Logger.debug(driverMeta);
    if (
      !driverMeta ||
      !Array.isArray(driverMeta.activeOrderIds) ||
      driverMeta.activeOrderIds.length === 0
    ) {
      return [];
    }
    const orders = await this.activeOrderRedisService.getActiveOrders(
      driverMeta.activeOrderIds,
    );

    return Promise.all(
      orders.map(async (order) => {
        const rider = await this.riderRedisService.getOnlineRider(
          order.riderId.toString(),
        );
        return this.convertToActiveOrderDTO(order, rider);
      }),
    );
  }

  private convertToActiveOrderDTO(
    order: ActiveOrderRedisSnapshot,
    rider: any,
  ): ActiveOrderDTO {
    const chatMessages = Array.isArray(order?.chatMessages)
      ? order.chatMessages
      : [];
    const waypoints = Array.isArray(order?.waypoints) ? order.waypoints : [];
    const currentLegIndex = Math.max(
      0,
      Math.min(
        Number(order?.currentLegIndex ?? 0),
        Math.max(0, waypoints.length - 1),
      ),
    );

    // Choose directions based on status with fallbacks
    const status = order?.status;
    const driverDirections = Array.isArray(order?.driverDirections)
      ? order.driverDirections
      : [];
    const tripDirections = Array.isArray(order?.tripDirections)
      ? order.tripDirections
      : [];
    const directions = [
      OrderStatus.DriverAccepted,
      OrderStatus.Arrived,
    ].includes(status)
      ? driverDirections.length
        ? driverDirections
        : tripDirections
      : tripDirections.length
        ? tripDirections
        : driverDirections;

    // Compute next destination safely
    const nextDestination = this.createNextDestination(
      waypoints,
      currentLegIndex,
    );
    const unreadMessagesCount = chatMessages.filter(
      (msg: any) => !msg.isFromDriver && msg.seenByDriverAt == null,
    ).length;

    return {
      id: parseInt(order.id),
      type: order.type,
      waitMinutes: order.waitMinutes,
      currency: order.currency,
      rider: rider
        ? {
            fullName: rider.firstName,
            mobileNumber: rider.mobileNumber,
            profileImageUrl: rider.avatarImageAddress,
          }
        : undefined,
      createdAt: order.createdAt,
      estimatedDistance: order.estimatedDistance,
      estimatedDuration: order.estimatedDuration,
      scheduledAt: order.scheduledAt,
      pickupEta: order.pickupEta,
      dropoffEta: order.dropoffEta,
      status: order.status,
      serviceName: order.serviceName,
      serviceImageAddress: order.serviceImageAddress,
      chatMessages: chatMessages.map((msg: ChatMessageRedisSnapshot) => ({
        message: msg.content,
        createdAt: msg.createdAt != null ? new Date(msg.createdAt) : new Date(),
        isFromMe: msg.isFromDriver,
      })),
      options: order.options ?? [],
      waypoints: waypoints,
      totalCost: order.costEstimateForDriver ?? 0,
      costResult:
        order?.pricingMode === PricingMode.RANGE &&
        order?.costMin != null &&
        order?.costMax != null
          ? {
              cost: order.costEstimateForDriver ?? 0,
              min: order.costMin,
              max: order.costMax,
              mode: PricingMode.RANGE,
              rangePolicy: order.rangePolicy!,
            }
          : {
              cost: order.costEstimateForDriver ?? 0,
              mode: PricingMode.FIXED,
            },
      paymentMethod: order.paymentMethod,
      couponDiscount: order.couponDiscount,
      directions: directions ?? [],
      unreadMessagesCount,
      nextDestination: nextDestination ?? undefined,
    };
  }

  async cancelRide(input: {
    orderId: number;
    driverId: number;
    reasonId: number;
    reasonNote: string | null;
  }): Promise<UpdateStatusDTO> {
    const order = await this.activeOrderRedisService.getActiveOrder(
      input.orderId.toString(),
    );
    if (!order) {
      throw new Error(`Order with ID ${input.orderId} not found`);
    }
    if (order.driverId !== input.driverId.toString()) {
      throw new Error(
        `Driver with ID ${input.driverId} is not assigned to order ${input.orderId}`,
      );
    }
    await this.orderRepository.update(order.id, {
      status: OrderStatus.DriverCanceled,
      finishTimestamp: new Date(),
      costAfterCoupon: 0,
    });
    const payments = await this.paymentRepository.find({
      where: {
        userType: 'rider',
        userId: order.riderId.toString(),
        status: PaymentStatus.Authorized,
        orderNumber: order.id.toString(),
      },
      order: { id: 'DESC' },
    });
    for (const payment of payments) {
      await firstValueFrom(
        this.httpService.get<{ status: 'OK' | 'FAILED' }>(
          `${process.env.GATEWAY_SERVER_URL}/cancel_preauth?id=${payment.transactionNumber}`,
        ),
      );
    }
    this.closeOrder(order, OrderStatus.DriverCanceled);
    return {
      orderId: input.orderId,
      status: OrderStatus.DriverCanceled,
    };
  }

  async getPastOrders(
    driverId: number,
    page: number | undefined,
    limit: number | undefined,
  ): Promise<PastOrderDTO[]> {
    const orders = await this.orderRepository.find({
      where: {
      driverId,
      status: In([
        OrderStatus.Finished,
        OrderStatus.DriverCanceled,
        OrderStatus.RiderCanceled,
        OrderStatus.Expired,
      ]),
    },
      order: { id: 'DESC' },
      take: limit,
      skip: page ? page * (limit ?? 0) : 0,
      relations: {
        service: true,
        options: true,
        rider: {
          media: true,
        },
      },
    });
    return orders.map((order) => {
      return {
        id: order.id,
        type: order.type,
        waitMinutes: order.waitMinutes,
        currency: order.currency,
        createdAt: order.createdOn,
        rider: {
          firstName: order.rider?.firstName,
          profileImageUrl: order.rider?.media?.address,
        },
        estimatedDistance: order.distanceBest,
        estimatedDuration: order.durationBest,
        scheduledAt: order.expectedTimestamp,
        pickupEta: order.pickupEta,
        dropoffEta: order.dropOffEta,
        status: order.status,
        serviceName: order.service?.name ?? '-',
        serviceImageAddress: order.service?.media.address ?? '',
        options: order.options ?? [],
        waypoints:
          order.points.map((point) => ({
            point: point,
            address: order.addresses[order.points.indexOf(point)],
          })) ?? [],
        totalCost: order.costAfterCoupon - (order.providerShare ?? 0),
        paymentMode: order.paymentMode ?? PaymentMode.Cash,
        directions: order.directions ?? [],
      };
    });
  }

  async getCancelReasons(): Promise<OrderCancelReasonDTO[]> {
    const cancelReasons = await this.cancelReasonRepository.find({
      where: { isEnabled: true, userType: AnnouncementUserType.Driver },
    });
    return cancelReasons.map((reason) => ({
      id: reason.id,
      title: reason.title,
    }));
  }

  private async closeOrder(
    order: ActiveOrderRedisSnapshot,
    status: OrderStatus,
  ) {
    this.sharedOrderService.saveActiveOrderToDisk({
      ...order,
      status,
    });
    this.pubsub.publish(
      'rider.order.updated',
      {
        riderId: parseInt(order.riderId),
      },
      {
        type:
          status === OrderStatus.Finished
            ? RiderOrderUpdateType.OrderCompleted
            : status === OrderStatus.DriverCanceled
              ? RiderOrderUpdateType.DriverCancelled
              : RiderOrderUpdateType.OrderCompleted,
        orderId: parseInt(order.id),
        riderId: parseInt(order.riderId),
        status: status,
      },
    );
    if (status === OrderStatus.Finished) {
      this.askRiderForReview(order);
    }
    if (status === OrderStatus.DriverCanceled) {
      await this.riderRedisService.createEphemeralMessage(order.riderId, {
        type: RiderEphemeralMessageType.DriverCanceled,
        orderId: parseInt(order.id),
        serviceImageUrl: order!.serviceImageAddress,
        serviceName: order.serviceName,
        vehicleName: null,
        driverFullName: null,
        driverProfileUrl: null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      });
    }
    await this.activeOrderRedisService.deleteOrder(order.id);
  }

  async riderPaidInCash(input: {
    orderId: number;
    driverId: number;
  }): Promise<UpdateStatusDTO> {
    let order = await this.activeOrderRedisService.getActiveOrder(
      input.orderId.toString(),
    );
    if (!order) {
      throw new Error(`Order with ID ${input.orderId} not found`);
    }
    if (order.driverId !== input.driverId.toString()) {
      throw new Error(
        `Driver with ID ${input.driverId} is not assigned to order ${input.orderId}`,
      );
    }
    await this.activeOrderRedisService.updateOrderStatus(
      input.orderId.toString(),
      {
        paymentMethod: {
          mode: PaymentMode.Cash,
        },
      },
    );
    // Call finish with the full cost as cash amount to properly settle wallets
    // This ensures commission is deducted from driver and balance check is performed
    await this.sharedOrderService.finish(
      input.orderId,
      order.costEstimateForRider, // The full amount was paid in cash
      false,
    );
    // Trigger rating dialog for both sides
    this.askRiderForReview(order);
    // Notify rider the order is complete (moves them off payment screen + triggers ephemeral fetch)
    this.pubsub.publish(
      'rider.order.updated',
      { riderId: parseInt(order.riderId) },
      {
        type: RiderOrderUpdateType.OrderCompleted,
        orderId: input.orderId,
        riderId: parseInt(order.riderId),
        status: OrderStatus.Finished,
      },
    );
    // Notify driver order is complete (triggers ephemeral fetch for rate-rider sheet)
    this.pubsub.publish(
      'driver.event',
      { driverId: parseInt(order.driverId) },
      {
        type: DriverEventType.ActiveOrderCompleted,
        orderId: input.orderId,
        driverId: parseInt(order.driverId),
      },
    );
    return {
      status: OrderStatus.Finished,
      orderId: input.orderId,
    };
  }

  async submitOrderFee(input: {
    orderId: number;
    driverId: number;
    fee: number;
  }): Promise<UpdateStatusDTO> {
    Logger.log(
      `Driver ${input.driverId} submitting fee ${input.fee} for order ${input.orderId}`,
      'OrderService.submitOrderFee',
    );

    // 1) Validate order exists and is in WaitingForDriverFee status
    const order = await this.activeOrderRedisService.getActiveOrder(
      input.orderId.toString(),
    );
    if (!order) {
      throw new ForbiddenError(`Order with ID ${input.orderId} not found`);
    }
    if (order.driverId !== input.driverId.toString()) {
      throw new ForbiddenError(
        `Driver with ID ${input.driverId} is not assigned to order ${input.orderId}`,
      );
    }
    if (order.status !== OrderStatus.WaitingForDriverFee) {
      throw new ForbiddenError(
        `Order ${input.orderId} is not waiting for driver fee (current status: ${order.status})`,
      );
    }

    // 2) Load service to check range policy
    const dbOrder = await this.orderRepository.findOne({
      where: { id: input.orderId },
      relations: { service: true },
    });
    if (!dbOrder?.service) {
      throw new ForbiddenError(`Service not found for order ${input.orderId}`);
    }

    // 3) Validate fee based on range policy
    if (order.costMin == null || order.costMax == null) {
      throw new ForbiddenError(
        `Fee range not found for order ${input.orderId}. Cannot validate driver-entered fee.`,
      );
    }

    const isWithinRange =
      input.fee >= order.costMin && input.fee <= order.costMax;

    switch (dbOrder.service.rangePolicy) {
      case RangePolicy.ENFORCE:
        if (!isWithinRange) {
          throw new ForbiddenError(
            `Fee ${input.fee} is outside the allowed range (${order.costMin} - ${order.costMax}). ENFORCE policy requires fee to be within range.`,
          );
        }
        Logger.log(
          `ENFORCE policy: Fee ${input.fee} is within range`,
          'OrderService.submitOrderFee',
        );
        break;

      case RangePolicy.SOFT:
        if (!isWithinRange) {
          Logger.warn(
            `SOFT policy: Fee ${input.fee} is outside the suggested range (${order.costMin} - ${order.costMax}), but accepting it anyway`,
            'OrderService.submitOrderFee',
          );
        } else {
          Logger.log(
            `SOFT policy: Fee ${input.fee} is within range`,
            'OrderService.submitOrderFee',
          );
        }
        break;

      case RangePolicy.OPEN:
        if (input.fee <= 0) {
          throw new ForbiddenError('Fee must be greater than 0');
        }
        Logger.log(
          `OPEN policy: Accepting fee ${input.fee} (range: ${order.costMin} - ${order.costMax})`,
          'OrderService.submitOrderFee',
        );
        break;

      default:
        throw new ForbiddenError(
          `Unknown range policy: ${dbOrder.service.rangePolicy}`,
        );
    }

    // 4) Calculate driver share and provider share
    const providerSharePercent = dbOrder.service.providerSharePercent;
    const providerShareFlat = dbOrder.service.providerShareFlat;
    const providerShare =
      (input.fee * providerSharePercent) / 100 + providerShareFlat;
    const driverShare = input.fee - providerShare;

    // 5) Update database order with driver-entered fee
    await this.orderRepository.update(input.orderId, {
      driverEnteredFee: input.fee,
      costBest: input.fee,
      costAfterCoupon: input.fee,
      providerShare: providerShare,
    });

    // 6) Update Redis order with new cost
    await this.activeOrderRedisService.updateOrderStatus(
      input.orderId.toString(),
      {
        status: OrderStatus.WaitingForPostPay,
        costEstimateForRider: input.fee,
        costEstimateForDriver: driverShare,
        // ✅ FIX: Reset totalPaid to 0 when fare is adjusted
        // This ensures finish() recalculates payment correctly with new amount
        totalPaid: 0,
      },
    );

    // 7) Publish subscription update to rider
    this.pubsub.publish(
      'rider.order.updated',
      {
        riderId: parseInt(order.riderId),
      },
      {
        type: RiderOrderUpdateType.StatusUpdated,
        orderId: input.orderId,
        riderId: parseInt(order.riderId),
        status: OrderStatus.WaitingForPostPay,
        cost: input.fee,
      },
    );

    // 8) Proceed with finish flow
    const finishResult = await this.sharedOrderService.finish(
      input.orderId,
      0,
      false,
    );

    // If payment succeeded, trigger rating dialog
    if (finishResult == null) {
      this.askRiderForReview(order);
    }

    Logger.log(
      `Fee ${input.fee} successfully submitted for order ${input.orderId}`,
      'OrderService.submitOrderFee',
    );

    return {
      status:
        finishResult == null
          ? OrderStatus.Finished
          : OrderStatus.WaitingForPostPay,
      orderId: input.orderId,
      totalCost: input.fee,
    };
  }
}
