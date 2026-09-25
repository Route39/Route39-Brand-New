import 'dart:convert';
import 'dart:ui' as ui;
import 'package:flutter/widgets.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';

class RideOverlayService {
  static Future<void> requestPermission() async {
    final hasPermission = await FlutterOverlayWindow.isPermissionGranted();
    if (!hasPermission) {
      await FlutterOverlayWindow.requestPermission();
    }
  }

  static Future<void> _close() async {
    final isActive = await FlutterOverlayWindow.isActive();
    if (isActive) {
      FlutterOverlayWindow.shareData(jsonEncode({"type": "none"}));
      await Future.delayed(const Duration(milliseconds: 50));
      await FlutterOverlayWindow.closeOverlay();
      await Future.delayed(const Duration(milliseconds: 200));
    }
  }

  static Future<void> showBubble() async {
    if (WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed) return;
    final hasPermission = await FlutterOverlayWindow.isPermissionGranted();
    if (!hasPermission) return;

    await _close();

    await FlutterOverlayWindow.showOverlay(
      height: 200,
      width: 200,
      alignment: OverlayAlignment.centerRight,
      flag: OverlayFlag.defaultFlag,
      visibility: NotificationVisibility.visibilityPublic,
      overlayTitle: "Route39 Pilot",
      enableDrag: false,
      positionGravity: PositionGravity.auto,
    );
    await Future.delayed(const Duration(milliseconds: 300));
    await FlutterOverlayWindow.shareData(jsonEncode({"type": "bubble"}));
  }

  static Future<void> showOrderScreen({
    required String serviceName,
    required String fare,
    required String distance,
    required String duration,
    String? pickupAddress,
    String? dropoffAddress,
  }) async {
    if (WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed) return;
    final hasPermission = await FlutterOverlayWindow.isPermissionGranted();
    if (!hasPermission) return;

    await _close();
    // Half-screen bottom card (Rapido-style).
    final screenPx =
        ui.PlatformDispatcher.instance.views.first.physicalSize.height;
    await FlutterOverlayWindow.showOverlay(
      height: (screenPx * 0.7).toInt(),
      width: WindowSize.matchParent,
      alignment: OverlayAlignment.topCenter,
      flag: OverlayFlag.defaultFlag,
      visibility: NotificationVisibility.visibilityPublic,
      overlayTitle: "Route39 Pilot",
      enableDrag: false,
      positionGravity: PositionGravity.none,
    );
    await Future.delayed(const Duration(milliseconds: 300));
    await FlutterOverlayWindow.shareData(jsonEncode({
      "type": "new_order",
      "serviceName": serviceName,
      "fare": fare,
      "distance": distance,
      "duration": duration,
      "pickupAddress": pickupAddress,
      "dropoffAddress": dropoffAddress,
    }));
  }

  static Future<void> closeOverlay() async {
    await _close();
  }
}
