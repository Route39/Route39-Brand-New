import { Injectable, Logger } from '@nestjs/common';
import {
  ActiveOrderCommonRedisService,
  DriverEntity,
  DriverRedisSnapshot,
  GoogleServicesService,
  OrderStatus,
  Point,
  PubSubService,
  RiderOrderUpdateType,
  TaxiOrderEntity,
  RideOfferRedisService,
} from '@ridy/database';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DriverStatus } from '@ridy/database';
import { DriverRedisService } from '@ridy/database';
import { TimesheetService } from '../timesheet/timesheet.service';
import { DriverPerformanceDTO } from './dto/driver-performance.dto';

import { DriverDTO } from '../core/dtos/driver.dto';
import { UpdateDriverOfferFilterInput } from './inputs/update-driver-offer-filter.input';
import { ServiceDTO } from '../core/dtos/service.dto';
import { TaxiServiceRedisService } from '@ridy/database';
import { ForbiddenError } from '@nestjs/apollo';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(DriverEntity)
    public driverRepository: Repository<DriverEntity>,
    @InjectRepository(TaxiOrderEntity)
    private taxiOrderRepository: Repository<TaxiOrderEntity>,
    private activeOrderRedisService: ActiveOrderCommonRedisService,
    private driverRedisService: DriverRedisService,
    private serviceRedisService: TaxiServiceRedisService,
    private timesheetService: TimesheetService,
    private readonly pubsub: PubSubService,
    private readonly rideOfferRedisService: RideOfferRedisService,
    private readonly googleServices: GoogleServicesService,
  ) {}

  async findWithDeleted(
    input: FindOptionsWhere<DriverEntity>,
  ): Promise<DriverEntity | null> {
    return this.driverRepository.findOne({ where: input, withDeleted: true });
  }

  async findOrCreateUserWithMobileNumber(input: {
    mobileNumber: string;
    countryIso?: string;
  }): Promise<DriverEntity> {
    const findResult = await this.findWithDeleted({
      mobileNumber: input.mobileNumber,
    });
    if (findResult?.deletedAt != null) {
      await this.driverRepository.restore(findResult.id);
    }
    if (findResult == null) {
      const driver = this.driverRepository.create(input);
      return await this.driverRepository.save(driver);
    }
    const user = await this.driverRepository.findOneOrFail({
      where: { mobileNumber: input.mobileNumber },
      withDeleted: true,
      relations: {
        documents: true,
        media: true,
      },
    });
    return user;
  }

  async findByIds(ids: number[]): Promise<DriverEntity[]> {
    return this.driverRepository.find({
      where: { id: In(ids) },
      withDeleted: true,
    });
  }

  async setPassword(input: {
    driverId: number;
    password: string;
  }): Promise<DriverEntity> {
    await this.driverRepository.update(input.driverId, {
      password: input.password,
    });
    return this.driverRepository.findOneByOrFail({ id: input.driverId });
  }

  async expireDriverStatus(driverIds: number[]) {
    if (driverIds.length < 1) {
      return;
    }
    const idsToExpire: number[] = [];
    for (const driverId of driverIds) {
      const onlineDriver =
        await this.driverRedisService.getOnlineDriverMetaData(
          driverId.toString(),
        );

      // Never expire a driver who currently has an active order (e.g. mid-trip
      // or waiting on the rider's cash payment). Their location feed can go
      // stale simply because the app was minimized/backgrounded — expiring
      // them here would wipe their Redis record (including activeOrderIds)
      // and strand the order, since the driver app relies on that record to
      // know an order is still in progress.
      if ((onlineDriver?.activeOrderIds?.length ?? 0) > 0) {
        Logger.log(
          `Driver ${driverId} has an active order, skipping location expiry`,
        );
        continue;
      }

      // Clean up pending ride offers before expiring driver
      // This removes the driver from each offer's offeredToDriverIds array
      if (onlineDriver?.rideOfferIds && onlineDriver.rideOfferIds.length > 0) {
        const validOfferIds = onlineDriver.rideOfferIds.filter(
          (id) => id && id.trim() !== '',
        );
        for (const orderId of validOfferIds) {
          await this.rideOfferRedisService.removeDriverFromOfferMetadata({
            orderId,
            driverId: driverId.toString(),
          });
          Logger.log(
            `Driver ${driverId} timed out with pending offer ${orderId}, cleaned up reference`,
          );
        }
      }

      await this.driverRepository.update(driverId, {
        status: DriverStatus.Offline,
        lastSeenTimestamp: onlineDriver?.locationTime ?? new Date(),
        acceptedOrdersCount: onlineDriver?.acceptedOrdersCount ?? 0,
        rejectedOrdersCount: onlineDriver?.rejectedOrdersCount ?? 0,
      });
      await this.timesheetService.goOffline(driverId);
      idsToExpire.push(driverId);
    }
    await this.driverRedisService.expire(idsToExpire);
  }

  restore(id: number) {
    return this.driverRepository.restore(id);
  }

  async goOnline(id: number, location: Point): Promise<boolean> {
    const currentDriver = await this.driverRepository.findOneBy({ id });
    if (currentDriver?.status === DriverStatus.Blocked) {
      throw new ForbiddenError(
        'Your account has been blocked. Please contact support for more information.',
      );
    }
    await this.driverRepository.update(id, { status: DriverStatus.Online });
    const driver = await this.driverRepository.findOneOrFail({
      where: { id },
      relations: {
        enabledServices: true,
        car: true,
        carColor: true,
        media: true,
        wallet: true,
      },
    });
    const primaryWallet = driver.wallet?.sort((a, b) => a.id - b.id)[0] ?? {
      currency: process.env.DEFAULT_CURRENCY ?? 'USD',
      balance: 0,
    };
    const currency = primaryWallet.currency;
    await this.driverRedisService.makeDriverOnline({
      id: driver.id.toString(),
      firstName: driver.firstName ?? '-',
      lastName: driver.lastName ?? '-',
      mobileNumber: driver.mobileNumber ?? '0',
      email: driver.email,
      vehicleColor: driver.carColor?.name ?? '-',
      vehicleName: driver.car?.name ?? '-',
      vehiclePlate: driver.carPlate ?? '-',
      currency: currency,
      walletCredit: primaryWallet.balance ?? 0,
      avatarImageAddress: driver.media?.address ?? '',
      location: location,
      fleetId: driver.fleetId?.toString(),
      heading: location.heading ?? 0,
      searchDistance: driver.searchDistance,
      acceptedOrdersCount: driver.acceptedOrdersCount,
      rejectedOrdersCount: driver.rejectedOrdersCount,
      serviceIds:
        driver.enabledServices?.map((s) => s.serviceId.toString()) ?? [],
      fcmTokens:
        driver.notificationPlayerId != null
          ? [driver.notificationPlayerId!]
          : [],
      rating: driver.rating,
    });
    return true;
  }

  async goOffline(id: number): Promise<boolean> {
    const currentDriver = await this.driverRepository.findOneBy({ id });
    if (currentDriver?.status === DriverStatus.Blocked) {
      throw new ForbiddenError(
        'Your account has been blocked. Please contact support for more information.',
      );
    }
    const onlineDriver = await this.driverRedisService.getOnlineDriverMetaData(
      id.toString(),
    );
    if ((onlineDriver?.activeOrderIds?.length ?? 0) > 0) {
      throw new ForbiddenError('Driver is currently active in an order');
    }
    await this.driverRepository.update(id, {
      status: DriverStatus.Offline,
      lastSeenTimestamp: new Date(),
      ...(onlineDriver && {
        acceptedOrdersCount: onlineDriver.acceptedOrdersCount ?? 0,
        rejectedOrdersCount: onlineDriver.rejectedOrdersCount ?? 0,
      }),
    });
    this.driverRedisService.expire([id]);
    return true;
  }

  async getPerformance(id: number): Promise<DriverPerformanceDTO> {
    const driver = await this.driverRepository.findOne({ where: { id } });
    if (!driver) {
      throw new Error('Driver not found');
    }
    const driverOrders = await this.taxiOrderRepository.count({
      where: { driverId: id, status: OrderStatus.Finished },
    });
    const distanceTraveled = await this.taxiOrderRepository.sum(
      'distanceBest',
      {
        driverId: id,
        status: OrderStatus.Finished,
      },
    );
    return {
      rating: driver.rating != null ? Math.round(driver.rating / 20) : null,
      acceptanceRate:
        (driver.acceptedOrdersCount /
          (driver.acceptedOrdersCount + driver.rejectedOrdersCount) || 0) * 100,
      totalRides: driverOrders,
      distanceTraveled: distanceTraveled || 0,
    };
  }

  // Converts a DriverEntity to a DTO. NOTE: Ensure enabledServices & wallet relations are loaded when calling this method.
  createDTOFromEntity(entity: DriverEntity): DriverDTO {
    const primaryWallet = entity.wallet?.sort((a, b) => a.id - b.id)[0] ?? {
      currency: process.env.DEFAULT_CURRENCY ?? 'USD',
      balance: 0,
    };
    const currency = primaryWallet.currency;
    const dto: Required<DriverDTO> = {
      id: entity.id,
      firstName: entity.firstName ?? '',
      lastName: entity.lastName ?? '',
      mobileNumber: entity.mobileNumber,
      email: entity.email ?? '',
      profileImageUrl: entity.media?.address ?? '',
      status:
        entity.status == DriverStatus.Online ||
        entity.status == DriverStatus.InService
          ? DriverStatus.Offline
          : entity.status, // If the user is not found in the redis database it should be treated as offline
      searchDistance: entity.searchDistance ?? null,
      currency: currency,
      walletCredit: primaryWallet.balance,
      softRejectionNote: entity.softRejectionNote ?? null,
    };
    return dto;
  }

  createDTOFromSnapshot(snapshot: DriverRedisSnapshot): DriverDTO {
    const dto: Required<DriverDTO> = {
      id: parseInt(snapshot.id),
      firstName: snapshot.firstName ?? '',
      lastName: snapshot.lastName ?? '',
      mobileNumber: snapshot.mobileNumber,
      email: snapshot.email ?? '',
      profileImageUrl: snapshot.avatarImageAddress,
      walletCredit: snapshot.walletCredit ?? 0,
      currency: snapshot.currency,
      status:
        (snapshot.activeOrderIds?.length ?? 0) > 0
          ? DriverStatus.InService
          : DriverStatus.Online,
      searchDistance: snapshot.searchDistance ?? null,
      softRejectionNote: null,
    };
    return dto;
  }

  async updateDriverOfferFilter(
    driverId: number,
    input: UpdateDriverOfferFilterInput,
  ): Promise<DriverDTO> {
    const driver = await this.driverRedisService.getOnlineDriverMetaData(
      driverId.toString(),
    );
    if (driver) {
      await this.driverRedisService.updateDriverOfferFilters(driverId, {
        searchDistance: input.searchDistance,
        serviceIds: input.serviceIds,
      });
      return this.createDTOFromSnapshot(driver);
    } else {
      let entity = await this.driverRepository.findOneOrFail({
        where: { id: driverId },
        relations: { enabledServices: true },
      });
      this.driverRepository.update(entity.id, {
        searchDistance: input.searchDistance,
        enabledServices:
          input.serviceIds == null
            ? entity.enabledServices
            : entity.enabledServices!.map((s) => ({
                driverEnabled: input.serviceIds!.includes(s.serviceId),
                serviceId: s.serviceId,
              })),
      });
      entity = await this.driverRepository.findOneOrFail({
        where: { id: driverId },
        relations: { enabledServices: true },
      });
      return this.createDTOFromEntity(entity);
    }
  }

  async getDriver(id: number): Promise<DriverDTO> {
    const driverMetaData =
      await this.driverRedisService.getOnlineDriverMetaData(id.toString());
    if (driverMetaData) {
      return this.createDTOFromSnapshot(driverMetaData);
    } else {
      const entity = await this.driverRepository.findOne({
        where: { id },
      });
      if (entity == null) {
        throw new ForbiddenError(
          `Driver's profile was not found. You can login again.`,
        );
      }
      if (entity.status == DriverStatus.Blocked) {
        throw new ForbiddenError(
          'Your account has been blocked. Please contact support for more information.',
        );
      }
      if (entity.status == DriverStatus.HardReject) {
        throw new ForbiddenError(
          'Your application does not meet our platform requirements. Please contact support for more information.',
        );
      }
      return this.createDTOFromEntity(entity);
    }
  }

  async updateDriverLocation(driverId: number, point: Point): Promise<void> {
    const onlineDriver = await this.driverRedisService.setLocation(
      driverId.toString(),
      point,
    );
    if (onlineDriver == null) {
      Logger.warn(
        `Driver ${driverId} is not online but location update was attempted.`,
      );
      return;
    }
    this.pubsub.publish(
      'admin.driver-location.updated',
      {
        operatorId: 0,
      },
      {
        location: onlineDriver.location,
        driverId: parseInt(onlineDriver.id),
      },
    );
    const activeOrders = await this.activeOrderRedisService.getActiveOrders(
      onlineDriver.activeOrderIds,
    );
    for (const order of activeOrders) {
      // Driver is still en route to the pickup point: recompute the
      // pickup polyline from the driver's new location so it stays
      // in sync with the live marker instead of staying frozen at
      // whatever it was when the driver accepted the ride.
      let updatedDirections: Point[] | undefined;
      if (
        [OrderStatus.DriverAccepted, OrderStatus.Arrived].includes(
          order.status,
        ) &&
        order.waypoints?.length
      ) {
        try {
          const pickupPoint = order.waypoints[0].location;
          const driverTravel = await this.googleServices.getSumDistanceAndDuration([
            point,
            pickupPoint,
          ]);
          updatedDirections = driverTravel.directions;
          await this.activeOrderRedisService.updateOrderStatus(order.id, {
            driverDirections: updatedDirections,
          });
        } catch (err) {
          Logger.warn(
            `Failed to recompute driver directions for order ${order.id}: ${err}`,
          );
        }
      }

      this.pubsub.publish(
        'rider.order.updated',
        {
          riderId: parseInt(order.riderId),
        },
        {
          type: RiderOrderUpdateType.DriverLocationUpdated,
          driverLocation: point,
          orderId: parseInt(order.id),
          riderId: parseInt(order.riderId),
          ...(updatedDirections ? { directions: updatedDirections } : {}),
        },
      );

      // Accumulate distance for rides in Started status
      if (order.status === OrderStatus.Started && order.lastTrackingPoint) {
        const segmentDistance = this.calculateHaversineDistance(
          order.lastTrackingPoint,
          point,
        );

        // Only accumulate if movement is significant (>10m) to filter GPS noise
        if (segmentDistance > 10) {
          await this.activeOrderRedisService.updateOrderStatus(order.id, {
            actualDistance: (order.actualDistance ?? 0) + segmentDistance,
            lastTrackingPoint: point,
          });
        }
      }
    }
  }

  /**
   * Calculate the distance between two points using the Haversine formula
   * @returns Distance in meters
   */
  private calculateHaversineDistance(p1: Point, p2: Point): number {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (p1.lat * Math.PI) / 180;
    const phi2 = (p2.lat * Math.PI) / 180;
    const deltaPhi = ((p2.lat - p1.lat) * Math.PI) / 180;
    const deltaLambda = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async getActiveServices(driverId: number): Promise<ServiceDTO[]> {
    const driverMetaData =
      await this.driverRedisService.getOnlineDriverMetaData(
        driverId.toString(),
      );
    if (driverMetaData) {
      const allServices = await this.serviceRedisService.getTaxiServicesByIds(
        driverMetaData.serviceIds,
      );
      return allServices.map((service) => ({
        id: service.id,
        name: service.name,
        imageUrl: service.imageAddress,
      }));
    } else {
      const entity = await this.driverRepository.findOneOrFail({
        where: { id: driverId },
        relations: {
          enabledServices: {
            service: true,
          },
        },
      });
      return entity.enabledServices!.map((service) => ({
        id: service!.service!.id!,
        name: service!.service!.name!,
        imageUrl: service!.service!.media!.address!,
      }));
    }
  }
}
