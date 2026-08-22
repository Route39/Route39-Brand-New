import { Injectable, Logger } from '@nestjs/common';
import { messaging } from 'firebase-admin';
@Injectable()
export class DriverNotificationService {
  async requests(tokens: string[]) {
    tokens = tokens
      .filter((token) => (token?.length ?? 0) > 0)
      .map((x) => x) as unknown as string[];
    if (tokens.length < 1) return;
    Logger.log(tokens, 'DriverNotificationService.requests.tokens');
    try {
      const notificationResult = await messaging().sendEachForMulticast({
        tokens: tokens,
        data: { type: 'requests' },
        android: {
          notification: {
            sound: 'default',
            titleLocKey: 'notification_new_request_title',
            bodyLocKey: 'notification_new_request_body',
            channelId: 'orders',
            icon: 'notification_icon',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: {
                critical: true,
                name: process.env.REQUEST_SOUND ?? 'default',
                volume: 1.0,
              },
              badge: 1,
              contentAvailable: true,
              alert: {
                titleLocKey: 'notification_new_request_title',
                subtitleLocKey: 'notification_new_request_body',
              },
            },
          },
        },
      });
      Logger.log(notificationResult);
    } catch (error) {
      Logger.error(error);
    }
  }

  canceled(fcmToken: string | undefined) {
    this.sendNotification(
      fcmToken,
      'notification_cancel_title',
      'notification_cancel_body',
      [],
      'default',
      'tripEvents',
      { type: 'canceled' },
    );
  }

  async message(fcmToken: string, message: string) {
    if (fcmToken == null) return;
    try {
      await messaging().send({
        token: fcmToken,
        data: { type: 'message' },
        android: {
          notification: {
            sound: 'default',
            titleLocKey: 'notification_new_message_title',
            body: message,
            channelId: 'message',
            icon: 'notification_icon',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
              alert: {
                titleLocKey: 'notification_new_message_title',
                subtitle: message,
              },
            },
          },
        },
      });
    } catch (error) {
      Logger.log(JSON.stringify(error));
    }
  }

  paid(fcmToken: string) {
    this.sendNotification(
      fcmToken,
      'notification_paid_title',
      'notification_paid_body',
      [],
      'default',
      'tripEvents',
      { type: 'paid' },
    );
  }

  assigned(fcmToken: string, time: string, from: string, to: string) {
    this.sendNotification(
      fcmToken,
      'notification_assigned_title',
      'notification_assigned_body',
      [time, from, to],
      'default',
      'tripEvents',
      { type: 'assigned' },
    );
  }

  upcomingBooking(driver: string) {
    this.sendNotification(
      driver,
      'notification_upcoming_ride_title',
      'notification_upcoming_ride_body',
      [],
      'default',
      'tripEvents',
      { type: 'upcomingBooking' },
    );
  }

  async approved(fcmToken: string | undefined | null) {
    if (fcmToken == null) {
      Logger.warn(
        'Cannot send approval notification: FCM token is null',
        'DriverNotificationService.approved',
      );
      return;
    }
    const appName = process.env.APP_NAME;
    const message = appName
      ? `Good news! You're approved and can now start accepting jobs on ${appName}. Open the driver app to get started.`
      : "Good news! You're approved and can now start accepting jobs. Open the driver app to get started.";

    Logger.log(
      `Sending approval notification to token: ${fcmToken.substring(0, 20)}...`,
      'DriverNotificationService.approved',
    );

    try {
      const result = await messaging().send({
        token: fcmToken,
        data: { type: 'approved' },
        android: {
          notification: {
            sound: 'default',
            title: 'Account Approved',
            body: message,
            channelId: 'account',
            icon: 'notification_icon',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              alert: {
                title: 'Account Approved',
                body: message,
              },
            },
          },
        },
      });
      Logger.log(
        `Approval notification sent successfully. Message ID: ${result}`,
        'DriverNotificationService.approved',
      );
    } catch (error) {
      Logger.error(
        `Failed to send approval notification: ${JSON.stringify(error)}`,
        'DriverNotificationService.approved',
      );
    }
  }

  private async sendNotification(
    fcmToken: string | undefined | null,
    titleLocKey: string,
    bodyLocKey: string,
    bodyLocArgs: string[] = [],
    sound = 'default',
    channelId = 'tripEvents',
    data: Record<string, string> = {},
  ) {
    if (fcmToken == null) return;
    try {
      await messaging().send({
        token: fcmToken,
        data,
        android: {
          notification: {
            sound,
            titleLocKey,
            bodyLocKey,
            bodyLocArgs,
            channelId,
            icon: 'notification_icon',
          },
        },
        apns: {
          payload: {
            aps: {
              sound,
              alert: {
                titleLocKey,
                subtitleLocKey: bodyLocKey,
                subtitleLocArgs: bodyLocArgs,
              },
            },
          },
        },
      });
    } catch (error) {
      Logger.log(JSON.stringify(error));
    }
  }
}
