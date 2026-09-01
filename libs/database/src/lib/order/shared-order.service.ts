import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonCouponService } from '../coupon/common-coupon.service';
import { CouponEntity } from '../entities/coupon.entity';
import { DriverDeductTransactionType } from '../entities/enums/driver-deduct-transaction-type.enum';
import { DriverRechargeTransactionType } from '../entities/enums/driver-recharge-transaction-type.enum';
import { DriverStatus } from '../entities/enums/driver-status.enum';
import { PaymentStatus } from '../entities/enums/payment-status.enum';
import { ProviderRechargeTransactionType } from '../entities/enums/provider-recharge-transaction-type.enum';
import { RequestActivityType } from '../entities/enums/request-activity-type.enum';
import { RiderDeductTransactionType } from '../entities/enums/rider-deduct-transaction-type.enum';
import { ServiceOptionType } from '../entities/enums/service-option-type.enum';
import { TransactionAction } from '../entities/enums/transaction-action.enum';
import { TransactionStatus } from '../entities/enums/transaction-status.enum';
import { PaymentEntity } from '../entities/payment.entity';
import { RequestActivityEntity } from '../entities/taxi/request-activity.entity';
import { ServiceOptionEntity } from '../entities/taxi/service-option.entity';
import { ZonePriceEntity } from '../entities/taxi/zone-price.entity';
import { In, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bullmq';
import { OrderStatus } from '../entities/enums/order-status.enum';
import { TaxiOrderEntity } from '../entities/taxi/taxi-order.entity';
import { ServiceCategoryEntity } from '../entities/taxi/service-category.entity';
import { Point } from '../interfaces/point';
import { DriverRedisService } from '../redis/driver-redis.service';
import { RideOfferRedisService } from '../redis/ride-offer-redis.service';
import { DriverNotificationService } from './firebase-notification-service/driver-notification.service';
import { RiderNotificationService } from './firebase-notification-service/rider-notification.service';
import { GoogleServicesService } from './google-services/google-services.service';
import { RegionService } from './region/region.service';
import { ServiceService } from './service.service';
import { SharedDriverService } from './shared-driver.service';
import { SharedFleetService } from './shared-fleet.service';
import { SharedProviderService } from './shared-provider.service';
import { SharedRiderService } from './shared-rider.service';
import { firstValueFrom } from 'rxjs';
import { ForbiddenError } from '@nestjs/apollo';
import { PaymentMode } from '../entities/enums/payment-mode.enum';
import { SharedCustomerWalletService } from '../customer-wallet/shared-customer-wallet.service';
import { TaxiOrderType } from '../entities/taxi/enums/taxi-order-type.enum';
import { FixedCostDTO, RangeCostDTO } from '../interfaces/cost-result.dto';
import { PricingMode } from '../entities/taxi/enums/pricing-mode.enum';
import { Queue } from 'bullmq';
import {
  ActiveOrderCommonRedisService,
  ActiveOrderRedisSnapshot,
  DriverEventType,
  PubSubService,
  RiderOrderUpdateType,
  RiderRedisService,
} from '../redis';
import { DeliveryContact, OrderMessageEntity } from '../entities';
import { WaypointBase } from '../interfaces';
import { BetterConfigService } from '../config/config.service';

@Injectable()
export class SharedOrderService {
  constructor(
    @InjectRepository(TaxiOrderEntity)
    private orderRepository: Repository<TaxiOrderEntity>,
    @InjectRepository(RequestActivityEntity)
    private activityRepository: Repository<RequestActivityEntity>,
    private regionService: RegionService,
    @InjectRepository(ServiceCategoryEntity)
    private serviceCategoryRepository: Repository<ServiceCategoryEntity>,
    @InjectRepository(ServiceOptionEntity)
    private serviceOptionRepository: Repository<ServiceOptionEntity>,
    @InjectRepository(ZonePriceEntity)
    private zonePriceRepository: Repository<ZonePriceEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(OrderMessageEntity)
    private messageRepository: Repository<OrderMessageEntity>,
    private googleServices: GoogleServicesService,
    private servicesService: ServiceService,
    private riderService: SharedRiderService,
    private sharedRiderWalletService: SharedCustomerWalletService,
    private driverRedisService: DriverRedisService,
    private riderRedisService: RiderRedisService,
    private rideOfferRedisService: RideOfferRedisService,
    private activeOrderRedisService: ActiveOrderCommonRedisService,
    private driverService: SharedDriverService,
    private sharedProviderService: SharedProviderService,
    private sharedFleetService: SharedFleetService,
    private commonCouponService: CommonCouponService,
    private driverNotificationService: DriverNotificationService,
    private riderNotificationService: RiderNotificationService,
    private httpService: HttpService,
    @InjectQueue('dispatch-main')
    private readonly dispatchMainQueue: Queue,
    private pubsubService: PubSubService,
    private configService: BetterConfigService,
  ) {}

  async saveActiveOrderToDisk(
    order: ActiveOrderRedisSnapshot,
    entityUpdates?: Partial<TaxiOrderEntity>,
  ): Promise<boolean> {
    const orderEntity: Partial<TaxiOrderEntity> = {
      id: parseInt(order.id),
      driverId: parseInt(order.driverId),
      status: order.status,
      waitMinutes: order.waitMinutes,
      expectedTimestamp: order.scheduledAt,
      pickupEta: order.pickupEta,
      dropOffEta: order.dropoffEta,
      paymentMode: order.paymentMethod.mode,
      finishTimestamp: new Date(),
      // Persist actual tracked distance/duration separately from estimates
      distanceActual:
        order.actualDistance && order.actualDistance > 0
          ? Math.round(order.actualDistance)
          : undefined,
      durationActual:
        order.actualDuration && order.actualDuration > 0
          ? Math.round(order.actualDuration)
          : undefined,
      ...entityUpdates,
    };
    await this.orderRepository.save(orderEntity);
    for (const message of order.chatMessages) {
      await this.messageRepository.save({
        requestId: parseInt(order.id),
        content: message.content,
        createdAt: message.createdAt,
        sentByDriver: message.isFromDriver,
      });
    }
    return true;
  }

  async getZonePricingsForPoints(
    from: Point,
    to: Point,
  ): Promise<ZonePriceEntity[]> {
    let pricings: ZonePriceEntity[] = await this.zonePriceRepository.query(
      "SELECT * FROM zone_price WHERE ST_Within(st_geomfromtext('POINT(? ?)'), `from`) AND ST_Within(st_geomfromtext('POINT(? ?)'), `to`)",
      [from.lng, from.lat, to.lng, to.lat],
    );
    pricings = await this.zonePriceRepository.find({
      where: { id: In(pricings.map((p) => p.id)) },
      relations: { services: true, fleets: true },
    });
    return pricings;
  }

  async calculateFare(input: {
    points: Point[];
    twoWay?: boolean;
    coupon?: CouponEntity;
    riderId?: number;
    waitTime?: number;
    selectedOptionIds?: string[];
    orderType: TaxiOrderType;
  }) {
    Logger.log(input, 'SharedOrderService.calculateFare.input');
    // calculate the radial distance between all points
    const distances = input.points.map((point, index) => {
      if (index === 0) return 0;
      return this.getDistanceBetweenPoints(point, input.points[index - 1]);
    });
    const totalDistance = distances.reduce((a, b) => a + b, 0);
    if (totalDistance > 1_000_000) {
      throw new ForbiddenError(
        'Total distance exceeds 1000 km. Please reduce the distance or split the trip.',
      );
    }
    if (totalDistance < 100) {
      throw new ForbiddenError(
        'Total distance is less than 100 m. Try a longer trip.',
      );
    }
    let zonePricings: ZonePriceEntity[] = [];
    if (input.points.length == 2) {
      zonePricings = await this.getZonePricingsForPoints(
        input.points[0],
        input.points[1],
      );
    }
    const regions = await this.regionService.getRegionWithPoint(
      input.points[0],
    );
    if (regions.length < 1) {
      throw new ForbiddenError(CalculateFareError.RegionUnsupported);
    }
    const servicesInRegion = await this.regionService.getRegionServices(
      regions[0].id,
    );
    if (servicesInRegion.length < 1) {
      throw new ForbiddenError(CalculateFareError.NoServiceInRegion);
    }
    if ((input.twoWay ?? false) && input.points.length > 1) {
      input.points.push(input.points[0]);
    }
    const metrics =
      servicesInRegion.findIndex((x) => x.perHundredMeters > 0) > -1
        ? await this.googleServices.getSumDistanceAndDuration(input.points)
        : { distance: 0, duration: 0, directions: [] };
    Logger.log(
      {
        pointsCount: input.points.length,
        points: input.points,
        distance: metrics.distance,
        duration: metrics.duration,
        hasDistanceBasedServices:
          servicesInRegion.findIndex((x) => x.perHundredMeters > 0) > -1,
      },
      'SharedOrderService.calculateFare.metrics',
    );

    // Validate that we have a valid trip distance
    if (
      metrics.distance === 0 &&
      servicesInRegion.findIndex((x) => x.perHundredMeters > 0) > -1
    ) {
      Logger.warn(
        {
          points: input.points,
          message:
            'calculateFare called with zero distance - points may be identical or too close. Fare estimates will be inaccurate.',
        },
        'SharedOrderService.calculateFare.zeroDistance',
      );
    }
    const cats = await this.serviceCategoryRepository.find({
      relations: {
        services: {
          media: true,
          options: true,
        },
      },
    });
    const feeMultiplier =
      await this.sharedFleetService.getFleetMultiplierInPoint(input.points[0]);

    // Calculate option fees from selected options
    let optionFee = 0;
    if (input.selectedOptionIds && input.selectedOptionIds.length > 0) {
      const options = await this.serviceOptionRepository.find({
        where: { id: In(input.selectedOptionIds.map((id) => parseInt(id))) },
      });
      const paidOptions = options.filter(
        (option) => option.type == ServiceOptionType.Paid,
      );
      optionFee =
        paidOptions.length == 0
          ? 0
          : paidOptions
              .map((option) => option.additionalFee ?? 0)
              .reduce(
                (previous: number, current: number) => (current += previous),
              );
      Logger.log(
        `Calculated option fee: ${optionFee} from ${paidOptions.length} paid options`,
        'SharedOrderService.calculateFare',
      );
    }

    const _cats = cats
      .map((cat) => {
        const { services, ..._cat } = cat;

        const _services = services
          .filter(
            (x) => servicesInRegion.filter((y) => y.id == x.id).length > 0,
          )
          .filter((x) => x.orderTypes.includes(input.orderType))
          .map((service) => {
            let cost = 0;
            let costResult: {
              cost: number;
              min?: number;
              max?: number;
            } | null = null;
            const zonePricesWithService = zonePricings.filter((zone) =>
              zone.services.find((_service) => _service.id == service.id),
            );
            if (zonePricesWithService.length > 0) {
              cost = zonePricesWithService[0].cost;
              const eta = new Date();
              for (const _multiplier of zonePricesWithService[0]
                .timeMultipliers) {
                const startMinutes =
                  parseInt(_multiplier.startTime.split(':')[0]) * 60 +
                  parseInt(_multiplier.startTime.split(':')[1]);
                const nowMinutes = eta.getHours() * 60 + eta.getMinutes();
                const endMinutes =
                  parseInt(_multiplier.endTime.split(':')[0]) * 60 +
                  parseInt(_multiplier.endTime.split(':')[1]);
                if (nowMinutes >= startMinutes && nowMinutes <= endMinutes) {
                  cost *= _multiplier.multiply;
                }
              }
            } else {
              const timestamp = new Date();
              costResult = this.servicesService.calculateCost(
                service,
                metrics.distance,
                metrics.duration,
                timestamp,
                feeMultiplier,
                input.waitTime ?? 0,
                optionFee, // Include selected option fees in fare calculation
              );
              cost = costResult.cost;
              Logger.log(
                {
                  serviceId: service.id,
                  serviceName: service.name,
                  distance: metrics.distance,
                  duration: metrics.duration,
                  timestamp: timestamp.toISOString(),
                  feeMultiplier,
                  waitTime: input.waitTime ?? 0,
                  optionFee,
                  cost,
                  min: costResult.min,
                  max: costResult.max,
                  pricingMode: service.pricingMode,
                },
                'SharedOrderService.calculateFare.costCalculation',
              );
            }

            // Build CostResult union based on pricing mode
            // NOTE: Provider share is NOT added to rider cost - it's deducted from driver earnings
            let costResultDTO: FixedCostDTO | RangeCostDTO;

            if (costResult?.min != null && costResult?.max != null) {
              // RANGE pricing mode - costs already include wait fees and are rounded
              costResultDTO = {
                cost: cost,
                min: costResult.min,
                max: costResult.max,
                mode: PricingMode.RANGE,
                rangePolicy: service.rangePolicy,
              };
            } else {
              // FIXED pricing mode - cost already includes wait fees and is rounded
              costResultDTO = {
                cost: cost,
                mode: PricingMode.FIXED,
              };
            }

            if (input.coupon == null) {
              return {
                ...service,
                cost: costResultDTO.cost, // Deprecated - for backward compatibility, base cost only (provider share handled separately)
                costResult: costResultDTO,
              };
            } else {
              // Apply coupon to base cost (provider share is handled separately in backend)
              const costAfterCoupon =
                this.commonCouponService.applyCouponOnPrice(
                  input.coupon,
                  costResultDTO.cost,
                );

              // Calculate discounted cost result for both FIXED and RANGE pricing
              let discountedCostResult: FixedCostDTO | RangeCostDTO;

              if (costResult?.min != null && costResult?.max != null) {
                // RANGE pricing: apply discount to all values (min, cost, max)
                discountedCostResult = {
                  cost: this.commonCouponService.applyCouponOnPrice(
                    input.coupon,
                    costResultDTO.cost,
                  ),
                  min: this.commonCouponService.applyCouponOnPrice(
                    input.coupon,
                    (costResultDTO as RangeCostDTO).min,
                  ),
                  max: this.commonCouponService.applyCouponOnPrice(
                    input.coupon,
                    (costResultDTO as RangeCostDTO).max,
                  ),
                  mode: PricingMode.RANGE,
                  rangePolicy: service.rangePolicy,
                };
              } else {
                // FIXED pricing: apply discount to single cost value
                discountedCostResult = {
                  cost: costAfterCoupon,
                  mode: PricingMode.FIXED,
                };
              }

              return {
                ...service,
                cost: costResultDTO.cost, // Deprecated - for backward compatibility, base cost only (provider share handled separately)
                costResult: costResultDTO,
                costAfterCoupon, // Backward compatibility
                discountedCostResult,
              };
            }
          });
        return {
          ..._cat,
          services: _services.sort((a, b) => {
            if (a.displayPriority > b.displayPriority) return -1;
            if (a.displayPriority < b.displayPriority) return 1;
            return 0;
          }),
        };
      })
      .filter((x) => x.services.length > 0);
    if (_cats.length == 0) {
      throw new ForbiddenError(CalculateFareError.NoServiceInRegion);
    }

    return {
      ...metrics,
      currency: regions[0].currency,
      services: _cats,
    };
  }
  getDistanceBetweenPoints(point: Point, arg1: Point): number {
    const R = 6371e3; // metres
    const φ1 = (point.lat * Math.PI) / 180;
    const φ2 = (arg1.lat * Math.PI) / 180;
    const Δφ = ((arg1.lat - point.lat) * Math.PI) / 180;
    const Δλ = ((arg1.lng - point.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  }

  async createOrder(input: {
    type: TaxiOrderType;
    waypoints: {
      address: string;
      point: Point;
      deliveryContact?: DeliveryContact;
    }[];
    riderId: number;
    serviceId: number;
    intervalMinutes: number;
    operatorId?: number;
    twoWay?: boolean;
    optionIds?: string[];
    couponCode?: string;
    fleetId?: number;
    paymentMode?: PaymentMode;
    paymentMethodId?: number;
    waitMinutes: number;
    driverId?: number;
  }): Promise<TaxiOrderEntity> {
    Logger.log(input, 'SharedOrderService.createOrder.input');
    let zonePricings: ZonePriceEntity[] = [];
    if (input.waypoints.length == 2) {
      zonePricings = await this.getZonePricingsForPoints(
        input.waypoints[0].point,
        input.waypoints[1].point,
      );
    }
    const service = await this.servicesService.getWithId(input.serviceId);
    if (service == undefined) {
      throw new ForbiddenError('SERVICE_NOT_FOUND');
    }
    const fleetIdsInPoint = await this.sharedFleetService.getFleetIdsInPoint(
      input.waypoints[0].point,
    );
    let optionFee = 0;
    let options: ServiceOptionEntity[] = [];
    if (input.optionIds != null) {
      options = await this.serviceOptionRepository.findBy({
        id: In(input.optionIds),
      });
      if ((input.twoWay ?? false) && input.waypoints.length > 1) {
        input.waypoints.push(input.waypoints[0]);
      }
      const paidOptions = options.filter(
        (option) => option.type == ServiceOptionType.Paid,
      );
      optionFee =
        paidOptions.length == 0
          ? 0
          : paidOptions
              .map((option) => option.additionalFee ?? 0)
              .reduce(
                (previous: number, current: number) => (current += previous),
              );
    }
    const metrics = await this.googleServices.getSumDistanceAndDuration(
      input.waypoints.map((w) => w.point),
    );
    Logger.log(
      {
        waypointsCount: input.waypoints.length,
        points: input.waypoints.map((w) => w.point),
        distance: metrics.distance,
        duration: metrics.duration,
      },
      'SharedOrderService.createOrder.metrics',
    );
    const expectedTimestamp = new Date(
      new Date().getTime() + (input.intervalMinutes | 0) * 60 * 1000,
    );
    const rider = await this.riderService.repo.findOneOrFail({
      where: { id: input.riderId },
      relations: { media: true, sessions: true },
    });
    const feeMultiplier =
      fleetIdsInPoint.length == 0
        ? 1
        : ((await this.sharedFleetService.getFleetById(fleetIdsInPoint[0]))
            ?.feeMultiplier ?? 1);
    const costCalculation = this.servicesService.calculateCost(
      service,
      metrics.distance,
      metrics.duration,
      expectedTimestamp,
      feeMultiplier,
      input.waitMinutes ?? 0,
      optionFee,
    );
    let cost = costCalculation.cost;
    Logger.log(
      {
        serviceId: service.id,
        serviceName: service.name,
        distance: metrics.distance,
        duration: metrics.duration,
        expectedTimestamp: expectedTimestamp.toISOString(),
        intervalMinutes: input.intervalMinutes,
        feeMultiplier,
        waitMinutes: input.waitMinutes ?? 0,
        optionFee,
        cost,
        min: costCalculation.min,
        max: costCalculation.max,
        pricingMode: service.pricingMode,
      },
      'SharedOrderService.createOrder.costCalculation',
    );
    const zonePricing = zonePricings.filter((price) => {
      return (
        price.services.filter((service) => service.id == input.serviceId)
          .length > 0
      );
    });
    Logger.log(zonePricing, 'SharedOrderService.createOrder.zonePricing');
    if (zonePricing.length > 0) {
      cost = zonePricing[0].cost;
      const eta = new Date();
      for (const _multiplier of zonePricings[0].timeMultipliers) {
        const startMinutes =
          parseInt(_multiplier.startTime.split(':')[0]) * 60 +
          parseInt(_multiplier.startTime.split(':')[1]);
        const nowMinutes = eta.getHours() * 60 + eta.getMinutes();
        const endMinutes =
          parseInt(_multiplier.endTime.split(':')[0]) * 60 +
          parseInt(_multiplier.endTime.split(':')[1]);
        if (nowMinutes >= startMinutes && nowMinutes <= endMinutes) {
          cost *= _multiplier.multiply;
        }
      }
    }

    const regions = await this.regionService.getRegionWithPoint(
      input.waypoints[0].point,
    );
    Logger.log(regions, 'SharedOrderService.createOrder.regions');

    if (regions.length === 0) {
      throw new ForbiddenError('REGION_UNSUPPORTED');
    }

    // Only enforce distance limit if explicitly set AND within a practical range.
    // maximumDestinationDistance=0 means unlimited (default from Admin Panel form).
    const effectiveMaxDistance = (service.maximumDestinationDistance && service.maximumDestinationDistance > 0)
      ? service.maximumDestinationDistance
      : 500000; // 500 km default cap if not configured
    if (metrics.distance > effectiveMaxDistance) {
      throw new ForbiddenError('DISTANCE_TOO_FAR');
    }
    let shouldPrePay = false;
    const paidAmount = 0;

    if (service.prepayPercent > 0) {
      const balance =
        await this.sharedRiderWalletService.getRiderCreditInCurrency(
          input.riderId,
          regions[0].currency,
        );
      const amountNeedsToBePrePaid = (cost * service.prepayPercent) / 100;
      switch (input.paymentMode) {
        case PaymentMode.Cash:
          break;
        case PaymentMode.Wallet:
          if (balance < amountNeedsToBePrePaid) {
            shouldPrePay = true;
          }
          break;
        case PaymentMode.PaymentGateway:
          shouldPrePay = true;
          break;
        case PaymentMode.SavedPaymentMethod:
          shouldPrePay = true;
          break;
      }
    }
    const orderObject: TaxiOrderEntity = this.orderRepository.create({
      serviceId: input.serviceId,
      type: input.type,
      contacts: input.waypoints
        .map((w) => w.deliveryContact ?? null)
        .filter((c) => c !== null),
      currency: regions[0].currency,
      riderId: input.riderId,
      points: input.waypoints.map((w) => w.point),
      addresses: input.waypoints.map((w) => w.address.replace(', ', '-')),
      distanceBest: metrics.distance,
      durationBest: metrics.duration,
      directions: metrics.directions,
      paymentMode: input.paymentMode,
      driverId: input.driverId,
      savedPaymentMethodId:
        input.paymentMode == PaymentMode.SavedPaymentMethod
          ? input.paymentMethodId!
          : undefined,
      paymentGatewayId:
        input.paymentMode == PaymentMode.PaymentGateway
          ? input.paymentMethodId!
          : undefined,
      status: shouldPrePay
        ? OrderStatus.WaitingForPrePay
        : input.intervalMinutes > 10
          ? OrderStatus.Booked
          : OrderStatus.Requested,
      paidAmount: paidAmount,
      costBest: cost,
      costAfterCoupon: cost,
      costMin: costCalculation.min, // Fees already included in calculateCost
      costMax: costCalculation.max, // Fees already included in calculateCost
      pricingMode: service.pricingMode,
      rangePolicy: service.rangePolicy,
      expectedTimestamp: expectedTimestamp,
      operatorId: input.operatorId,
      waitMinutes: input.waitMinutes ?? 0,
      waitCost: service.perMinuteWait * (input.waitMinutes ?? 0),
      rideOptionsCost: optionFee,
      fleetId: input.fleetId,
      providerShare:
        service.providerShareFlat + (service.providerSharePercent * cost) / 100,
      options: options,
    });
    let order = await this.orderRepository.save(orderObject);
    order = await this.orderRepository.findOneOrFail({
      where: { id: order.id },
      relations: {
        rider: {
          wallets: true,
        },
        paymentGateway: true,
        savedPaymentMethod: true,
        service: {
          media: true,
        },
        options: true,
      },
    });
    if (input.couponCode != null && input.couponCode != '' && rider != null) {
      const couponResult = await this.commonCouponService.applyCoupon(
        input.couponCode,
        order.id,
        rider.id,
      );
      // Only take costAfterCoupon from the result; keep our fully-loaded order
      order.costAfterCoupon = couponResult.costAfterCoupon;
    }
    let activityType = RequestActivityType.RequestedByRider;
    if (input.intervalMinutes > 0) {
      activityType =
        input.operatorId == null
          ? (activityType = RequestActivityType.BookedByRider)
          : RequestActivityType.BookedByOperator;
    } else {
      activityType =
        input.operatorId == null
          ? (activityType = RequestActivityType.RequestedByRider)
          : RequestActivityType.RequestedByOperator;
    }
    this.activityRepository.insert({ requestId: order.id, type: activityType });
    this.riderService.repo.update(order.riderId!, {
      lastActivityAt: new Date(),
    });

    if (!shouldPrePay) {
      await this.dispatchRide(order);
    }
    return order;
  }

  private async dispatchRide(order: TaxiOrderEntity) {
    const now = Date.now();
    const config = await this.configService.getDispatchConfig();
    const preDispatchBufferMinutes = config.preDispatchBufferMinutes ?? 30;

    const timeUntilScheduled = order.expectedTimestamp!.getTime() - now;
    const intervalMinutes = Math.max(
      0,
      Math.floor(timeUntilScheduled / (60 * 1000)) - preDispatchBufferMinutes,
    );

    Logger.log(
      `Dispatching ride in ${intervalMinutes} minutes (${preDispatchBufferMinutes} min pre-dispatch buffer applied). Scheduled pickup: ${order.expectedTimestamp}`,
      'SharedOrderService.dispatchRide',
    );
    await this.rideOfferRedisService.createRideOffer({
      status: order.status,
      currency: order.currency,
      type: order.type,
      estimatedDistance: order.distanceBest,
      estimatedDuration: order.durationBest,
      orderId: order.id.toString(),
      riderId: order.riderId!.toString(),
      serviceId: order.serviceId.toString(),
      waitMinutes: order.waitMinutes,
      driverId: order.driverId?.toString(),
      scheduledAt: order.expectedTimestamp!,
      pickupLocation: order.points[0],
      fleetId: order.fleetId,
      costEstimateForRider: order.costAfterCoupon,
      costEstimateForDriver: order.costBest - order.providerShare,
      costMin: order.costMin,
      costMax: order.costMax,
      pricingMode: order.pricingMode,
      rangePolicy: order.rangePolicy,
      paymentMethod: order.paymentMethod(),
      totalPaid: order.paidAmount,
      serviceName: order.service!.name,
      riderFirstName: order.rider.firstName,
      riderLastName: order.rider.lastName,
      riderProfileImageUrl: order.rider.media?.address,
      riderCountryIso: order.rider.countryIso,
      riderEmail: order.rider.email,
      riderGender: order.rider.gender,
      riderMobileNumber: order.rider.mobileNumber,
      riderWalletCredit:
        order.rider.wallets?.filter(
          (wallet) => wallet.currency === order.currency,
        )[0]?.balance ?? 0,
      riderFcmTokens:
        order.rider.notificationPlayerId != null
          ? [order.rider.notificationPlayerId]
          : [],
      serviceImageAddress: order.service!.media.address,
      options: order.options ?? [],
      waypoints: order.waypoints(),
      createdAt: order.createdOn,
      tripDirections: order.directions,
    });
    if (order.driverId != null) {
      this.assignOrderToDriver(order.id, order.driverId);
    }
    this.dispatchMainQueue.add(
      'dispatch',
      {
        orderId: order.id,
      },
      {
        jobId: `dispatch:${order.id}`,
        delay: intervalMinutes * 60 * 1000,
      },
    );
  }

  async processPrePay(orderId: number, authorizedAmount = 0) {
    let order: TaxiOrderEntity = await this.orderRepository.findOneOrFail({
      where: { id: orderId },
      relations: {
        service: true,
        driver: {
          fleet: true,
        },
        rider: true,
      },
    });
    const riderCredit =
      await this.sharedRiderWalletService.getRiderCreditInCurrency(
        order.riderId,
        order.currency,
      );
    const minimumRequired =
      order.costAfterCoupon * (order.service!.prepayPercent / 100.0);
    Logger.log(`riderCredit: ${riderCredit}`, 'processPrePay');
    Logger.log(`authorizedAmount: ${authorizedAmount}`, 'processPrePay');
    Logger.log(`serviceFee: ${order.costAfterCoupon}`, 'processPrePay');
    Logger.log(
      `Minmum required authorizedAmount: ${minimumRequired}`,
      'processPrePay',
    );
    if (riderCredit + authorizedAmount - minimumRequired < 0) {
      throw new ForbiddenError('Credit is not enough');
    }
    await this.orderRepository.update(order.id, {
      status: OrderStatus.Requested,
    });
    order = await this.orderRepository.findOneOrFail({
      where: { id: orderId },
      relations: {
        service: true,
        driver: {
          fleet: true,
        },
        rider: {
          wallets: true,
        },
        paymentGateway: true,
        savedPaymentMethod: true,
      },
    });
    await this.dispatchRide(order);
  }

  async finish(
    orderId: number,
    cashAmount = 0,
    deduceFromWallet = true,
  ): Promise<ActiveOrderRedisSnapshot | null> {
    Logger.log(
      { orderId, cashAmount, deduceFromWallet },
      'SharedOrderService.finish.input',
    );

    // 1) Load + validate
    const order = await this.activeOrderRedisService.getActiveOrder(
      orderId.toString(),
    );
    Logger.log(order, 'SharedOrderService.finish.order');

    const driver = await this.driverRedisService.getOnlineDriverMetaData(
      order.driverId,
    );
    Logger.log(driver, 'SharedOrderService.finish.driver');

    // 2) Totals
    const providerShare =
      order.costEstimateForRider - order.costEstimateForDriver;

    const tip = 0;
    const alreadyPaid = order.totalPaid ?? 0;

    // What the rider still owes for this trip (fare+tip minus alreadyPaid)
    let remainingDue = order.costEstimateForRider + tip - alreadyPaid;

    Logger.log(
      {
        providerShare,
        tip,
        alreadyPaid,
        remainingDue,
        costEstimateForRider: order.costEstimateForRider,
        costEstimateForDriver: order.costEstimateForDriver,
      },
      'SharedOrderService.finish.totals',
    );

    // 2a) Deduct commission EARLY (before payment settlement)
    // This ensures commission is always deducted when ride ends, regardless of payment outcome
    const commissionAlreadyDeducted = order.commissionDeducted === true;
    if (!commissionAlreadyDeducted && providerShare > 0) {
      Logger.log(
        { providerShare, driverId: order.driverId, commissionAlreadyDeducted },
        'SharedOrderService.finish.deductCommissionEarly',
      );

      const driverWallet = await this.driverService.rechargeWallet({
        status: TransactionStatus.Done,
        driverId: parseInt(order.driverId!),
        currency: order.currency,
        action: TransactionAction.Deduct,
        deductType: DriverDeductTransactionType.Commission,
        amount: -providerShare,
        requestId: parseInt(order.id),
      });

      // Mark commission as deducted in Redis
      await this.activeOrderRedisService.updateOrderStatus(order.id, {
        commissionDeducted: true,
      });
      order.commissionDeducted = true;
      // Sync post-commission balance to Redis so getProfile() returns fresh walletCredit
      await this.driverRedisService.updateWalletCredit(
        order.driverId,
        driverWallet.balance,
      );

      // NOTE: We intentionally do NOT force the driver offline / expire their
      // Redis presence here. This branch runs the FIRST time finish() is
      // called for a trip — e.g. the instant the driver slides to confirm
      // drop-off on a cash ride — which is before the rider's cash has been
      // collected and before the order has moved to WaitingForPostPay.
      // Expiring the driver here deletes their `driver:{id}` Redis record
      // (including activeOrderIds), which orphans the still-open order: the
      // driver app can no longer find it on reload, "cash payment received"
      // never reappears, and the rider is left waiting forever. The
      // low-balance check now runs after the order actually closes, below.

      // Split commission with fleet/provider
      let fleetShare = 0;
      if (driver.fleetId) {
        Logger.log(
          `Processing fleet commission for fleet ${driver.fleetId}`,
          'SharedOrderService.finish.fleetCommission',
        );
        const fleet = await this.sharedFleetService.getFleetById(
          parseInt(driver.fleetId),
        );
        fleetShare =
          (providerShare * fleet.commissionSharePercent) / 100 +
          fleet.commissionShareFlat;

        Logger.log(
          { fleetShare, providerShare, fleet },
          'SharedOrderService.finish.fleetShare',
        );

        if (fleetShare > 0) {
          await this.sharedFleetService.rechargeWallet({
            fleetId: driver.fleetId == null ? null : parseInt(driver.fleetId),
            action: TransactionAction.Recharge,
            rechargeType: ProviderRechargeTransactionType.Commission,
            amount: fleetShare,
            currency: order.currency,
            requestId: parseInt(order.id),
            driverId: parseInt(order.driverId!),
          });
        }
      }

      const providerCommission = providerShare - fleetShare;
      Logger.log(
        { providerCommission, providerShare, fleetShare },
        'SharedOrderService.finish.providerCommission',
      );
      await this.sharedProviderService.rechargeWallet({
        action: TransactionAction.Recharge,
        rechargeType: ProviderRechargeTransactionType.Commission,
        currency: order.currency,
        requestId: parseInt(order.id),
        amount: providerCommission,
      });
    } else if (commissionAlreadyDeducted) {
      Logger.log(
        'Commission already deducted, skipping',
        'SharedOrderService.finish.commissionSkipped',
      );
    }

    // Apply cash if supplied
    if (cashAmount > 0) {
      Logger.log(
        `Applying cash amount: ${cashAmount}`,
        'SharedOrderService.finish.applyCash',
      );
      remainingDue = Math.max(0, remainingDue - cashAmount);

      // If cash was given but mode isn't Cash, flip it for history clarity
      if (order.paymentMethod.mode !== PaymentMode.Cash) {
        Logger.log(
          `Switching payment mode to Cash from ${order.paymentMethod.mode}`,
          'SharedOrderService.finish.switchToCash',
        );
        await this.activeOrderRedisService.updateOrderStatus(order.id, {
          paymentMethod: {
            mode: PaymentMode.Cash,
          },
        });
        order.paymentMethod.mode = PaymentMode.Cash;
      }
    }

    Logger.log(
      `Remaining due after cash: ${remainingDue}`,
      'SharedOrderService.finish.remainingDueAfterCash',
    );

    // 3) Try to settle the remainder based on payment mode
    const ensurePostPay = async () => {
      Logger.log(
        'Moving to WaitingForPostPay status',
        'SharedOrderService.finish.ensurePostPay',
      );
      await this.activeOrderRedisService.updateOrderStatus(order.id, {
        status: OrderStatus.WaitingForPostPay,
      });
      return order; // Return the order for further processing
    };

    Logger.log(
      `Processing payment mode: ${order.paymentMethod.mode}`,
      'SharedOrderService.finish.paymentMode',
    );

    switch (order.paymentMethod.mode) {
      case PaymentMode.Cash: {
        Logger.log('Payment mode: Cash', 'SharedOrderService.finish.cash');
        // Rider must have covered all due in cash
        if (remainingDue > 0) {
          Logger.log(
            `Cash insufficient, remaining due: ${remainingDue}`,
            'SharedOrderService.finish.cashInsufficient',
          );
          return await ensurePostPay();
        }
        break;
      }

      case PaymentMode.Wallet: {
        Logger.log('Payment mode: Wallet', 'SharedOrderService.finish.wallet');
        const credit =
          await this.sharedRiderWalletService.getRiderCreditInCurrency(
            parseInt(order.riderId),
            order.currency,
          );
        Logger.log(
          { credit, remainingDue },
          'SharedOrderService.finish.walletCredit',
        );
        if (credit < remainingDue) {
          Logger.log(
            'Wallet credit insufficient',
            'SharedOrderService.finish.walletInsufficient',
          );
          return await ensurePostPay();
        }
        remainingDue = 0; // Wallet will cover the remainder; deduction happens in settlements below
        break;
      }

      case PaymentMode.SavedPaymentMethod: {
        Logger.log(
          'Payment mode: SavedPaymentMethod',
          'SharedOrderService.finish.savedPaymentMethod',
        );

        // ✅ FIX: If payment already handled externally, skip payment processing
        if (!deduceFromWallet) {
          Logger.log(
            'Payment already handled externally, skipping payment processing',
            'SharedOrderService.finish.savedPaymentMethod.externalPayment',
          );
          remainingDue = 0; // Mark as paid
          break; // Skip to settlements
        }

        // If wallet covers it (and allowed), we'll use wallet; otherwise capture the authorization.
        const walletCredit =
          await this.sharedRiderWalletService.getRiderCreditInCurrency(
            parseInt(order.riderId),
            order.currency,
          );

        Logger.log(
          { walletCredit, remainingDue, deduceFromWallet },
          'SharedOrderService.finish.savedPaymentMethod.walletCheck',
        );

        if (walletCredit >= remainingDue) {
          Logger.log(
            'Wallet covers remaining due',
            'SharedOrderService.finish.savedPaymentMethod.walletCovers',
          );
          break; // wallet can handle it; we'll deduct later
        }

        Logger.log(
          'Attempting to capture authorization',
          'SharedOrderService.finish.savedPaymentMethod.captureAuth',
        );

        // Try capture last authorized payment for this order
        const auth = await this.paymentRepository.find({
          where: {
            userType: 'rider',
            userId: order.riderId.toString(),
            status: PaymentStatus.Authorized,
            orderNumber: order.id.toString(),
          },
          order: { id: 'DESC' },
          take: 1,
        });

        Logger.log(auth, 'SharedOrderService.finish.savedPaymentMethod.auth');

        if (auth.length === 0) {
          Logger.log(
            'No authorized payment found',
            'SharedOrderService.finish.savedPaymentMethod.noAuth',
          );
          return await ensurePostPay();
        }

        const capture = await firstValueFrom(
          this.httpService.get<{ status: 'OK' | 'FAILED' }>(
            `${process.env.GATEWAY_SERVER_URL}/capture?id=${auth[0].transactionNumber}&amount=${remainingDue}`,
          ),
        );

        Logger.log(
          capture.data,
          'SharedOrderService.finish.savedPaymentMethod.captureResult',
        );

        if (capture.data.status !== 'OK') {
          Logger.log(
            'Capture failed',
            'SharedOrderService.finish.savedPaymentMethod.captureFailed',
          );
          return await ensurePostPay();
        }

        // capture succeeded → remaining is now 0
        Logger.log(
          'Capture succeeded',
          'SharedOrderService.finish.savedPaymentMethod.captureSuccess',
        );
        remainingDue = 0;
        break;
      }

      case PaymentMode.PaymentGateway: {
        Logger.log(
          'Payment mode: PaymentGateway - requiring post-pay',
          'SharedOrderService.finish.paymentGateway',
        );
        // ✅ FIX: payment already collected by gateway callback; skip post-pay
        if (!deduceFromWallet) {
          Logger.log(
            'Payment already handled externally (gateway callback), skipping post-pay',
            'SharedOrderService.finish.paymentGateway.externalPayment',
          );
          remainingDue = 0;
          break;
        }
        // Async/off-platform flow; let post-pay handle it
        return await ensurePostPay();
      }
    }

    // If anything still unpaid, move to post-pay and stop here
    if (remainingDue > 0) {
      Logger.log(
        `Still unpaid amount: ${remainingDue}`,
        'SharedOrderService.finish.stillUnpaid',
      );
      return await ensurePostPay();
    }

    Logger.log(
      'All payments settled, proceeding with wallet settlements',
      'SharedOrderService.finish.settleWallets',
    );

    // 4) Settle wallets & payouts
    // Note: Commission (4a) and fleet/provider split (4b) already deducted earlier in the function

    // 4c) Credit driver for non-cash portion + tip
    // (matches your existing logic; cash was handed directly to driver)
    const driverNonCash = order.costEstimateForDriver - cashAmount + tip;
    Logger.log(
      {
        driverNonCash,
        costEstimateForDriver: order.costEstimateForDriver,
        cashAmount,
        tip,
      },
      'SharedOrderService.finish.driverNonCash',
    );

    if (driverNonCash > 0) {
      Logger.log(
        `Crediting driver wallet: ${driverNonCash}`,
        'SharedOrderService.finish.creditDriver',
      );
      const orderFeeWallet = await this.driverService.rechargeWallet({
        status: TransactionStatus.Done,
        driverId: parseInt(order.driverId!),
        currency: order.currency,
        requestId: parseInt(order.id),
        action: TransactionAction.Recharge,
        rechargeType: DriverRechargeTransactionType.OrderFee,
        amount: driverNonCash,
      });
      // Sync updated balance to Redis so getProfile() returns fresh walletCredit
      await this.driverRedisService.updateWalletCredit(
        order.driverId,
        orderFeeWallet.balance,
      );

      // Optional instant payout for non-cash received (no extra cash subtraction here)
      const payoutAccount =
        await this.driverService.getDriverDefaultPayoutAccount(
          parseInt(order.driverId!),
        );
      Logger.log(payoutAccount, 'SharedOrderService.finish.payoutAccount');

      if (
        payoutAccount?.payoutMethod?.isInstantPayoutEnabled &&
        driverNonCash > 0
      ) {
        Logger.log(
          `Processing instant payout: ${driverNonCash}`,
          'SharedOrderService.finish.instantPayout',
        );
        await this.driverService.payout({
          driverId: parseInt(order.driverId!),
          amount: driverNonCash,
          currency: order.currency,
          requestId: parseInt(order.id),
          action: TransactionAction.Deduct,
          deductType: DriverDeductTransactionType.Withdraw,
          payoutAccountId: payoutAccount.id,
        });
      }
    }

    // 4d) Deduct rider wallet (if any wallet-covered remainder)
    // remainingDue was verified 0 above. Wallet deduction amount is the part of that 0 which wallet was supposed to cover:
    // Compute from inputs to avoid confusion:
    // totalDueBeforeCash = costAfterCoupon + tip - alreadyPaid
    // walletPart = max(0, totalDueBeforeCash - cashAmount - capturedFromGateway)
    // Since we don’t track capture amount separately here, use the simple guard:
    const riderDeductAmount =
      order.paymentMethod.mode === PaymentMode.Wallet ||
      (order.paymentMethod.mode === PaymentMode.SavedPaymentMethod &&
        deduceFromWallet)
        ? Math.max(
            0,
            order.costEstimateForRider + tip - alreadyPaid - cashAmount,
          )
        : 0;

    if (riderDeductAmount > 0) {
      await this.sharedRiderWalletService.rechargeWallet({
        status: TransactionStatus.Done,
        action: TransactionAction.Deduct,
        deductType: RiderDeductTransactionType.OrderFee,
        currency: order.currency,
        requestId: parseInt(order.id),
        amount: -riderDeductAmount,
        riderId: parseInt(order.riderId!),
      });
    }

    // 5) Close order
    await this.saveActiveOrderToDisk(
      {
        ...order,
        totalPaid: order.costEstimateForRider,
        status: OrderStatus.Finished,
      },
      {
        finishTimestamp: new Date(),
      },
    );
    await this.activeOrderRedisService.deleteOrder(order.id);
    await this.activityRepository.insert({
      requestId: parseInt(order.id),
      type: RequestActivityType.Paid,
    });

    // Drivers must stay online after completing a ride, regardless of
    // wallet balance, until they manually toggle offline or log out.
    // We still log a low-balance warning here for ops visibility, but no
    // longer force the driver offline or wipe their Redis presence.
    const minimumAllowedBalance = Number(
      process.env.DRIVER_MINIMUM_ALLOWED_BALANCE ?? 0,
    );
    const closingBalance = await this.driverService.getWalletBalance(
      parseInt(order.driverId!),
      order.currency,
    );
    if (closingBalance < minimumAllowedBalance) {
      Logger.warn(
        `Driver ${order.driverId} balance (${closingBalance}) is below minimum allowed (${minimumAllowedBalance}) after completing order ${order.id}.`,
        'SharedOrderService.finish.balanceCheck',
      );
    }

    return null;
  }

  async assignOrderToDriver(orderId: number, driverId: number): Promise<void> {
    // 1) Fetch offer/active state + driver meta in parallel
    const [rideOffer, activeOrder, driver] = await Promise.all([
      this.rideOfferRedisService.getRideOfferMetadata(orderId.toString()),
      this.activeOrderRedisService.getActiveOrder(orderId.toString()),
      this.driverRedisService.getOnlineDriverMetaData(driverId.toString()),
    ]);

    if (!driver) return; // driver went offline

    // Determine source of truth for rider + waypoints
    let riderId: string | undefined;
    let waypoints: WaypointBase[] | undefined;

    if (rideOffer) {
      riderId = rideOffer.riderId!;
      waypoints = rideOffer.waypoints;
    } else if (activeOrder) {
      riderId = activeOrder.riderId!;
      waypoints = activeOrder.waypoints;
    } else {
      // Nothing to assign
      return;
    }

    // Fetch rider
    const rider = await this.riderRedisService.getOnlineRider(riderId);
    if (!rider || !waypoints?.length) return;

    // 2) Compute travel metrics (parallel where possible)
    const pickupPoint = waypoints[0].location;

    const [driverTravel, tripTravel] = await Promise.all([
      driver.location
        ? this.googleServices.getSumDistanceAndDuration([
            driver.location,
            pickupPoint,
          ])
        : Promise.resolve({ distance: 0, duration: 0, directions: [] }),
      this.googleServices.getSumDistanceAndDuration(
        waypoints.map((w) => w.location),
      ),
    ]);

    const now = Date.now();
    const etaPickup = new Date(now + driverTravel.duration * 1000);
    const etaDropoff = new Date(
      etaPickup.getTime() + tripTravel.duration * 1000,
    );

    // 3) Update state (offer vs active)
    if (rideOffer) {
      await this.rideOfferRedisService.acceptOfferByDriver({
        orderId: orderId.toString(),
        driverId: driverId.toString(),
        pickupEta: etaPickup,
        dropoffEta: etaDropoff,
        driverDirections: driverTravel.directions,
      });
    } else {
      // Transition active order to this driver, notify the previous one if any
      await this.activeOrderRedisService.updateOrderStatus(orderId.toString(), {
        driverId: driverId.toString(),
      });

      if (
        activeOrder?.driverId &&
        activeOrder.driverId !== driverId.toString()
      ) {
        const prevDriver =
          await this.driverRedisService.getOnlineDriverMetaData(
            activeOrder.driverId,
          );
        this.pubsubService.publish(
          'driver.event',
          { driverId },
          {
            type: DriverEventType.ActiveOrderCompleted,
            orderId,
            driverId: parseInt(prevDriver.id),
          },
        );

        const prevToken = prevDriver?.fcmTokens?.[0];
        if (prevToken) this.driverNotificationService.canceled(prevToken);
      }
    }

    // 4) Notify both sides
    this.pubsubService.publish(
      'driver.event',
      {
        driverId,
      },
      {
        type: DriverEventType.ActiveOrderAssigned,
        orderId,
        driverId: parseInt(driver.id),
      },
    );
    const driverToken = driver.fcmTokens?.[0];
    if (driverToken) {
      this.driverNotificationService.assigned(
        driverToken,
        etaPickup.toISOString(),
        waypoints[0].address,
        waypoints[waypoints.length - 1].address,
      );
    }

    const riderToken = rider.fcmTokens?.[0];
    if (riderToken)
      this.riderNotificationService.bookingAssigned(riderToken, 'now');

    // PubSub update for rider app
    this.pubsubService.publish(
      'rider.order.updated',
      {
        riderId: parseInt(riderId),
      },
      {
        type: RiderOrderUpdateType.DriverAssigned,
        driver: {
          ...driver,
          fullName: driver!.firstName,
          profileImageUrl: driver.avatarImageAddress,
          vehicleName: driver.vehicleName,
          vehicleColor: driver.vehicleColor,
          vehiclePlate: driver.vehiclePlate,
          location: driver!.location,
        },
        orderId,
        status: OrderStatus.DriverAccepted,
        pickupEta: etaPickup,
        riderId: parseInt(rider.id),
      },
    );

    // 5) Persist order record
    await this.orderRepository.update(orderId, {
      status: OrderStatus.DriverAccepted,
      pickupEta: etaPickup,
      dropOffEta: etaDropoff,
      driverId,
    });
  }
}

enum CalculateFareError {
  RegionUnsupported = 'REGION_UNSUPPORTED',
  NoServiceInRegion = 'NO_SERVICE_IN_REGION',
}
