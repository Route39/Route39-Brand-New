import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Point,
  RideOfferDTO,
  RideOptionDTO,
  WaypointBase,
} from '../interfaces';
import { Gender, OrderStatus, TaxiOrderType } from '../entities';
import { PricingMode } from '../entities/taxi/enums/pricing-mode.enum';
import { RangePolicy } from '../entities/taxi/enums/range-policy.enum';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { RiderRedisService } from './rider-redis.service';
import {
  RideOfferCandidate,
  RideOfferRedisSnapshot,
} from './models/ride-offer-redis-snapshot';
import { ActiveOrderCommonRedisService } from './active-order-common.redis.service';
import { PaymentMethodBase } from '../interfaces/payment-method.dto';
import { RedisClientType } from 'redis';
import { REDIS } from './redis-token';
import { DriverRedisService } from './driver-redis.service';

@Injectable()
export class RideOfferRedisService {
  constructor(
    @Inject(REDIS) private readonly redisClient: RedisClientType,
    private readonly riderRedisService: RiderRedisService,
    private readonly driverRedisService: DriverRedisService,
    private readonly activeOrderRedisService: ActiveOrderCommonRedisService,
  ) {}

  async getRideOffers(orderIds: string[]): Promise<RideOfferRedisSnapshot[]> {
    const pipeline = this.redisClient.multi();
    for (const id of orderIds) {
      pipeline.json.get(`ride_offer:${id}`);
    }
    const results = await pipeline.exec();
    return results
      .map((result) => {
        return plainToInstance(RideOfferRedisSnapshot, result);
      })
      .filter((result) => result !== null) as RideOfferRedisSnapshot[];
  }

  async getRideOfferMetadata(
    orderId: string,
  ): Promise<RideOfferRedisSnapshot | null> {
    Logger.log(`Getting order metadata for orderId: ${orderId}`);
    const metaData = await this.redisClient.json.get(`ride_offer:${orderId}`);
    if (!metaData) return null;
    const result = plainToInstance(RideOfferRedisSnapshot, metaData);
    return result;
  }

  async getRideOfferMetadataAsRideOffer(
    orderId: string,
  ): Promise<RideOfferDTO> {
    const orderMetadata = await this.getRideOfferMetadata(orderId);
    if (!orderMetadata) {
      throw new Error(`Order metadata not found for orderId: ${orderId}`);
    }
    return {
      ...orderMetadata,
      id: parseInt(orderId),
      expiresAt: orderMetadata.expireAt,
      distance: orderMetadata.estimatedDistance,
      duration: orderMetadata.estimatedDuration,
      fareEstimate: orderMetadata.costEstimateForDriver,
      directions: [],
      options: orderMetadata.options ?? [],
      passenger: {
        firstName: orderMetadata.riderFirstName,
        lastName: orderMetadata.riderLastName,
        profilePicture: orderMetadata.riderProfileImageUrl,
      },
    };
  }

  async offerRide(input: {
    orderId: string;
    driverIds: string[];
    offerExpiresAt: Date;
  }): Promise<void> {
    // Validate orderId to prevent empty strings from being stored in Redis
    if (!input.orderId || input.orderId.trim() === '') {
      Logger.warn('offerRide called with empty orderId, skipping');
      return;
    }

    Logger.debug(
      `Offering ride orderId: ${input.orderId} to drivers: ${input.driverIds.join(', ')}`,
    );

    // Check if this is the first offer or a subsequent wave
    const existingMetadata = await this.getRideOfferMetadata(input.orderId);
    const isFirstOffer = !existingMetadata?.offeredToDriverIds?.length;

    const pipeline = this.redisClient.multi();

    if (isFirstOffer) {
      // First offer: set the initial values
      pipeline.json.set(
        `ride_offer:${input.orderId}`,
        '$.offeredToDriverIds',
        input.driverIds,
      );
      pipeline.json.set(
        `ride_offer:${input.orderId}`,
        '$.expireAt',
        input.offerExpiresAt.getTime(),
      );
    } else {
      // Subsequent waves: append to existing drivers (don't update expireAt)
      for (const driverId of input.driverIds) {
        pipeline.json.arrAppend(
          `ride_offer:${input.orderId}`,
          '$.offeredToDriverIds',
          driverId,
        );
      }
    }

    // Always update dispatchedToUserAt for each wave (so each wave sees when it was dispatched)
    pipeline.json.set(
      `ride_offer:${input.orderId}`,
      '$.dispatchedToUserAt',
      new Date().getTime(),
    );

    // Add order to each driver's offer list
    for (const driverId of input.driverIds) {
      pipeline.json.arrAppend(
        `driver:${driverId}`,
        '$.rideOfferIds',
        input.orderId,
      );
    }
    await pipeline.exec();
  }

