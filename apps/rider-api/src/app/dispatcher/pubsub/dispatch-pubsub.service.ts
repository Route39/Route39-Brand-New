import { Injectable } from '@nestjs/common';
import {
  DispatchConfig,
  RideOfferRedisService,
  RideOfferDTO,
  PubSubService,
  DriverEventType,
  DriverNotificationService,
  DriverRedisService,
} from '@ridy/database';

@Injectable()
export class DispatchPubSubService {
  constructor(
    private readonly pubsubService: PubSubService,
    private readonly orderRedisService: RideOfferRedisService,
    private readonly driverNotificationService: DriverNotificationService,
    private readonly driverRedisService: DriverRedisService,
  ) {}

  /**
   * Broadcast mode: Notify multiple drivers at once
   */
  async broadcastOrder(
    orderId: number,
    driverIds: number[],
    expireInSeconds: number,
  ) {
    // Filter out drivers who already have pending offers or active orders
    const availableDriverIds: number[] = [];
    for (const driverId of driverIds) {
      const driver = await this.driverRedisService.getOnlineDriverMetaData(
        driverId.toString(),
      );
      const hasPendingOffers = driver?.rideOfferIds && driver.rideOfferIds.length > 0;
      const hasActiveOrders = driver?.activeOrderIds && driver.activeOrderIds.length > 0;
      if (driver && !hasPendingOffers && !hasActiveOrders) {
        availableDriverIds.push(driverId);
      }
    }

    if (availableDriverIds.length === 0) {
      return; // No available drivers in this wave
    }

    // Update Redis with only available drivers
    await this.orderRedisService.offerRide({
      orderId: orderId.toString(),
      driverIds: availableDriverIds.map((id) => id.toString()),
      offerExpiresAt: new Date(Date.now() + expireInSeconds * 1000),
    });

    // Then fetch the updated payload to send to drivers
    const order = await this.buildOrderPayload(orderId);

    for (const driverId of availableDriverIds) {
      const driver = await this.driverRedisService.getOnlineDriverMetaData(
        driverId.toString(),
      );
      this.driverNotificationService.requests(driver?.fcmTokens || []);
      this.pubsubService.publish(
        'driver.event',
        {
          driverId,
        },
        {
          type: DriverEventType.RideOfferReceived,
          rideOffer: order,
          driverId: driverId,
          orderId: orderId,
        },
      );
    }
  }

  /**
   * Sequential mode: Notify one driver at a time per attempt
   * @param isFirstDispatch - true only on the very first dispatch attempt (retryCount === 0 && currentCandidateIndex === 0)
   * @returns true if offer was sent, false if driver was unavailable
   */
  async sequentialDispatch(
    orderId: number,
    driverIds: number[],
    config: DispatchConfig,
    currentCandidateIndex: number,
    isFirstDispatch = false,
  ): Promise<boolean> {
    if (driverIds.length === 0) return false;

    const driverId = driverIds[currentCandidateIndex];

    // Revoke from previous driver (skip only on the very first dispatch)
    // On subsequent rounds (when currentCandidateIndex wraps to 0), we need to revoke from the last driver
    if (!isFirstDispatch) {
      const previousDriverIndex =
        currentCandidateIndex === 0
          ? driverIds.length - 1
          : currentCandidateIndex - 1;
      const previousDriverId = driverIds[previousDriverIndex];
      await this.orderRedisService.removeRideOfferFromDriverOffers({
        orderId: orderId.toString(),
        driverIds: [previousDriverId.toString()],
      });
      await this.pubsubService.publish(
        'driver.event',
        {
          driverId: previousDriverId,
        },
        {
          type: DriverEventType.RideOfferRevoked,
          orderId,
          driverId: previousDriverId,
        },
      );
    }

    // Check if current driver already has a pending offer or active order
    const driver = await this.driverRedisService.getOnlineDriverMetaData(
      driverId.toString(),
    );
    const hasPendingOffers = driver?.rideOfferIds && driver.rideOfferIds.length > 0;
    const hasActiveOrders = driver?.activeOrderIds && driver.activeOrderIds.length > 0;

    if (!driver || hasPendingOffers || hasActiveOrders) {
      // Driver busy or offline - don't send offer, processor should move to next immediately
      return false;
    }

    // Send offer to current driver
    await this.orderRedisService.offerRide({
      orderId: orderId.toString(),
      driverIds: [driverId.toString()],
      offerExpiresAt: new Date(
        Date.now() +
          (config.sequentialConfig?.perDriverTimeoutSeconds ?? 30) * 1000,
      ),
    });
    await this.pubsubService.publish(
      'driver.event',
      {
        driverId: driverId,
      },
      {
        type: DriverEventType.RideOfferReceived,
        rideOffer: await this.buildOrderPayload(orderId),
        driverId: driverId,
        orderId: orderId,
      },
    );
    return true;
  }

  /**
   * Helper to shape order payload sent to the client
   */
  private async buildOrderPayload(orderId: number): Promise<RideOfferDTO> {
    return this.orderRedisService.getRideOfferMetadataAsRideOffer(
      orderId.toString(),
    );
  }
}
