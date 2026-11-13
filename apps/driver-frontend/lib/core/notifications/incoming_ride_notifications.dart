import 'package:android_intent_plus/android_intent.dart';
import 'package:android_intent_plus/flag.dart';
import 'dart:typed_data';
import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart' show FlutterOverlayWindow;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

import '../services/ride_offer_push_handler.dart';

const String acceptActionId = 'accept_ride';

const AndroidNotificationChannel incomingRideChannel =
    AndroidNotificationChannel(
      'incoming_ride_v3',
      'Incoming Ride Requests',
      description: 'Full-screen alert shown when a new ride request arrives.',
      importance: Importance.max,
      playSound: true,
      sound: RawResourceAndroidNotificationSound('notification'),
      audioAttributesUsage: AudioAttributesUsage.alarm,
    );

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

/// Must stay a top-level function with this annotation so Android can
/// invoke it in a background isolate even if the app process was killed.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (message.data['type'] != 'requests') return;
  final orderId = message.data['orderId'];
  if (orderId == null) return;
  if (await FlutterOverlayWindow.isPermissionGranted()) {
    print("R39_BG_OVERLAY_ONLY");
    try { await showRideOfferOverlay(message.data); } catch (e, st) { print("R39_OVERLAY_ERROR $e\n$st"); }
    return;
  }

  // Top-half floating card over whatever app the driver is using right
  // now (needs the separate "display over other apps" permission). Runs
  // alongside the full-screen/heads-up notification below as a fallback
  // for drivers who haven't granted that permission.

  const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
  await flutterLocalNotificationsPlugin.initialize(
    settings: const InitializationSettings(android: androidInit),
  );
await flutterLocalNotificationsPlugin
    .resolvePlatformSpecificImplementation<
      AndroidFlutterLocalNotificationsPlugin
    >()
    ?.createNotificationChannel(incomingRideChannel);

  final fareEstimate = message.data['fareEstimate'] as String?;
  final currency = message.data['currency'] as String? ?? '';
  final pickupAddress = message.data['pickupAddress'] as String?;
  final body = (fareEstimate != null && fareEstimate.isNotEmpty)
      ? '$currency $fareEstimate'
          '${(pickupAddress != null && pickupAddress.isNotEmpty) ? ' • $pickupAddress' : ''}'
      : 'A customer is waiting for you';

  await flutterLocalNotificationsPlugin.show(
  id: orderId.hashCode,
  title: 'New ride request',
  body: body,
    notificationDetails: NotificationDetails(
      android: AndroidNotificationDetails(
        incomingRideChannel.id,
        incomingRideChannel.name,
        channelDescription: incomingRideChannel.description,
        importance: Importance.max,
        priority: Priority.max,
        playSound: true,
        sound: const RawResourceAndroidNotificationSound('notification'),
        audioAttributesUsage: AudioAttributesUsage.alarm,
        additionalFlags: Int32List.fromList(<int>[4]),
        timeoutAfter: 30000,
        fullScreenIntent: true,
        category: AndroidNotificationCategory.call,
        visibility: NotificationVisibility.public,
        ongoing: true,
        autoCancel: true,
        actions: const [
          AndroidNotificationAction(
            acceptActionId,
            'Accept order',
            showsUserInterface: true,
            cancelNotification: true,
          ),
        ],
      ),
    ),
    payload: orderId,
  );
  try {
    await showRideOfferOverlay(message.data);
  } catch (e, st) {
    print("R39_OVERLAY_ERROR $e\n$st");
  }
}

/// Call once from main(), after Firebase.initializeApp() and after
/// configureDependencies(), and before runApp().
Future<void> setupIncomingRideNotifications({
  required void Function(String orderId) onAcceptOrder,
}) async {
  await Permission.notification.request();

  const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
  await flutterLocalNotificationsPlugin.initialize(
    settings: const InitializationSettings(android: androidInit),
    onDidReceiveNotificationResponse: (response) {
      if (response.actionId == acceptActionId && response.payload != null) {
        onAcceptOrder(response.payload!);
      }
    },
  );
  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin
      >()
      ?.createNotificationChannel(incomingRideChannel);

  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  // App was fully closed and cold-launched by tapping "Accept" on the
  // notification — getNotificationAppLaunchDetails() is the only way to
  // recover that tap, since onDidReceiveNotificationResponse won't fire
  // for a launch that started the isolate itself.
  final launchDetails = await flutterLocalNotificationsPlugin
      .getNotificationAppLaunchDetails();
  final launchResponse = launchDetails?.notificationResponse;
  if (launchDetails?.didNotificationLaunchApp == true &&
      launchResponse?.actionId == acceptActionId &&
      launchResponse?.payload != null) {
    onAcceptOrder(launchResponse!.payload!);
  }
}