  async removeRideOfferFromDriverOffers(input: {
    orderId: string;
    driverIds: string[];
  }): Promise<void> {
    Logger.debug(
      `Removing ride offer ${input.orderId} from drivers: ${input.driverIds.join(', ')}`,
    );

    for (const driverId of input.driverIds) {
      // Get current rideOfferIds
      // Note: JSONPath $.rideOfferIds returns an array of matches, so we need [0] to get the actual array
      const rideOfferIdsResult = await this.redisClient.json.get(
        `driver:${driverId}`,
        {
          path: '$.rideOfferIds',
        },
      );

      if (!rideOfferIdsResult) {
        Logger.debug(`No ride offer data found for driver ${driverId}`);
        continue;
      }
      if (!Array.isArray(rideOfferIdsResult)) {
        Logger.debug(`Invalid ride offer data format for driver ${driverId}`);
        continue;
      }

      // JSONPath returns array of matches, get the first (and only) match
      const rideOfferIds = rideOfferIdsResult[0] as string[];
      if (!Array.isArray(rideOfferIds)) {
        Logger.debug(
          `Invalid ride offer IDs format for driver ${driverId}: expected array`,
        );
        continue;
      }

      // Filter out the orderId and also remove any empty strings that may have been erroneously added
      const updatedIds = rideOfferIds.filter(
        (id) => id !== input.orderId && id && id.trim() !== '',
      );
      Logger.debug(
        `Updated ride offer IDs for driver ${driverId}: [${updatedIds.join(', ')}]`,
      );

      // Write back
      await this.redisClient.json.set(
        `driver:${driverId}`,
        '$.rideOfferIds',
        updatedIds,
      );
    }
  }

  async rideOfferRejected(input: {
    orderId: string;
    driverId: string;
  }): Promise<void> {
    const orderMetadata = await this.getRideOfferMetadata(input.orderId);
    if (!orderMetadata) {
      throw new Error(`Order metadata not found for orderId: ${input.orderId}`);
    }
    const driverMetadata =
      await this.driverRedisService.getOnlineDriverMetaData(input.driverId);
    const driverRideOfferIndex = driverMetadata.rideOfferIds.indexOf(
      input.orderId,
    );
    const pipeline = this.redisClient.multi();
    pipeline.json.arrPop(`driver:${input.driverId}`, {
      path: '$.rideOfferIds',
      index: driverRideOfferIndex,
    });
    pipeline.json.arrAppend(
      `ride_offer:${input.orderId}`,
      '$.rejectedByDriverIds',
      input.driverId,
    );
    pipeline.json.numIncrBy(
      `driver:${input.driverId}`,
      '$.rejectedOrdersCount',
      1,
    );
    await pipeline.exec();
  }

  // This method is called when the ride offer expires in time.
  async rideOfferExpired(input: { orderId: string }) {
    const orderMetadata = await this.getRideOfferMetadata(input.orderId);
    if (!orderMetadata) {
      return;
    }
    await this.removeRideOfferFromDriverOffers({
      orderId: input.orderId,
      driverIds: orderMetadata.offeredToDriverIds,
    });
    // Remove the orderId from rider's activeOrderIds
    if (orderMetadata.riderId) {
      await this.riderRedisService.removeActiveOrderFromRider(
        orderMetadata.riderId,
        input.orderId,
      );
    }
    await this.redisClient.del(`ride_offer:${input.orderId}`);
  }

  async createRideOffer(input: {
    status: OrderStatus;
    currency: string;
    createdAt: Date;
    scheduledAt?: Date;
    type: TaxiOrderType;
    waitMinutes?: number;
    estimatedDistance: number;
    estimatedDuration: number;
    totalPaid: number;
    paymentMethod: PaymentMethodBase;
    orderId: string;
    riderId: string;
    costEstimateForDriver: number;
    costEstimateForRider: number;
    costMin?: number;
    costMax?: number;
    pricingMode: PricingMode;
    rangePolicy?: RangePolicy;
    serviceId: string;
    fleetId?: number;
    serviceName: string;
    serviceImageAddress: string;
    options: RideOptionDTO[];
    driverId?: string;
    pickupLocation: Point;
    tripDirections: Point[];
    waypoints: WaypointBase[];
    riderMobileNumber: string;
    riderFirstName: string | null;
    riderLastName: string | null;
    riderProfileImageUrl: string | null;
    riderCountryIso: string | null;
    riderWalletCredit: number | 0;
    riderEmail: string | null;
    riderGender: Gender | null;
    riderFcmTokens: string[];
  }): Promise<void> {
    const metadata: RideOfferRedisSnapshot = {
      ...input,
      id: input.orderId,
      pickupLocation:
        `${input.pickupLocation.lng}, ${input.pickupLocation.lat}` as unknown as Point,
      createdAt: input.createdAt.getTime() as unknown as Date,
      scheduledAt: input.scheduledAt?.getTime() as unknown as Date,
      offeredToDriverIds: [],
      rejectedByDriverIds: [],
      candidates: [],
    };
    Logger.debug(metadata);
    await this.redisClient.json.set(
      `ride_offer:${input.orderId}`,
      '$',
      instanceToPlain(metadata),
    );
    const onlineRider = await this.riderRedisService.getOnlineRider(
      input.riderId,
    );
    if (!onlineRider) {
      await this.riderRedisService.createOnlineRider({
        riderId: input.riderId,
        profileImageUrl: input.riderProfileImageUrl || null,
        countryIso: input.riderCountryIso || null,
        email: input.riderEmail || null,
        gender: input.riderGender || null,
        mobileNumber: input.riderMobileNumber || '-',
        firstName: input.riderFirstName || '-',
        lastName: input.riderLastName || '-',
        fcmTokens: input.riderFcmTokens || [],
        walletCredit: input.riderWalletCredit,
        currency: input.currency || process.env.DEFAULT_CURRENCY || 'USD',
        activeOrderIds: [input.orderId.toString()],
      });
    } else {
      await this.riderRedisService.addActiveOrderToRider(
        input.riderId,
        input.orderId,
      );
    }
  }

