import { Injectable } from '@nestjs/common';
import {
  DispatchConfig,
  RideOfferRedisService,
  RideOfferDTO,
  PubSubService,
  DriverEventType,
  DriverNotificationService,
  DriverRedisService,
  DriverEphemeralMessageType,
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
    const pushData = this.buildPushNotificationData(order);

    for (const driverId of availableDriverIds) {
      const driver = await this.driverRedisService.getOnlineDriverMetaData(
        driverId.toString(),
      );
      this.driverNotificationService.requests(
        driver?.fcmTokens || [],
        orderId,
        pushData,
      );
        await this.driverRedisService.createEphemeralMessage(
          driverId.toString(),
          {
            messageId: `${orderId}-${driverId}-${Date.now()}`,
            type: DriverEphemeralMessageType.RideReceived,
            orderId,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            riderFullName: order.passenger
                ? [
                    order.passenger.firstName,
                    order.passenger.lastName,
                  ].filter(Boolean).join(' ') || null
                : null,
            riderProfileUrl: order.passenger?.profilePicture ?? null,
            serviceName: order.serviceName ?? null,
            serviceImageUrl: order.serviceImageAddress ?? null,
            amount: order.fareEstimate ?? null,
          },
        );

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

    const order = await this.buildOrderPayload(orderId);

    // Push notification: this is what wakes the driver app when it's
    // backgrounded/closed (the websocket pubsub publish below only reaches
    // an actively-connected app, i.e. one that's open in the foreground).
    this.driverNotificationService.requests(
      driver?.fcmTokens || [],
      orderId,
      this.buildPushNotificationData(order),
    );

    await this.pubsubService.publish(
      'driver.event',
      {
        driverId: driverId,
      },
      {
        type: DriverEventType.RideOfferReceived,
        rideOffer: order,
        driverId: driverId,
        orderId: orderId,
      },
    );
    return true;
  }

  /**
   * Shapes the fields the driver app needs to render its incoming-ride
   * overlay/heads-up UI straight from the FCM `data` payload, without
   * waiting on a GraphQL round trip first. FCM data payloads must be flat
   * string maps, so every value is stringified.
   */
  private buildPushNotificationData(order: RideOfferDTO): Record<string, string> {
    const pickup = order.waypoints?.[0];
    return {
      fareEstimate: order.fareEstimate?.toString() ?? '',
      currency: order.currency ?? '',
      distance: order.distance?.toString() ?? '',
      duration: order.duration?.toString() ?? '',
      serviceName: order.serviceName ?? '',
      pickupAddress: pickup?.address ?? '',
      expiresAt: order.expiresAt?.toISOString() ?? '',
    };
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
