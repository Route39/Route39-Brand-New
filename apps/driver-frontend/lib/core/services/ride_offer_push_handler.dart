import 'dart:convert';
import 'dart:ui';

import 'package:flutter/widgets.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';

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
  final physicalSize = PlatformDispatcher.instance.views.first.physicalSize;
  final topHalfHeight = (physicalSize.height * 0.55).round();

  await FlutterOverlayWindow.showOverlay(
    height: topHalfHeight,
    width: WindowSize.matchParent,
    alignment: OverlayAlignment.topCenter,
    positionGravity: PositionGravity.none,
    visibility: NotificationVisibility.visibilityPublic,
    enableDrag: false,
    overlayTitle: 'New ride request',
  );

  // Send the ride details across to the overlay's isolate once it's up.
  await FlutterOverlayWindow.shareData(jsonEncode(data));
}