  async acceptOfferByDriver(input: {
    orderId: string;
    driverId: string;
    driverFirstName?: string | null;
    driverAvatarUrl?: string | null;
    riderFirstName?: string | null;
    riderAvatarUrl?: string | null;
    pickupEta: Date;
    dropoffEta: Date;
    driverDirections: Point[];
  }): Promise<void> {
    Logger.debug(
      `Driver ${input.driverId} accepting offer for order ${input.orderId}`,
    );

    const orderMetadata = await this.getRideOfferMetadata(input.orderId);
    if (!orderMetadata) {
      throw new Error(`Order with ID ${input.orderId} not found`);
    }

    Logger.debug(
      `Removing ride offer ${input.orderId} from all offered drivers`,
    );
    await this.removeRideOfferFromDriverOffers({
      orderId: input.orderId,
      driverIds: orderMetadata.offeredToDriverIds,
    });

    const pipeline = this.redisClient.multi();
    pipeline.del(`ride_offer:${input.orderId}`);
    pipeline.json.numIncrBy(
      `driver:${input.driverId}`,
      '$.acceptedOrdersCount',
      1,
    );
    pipeline.json.arrAppend(
      `driver:${input.driverId}`,
      `$.activeOrderIds`,
      input.orderId,
    );
    await pipeline.exec();

    Logger.debug(
      `Creating active order for orderId: ${input.orderId} with driverId: ${input.driverId}`,
    );
    await this.activeOrderRedisService.createActiveOrder({
      ...orderMetadata,
      status: OrderStatus.DriverAccepted,
      pickupEta: input.pickupEta,
      dropoffEta: input.dropoffEta,
      driverId: input.driverId,
      driverFirstName: input.driverFirstName ?? null,
      driverAvatarUrl: input.driverAvatarUrl ?? null,
      riderFirstName: input.riderFirstName ?? null,
      riderAvatarUrl: input.riderAvatarUrl ?? null,
      driverDirections: input.driverDirections,
    });

    Logger.debug(
      `Successfully processed ride offer acceptance for order ${input.orderId}`,
    );
  }

  async flushOrders(requestIds: string[]) {
    const pipeline = this.redisClient.multi();
    for (const requestId of requestIds) {
      pipeline.del(`ride_offer:${requestId}`);
    }
    await pipeline.exec();
  }

  /**
   * Removes a driver from an offer's offeredToDriverIds array.
   * Used when a driver times out to clean up stale references.
   */
  async removeDriverFromOfferMetadata(input: {
    orderId: string;
    driverId: string;
  }): Promise<void> {
    const offerMetadata = await this.getRideOfferMetadata(input.orderId);
    if (!offerMetadata) {
      return;
    }

    const updatedDriverIds = offerMetadata.offeredToDriverIds.filter(
      (id) => id !== input.driverId,
    );

    await this.redisClient.json.set(
      `ride_offer:${input.orderId}`,
      '$.offeredToDriverIds',
      updatedDriverIds,
    );

    Logger.debug(
      `Removed driver ${input.driverId} from offer ${input.orderId} metadata`,
    );
  }

  async addOrderCandidates(
    orderId: string,
    candidates: RideOfferCandidate[],
  ): Promise<void> {
    const pipeline = this.redisClient.multi();
    pipeline.json.set(
      `ride_offer:${orderId}`,
      '$.candidates',
      instanceToPlain(candidates),
    );
    await pipeline.exec();
  }

  async getOrderCandidates(orderId: string): Promise<RideOfferCandidate[]> {
    const metaData = await this.getRideOfferMetadata(orderId);
    if (!metaData || !metaData.candidates) {
      return [];
    }
    return metaData.candidates ?? [];
  }
}
