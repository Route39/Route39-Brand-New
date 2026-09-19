import 'dart:convert';
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
      await FlutterOverlayWindow.closeOverlay();
      await Future.delayed(const Duration(milliseconds: 200));
    }
  }

  static Future<void> showBubble() async {
    final hasPermission = await FlutterOverlayWindow.isPermissionGranted();
    if (!hasPermission) return;

    final isActive = await FlutterOverlayWindow.isActive();
    if (isActive) {
      await FlutterOverlayWindow.shareData(jsonEncode({"type": "bubble"}));
      return;
    }

    await FlutterOverlayWindow.showOverlay(
      height: 64,
      width: 64,
      alignment: OverlayAlignment.centerRight,
      flag: OverlayFlag.defaultFlag,
      visibility: NotificationVisibility.visibilityPublic,
      overlayTitle: "Route39 Pilot",
      enableDrag: true,
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
  }) async {
    final hasPermission = await FlutterOverlayWindow.isPermissionGranted();
    if (!hasPermission) return;

    await _close();
    await FlutterOverlayWindow.showOverlay(
      height: WindowSize.matchParent,
      width: WindowSize.matchParent,
      alignment: OverlayAlignment.center,
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
    }));
  }

  static Future<void> closeOverlay() async {
    await _close();
  }
}
