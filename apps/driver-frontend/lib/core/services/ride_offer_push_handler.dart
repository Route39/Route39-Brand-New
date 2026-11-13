import 'dart:convert';
import 'dart:ui';

import 'package:flutter/widgets.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Shows the top-half "new ride request" overlay while the driver app is
/// backgrounded or fully closed.
///
/// Call this from the app's single FCM background handler
/// (`firebaseMessagingBackgroundHandler` in incoming_ride_notifications.dart)
/// - it is NOT registered as its own `onBackgroundMessage` handler, since
/// Firebase only supports one per app. If the app is open in the
/// foreground, FCM delivers to `FirebaseMessaging.onMessage` instead,
/// where the existing websocket-driven "new ride request" screen and
/// sound already take over - so simply being called from the background
/// handler already satisfies "driver is online but outside the app".
Future<void> showRideOfferOverlay(Map<String, dynamic> data) async {
  final hasOverlayPermission = await FlutterOverlayWindow.isPermissionGranted();
  print("R39_OVERLAY_PERMISSION $hasOverlayPermission");
  if (!hasOverlayPermission) {
    // Driver never granted "display over other apps" - the full-screen /
    // heads-up local notification is still shown regardless, so this is
    // a soft failure, not a blocker.
    return;
  }

  // Size the overlay window itself to roughly the top half of the screen
  // (in physical pixels) rather than covering the full screen, so the
  // bottom half of whatever app the driver is using stays untouched and
  // tappable.
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  // No screen exists in the FCM background isolate - use a fixed height (dp).
  int topHalfHeight = 1700;
  try {
    final views = PlatformDispatcher.instance.views;
    final displays = PlatformDispatcher.instance.displays;
    final h = views.isNotEmpty
        ? views.first.physicalSize.height
        : (displays.isNotEmpty ? displays.first.size.height : 0.0);
    if (h > 0) topHalfHeight = (h * 0.7).toInt();
  } catch (_) {}
  print("R39_OVERLAY_HEIGHT $topHalfHeight");

  // The bubble may still be showing - the plugin destroys itself if showOverlay
  // is called while a window is active, so close it first (same as RideOverlayService).
  if (await FlutterOverlayWindow.isActive()) {
    await FlutterOverlayWindow.shareData(jsonEncode({"type": "none"}));
    await Future.delayed(const Duration(milliseconds: 50));
    await FlutterOverlayWindow.closeOverlay();
    for (var i = 0; i < 15 && await FlutterOverlayWindow.isActive(); i++) {
      await Future.delayed(const Duration(milliseconds: 200));
    }
    await Future.delayed(const Duration(milliseconds: 500));
    print("R39_BUBBLE_CLOSED");
  }
  print("R39_OVERLAY_SHOWING");
  await FlutterOverlayWindow.showOverlay(
    height: topHalfHeight,
    width: WindowSize.matchParent,
    alignment: OverlayAlignment.topCenter,
    positionGravity: PositionGravity.none,
    visibility: NotificationVisibility.visibilityPublic,
    enableDrag: false,
    overlayTitle: 'New ride request',
  );
  await Future.delayed(const Duration(milliseconds: 800));
  if (!await FlutterOverlayWindow.isActive()) {
    print("R39_OVERLAY_RETRY");
    await FlutterOverlayWindow.showOverlay(
      height: topHalfHeight,
      width: WindowSize.matchParent,
      alignment: OverlayAlignment.topCenter,
      positionGravity: PositionGravity.none,
      visibility: NotificationVisibility.visibilityPublic,
      enableDrag: false,
      overlayTitle: 'New ride request',
    );
  }
  print("R39_OVERLAY_ACTIVE ${await FlutterOverlayWindow.isActive()}");

  // Send the ride details across to the overlay's isolate once it's up.
  print("R39_PUSH_KEYS ${data.keys.toList()}");
  String fmt(dynamic v, double div, int digits, String unit) {
    final n = double.tryParse('${v ?? ''}');
    return n == null ? '' : '${(n / div).toStringAsFixed(digits)} $unit';
  }
  final fareNum = double.tryParse('${data['fareEstimate'] ?? data['fare'] ?? ''}');
  final payload = <String, dynamic>{
    'type': 'new_order',
    'orderId': '${data['orderId'] ?? ''}',
    'serviceName': '${data['serviceName'] ?? 'New ride'}',
    'fare': fareNum == null ? '' : '₹${fareNum.round()}',
    'distance': fmt(data['distance'] ?? data['estimatedDistance'], 1000, 1, 'km'),
    'duration': fmt(data['duration'] ?? data['estimatedDuration'], 60, 0, 'min'),
    'pickupAddress': '${data['pickupAddress'] ?? ''}',
    'dropoffAddress': '${data['dropoffAddress'] ?? data['dropAddress'] ?? ''}',
    'token': '',
    'gqlUrl': '',
  };
  try {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('r39_pending_offer', jsonEncode({...payload, 'ts': DateTime.now().millisecondsSinceEpoch}));
    print("R39_PENDING_SAVED");
  } catch (e) { print("R39_PENDING_SAVE_ERR $e"); }
  // The overlay engine needs a moment to start listening - retry a few times.
  for (var i = 0; i < 4; i++) {
    await Future.delayed(const Duration(milliseconds: 700));
    await FlutterOverlayWindow.shareData(jsonEncode(payload));
    print("R39_OVERLAY_DATA_SENT $i");
  }
}