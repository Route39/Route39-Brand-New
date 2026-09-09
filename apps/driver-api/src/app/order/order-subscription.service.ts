import { Injectable } from '@nestjs/common';
import { Context, Subscription } from '@nestjs/graphql';
import { DriverEventPayload, PubSubService } from '@ridy/database';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class OrderSubscriptionService {
  constructor(private readonly pubsub: PubSubService) {}

  @Subscription(() => DriverEventPayload, {
    filter: (payload: DriverEventPayload, variables, context) => {
      return context.req.extra.user.id == payload.driverId;
    },
    resolve: (payload: DriverEventPayload): DriverEventPayload => {
      if (payload.message) {
        payload.message.createdAt =
          payload.message.createdAt != null
            ? new Date(payload.message.createdAt)
            : new Date();
      }

      if (payload.rideOffer) {
        payload.rideOffer.expiresAt = payload.rideOffer?.expiresAt
          ? new Date(payload.rideOffer.expiresAt)
          : undefined;
        payload.rideOffer.dispatchedToUserAt =
          payload.rideOffer?.dispatchedToUserAt != null
            ? new Date(payload.rideOffer.dispatchedToUserAt)
            : undefined;
      }
      return plainToInstance(DriverEventPayload, payload);
    },
  })
  driverEvents(@Context() context: any): AsyncIterator<DriverEventPayload> {
  const driverId = context.req.extra.user.id;

  // console.log(
  //   `[Driver Subscription] Creating Redis subscription for driver=${driverId}`,
  // );

  const iterator = this.pubsub.asyncIterator('driver.event', {
    driverId,
  });

  // console.log(
  //   `[Driver Subscription] Redis topic=driver:${driverId}:event`,
  // );

  return iterator;
}
}
