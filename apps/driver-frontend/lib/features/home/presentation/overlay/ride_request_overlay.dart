import 'dart:async';
import 'dart:convert';

import 'package:android_intent_plus/android_intent.dart';
import 'package:flutter/material.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';
import 'package:ionicons/ionicons.dart';
import 'package:package_info_plus/package_info_plus.dart';

/// Entry point for the overlay's own, separate Flutter engine.
///
/// `flutter_overlay_window` renders overlay content in an isolated engine,
/// so this cannot see the main app's DI container, blocs, theme, etc. - it
/// only knows what's sent to it via [FlutterOverlayWindow.shareData].
///
/// Must stay top-level and keep this exact `@pragma`, or the overlay
/// process (started natively by Android) won't find it.
@pragma('vm:entry-point')
void overlayMain() {
  runApp(const MaterialApp(
    debugShowCheckedModeBanner: false,
    home: RideRequestOverlayCard(),
  ));
}

/// The heads-up card the driver sees, anchored to the top of the screen,
/// while online but outside the app (home screen or another app open).
/// Tapping it brings the driver app to the foreground; the close button
/// just dismisses the overlay.
class RideRequestOverlayCard extends StatefulWidget {
  const RideRequestOverlayCard({super.key});

  @override
  State<RideRequestOverlayCard> createState() => _RideRequestOverlayCardState();
}

class _RideRequestOverlayCardState extends State<RideRequestOverlayCard> {
  static const _fallbackSecondsToRespond = 15;
  static const _brandRed = Color(0xFFB30000);

  StreamSubscription? _dataSubscription;
  Timer? _countdownTimer;

  Map<String, dynamic>? _rideData;
  int _secondsLeft = _fallbackSecondsToRespond;

  @override
  void initState() {
    super.initState();
    _dataSubscription = FlutterOverlayWindow.overlayListener.listen(_onData);
  }

  @override
  void dispose() {
    _dataSubscription?.cancel();
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _onData(dynamic event) {
    if (event is! String) return;
    try {
      final decoded = jsonDecode(event) as Map<String, dynamic>;
      setState(() => _rideData = decoded);
      _startCountdown(decoded['expiresAt'] as String?);
    } catch (_) {
      // Not JSON meant for us - ignore.
    }
  }

  void _startCountdown(String? expiresAtIso) {
    _countdownTimer?.cancel();

    var secondsLeft = _fallbackSecondsToRespond;
    final expiresAt = expiresAtIso != null ? DateTime.tryParse(expiresAtIso) : null;
    if (expiresAt != null) {
      final diff = expiresAt.difference(DateTime.now()).inSeconds;
      if (diff > 0) secondsLeft = diff;
    }
    setState(() => _secondsLeft = secondsLeft);

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsLeft <= 1) {
        timer.cancel();
        FlutterOverlayWindow.closeOverlay();
        return;
      }
      setState(() => _secondsLeft--);
    });
  }

  Future<void> _openApp() async {
    _countdownTimer?.cancel();
    try {
      final packageName = (await PackageInfo.fromPlatform()).packageName;
      final intent = AndroidIntent(
        action: 'action_main',
        category: 'android.intent.category.LAUNCHER',
        package: packageName,
        flags: [
  0x10000000, // FLAG_ACTIVITY_NEW_TASK
  0x00020000, // FLAG_ACTIVITY_REORDER_TO_FRONT
],
      );
      await intent.launch();
    } finally {
      await FlutterOverlayWindow.closeOverlay();
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = _rideData ?? const {};
    final fare = data['fareEstimate'] as String?;
    final currency = data['currency'] as String? ?? '';
    final serviceName = data['serviceName'] as String? ?? '';
    final pickupAddress = data['pickupAddress'] as String?;

    return Material(
      color: Colors.transparent,
      child: SafeArea(
        child: GestureDetector(
          onTap: _openApp,
          child: Container(
            margin: const EdgeInsets.fromLTRB(14, 12, 14, 0),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              boxShadow: const [
                BoxShadow(color: Color(0x33000000), blurRadius: 22, offset: Offset(0, 8)),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(18, 14, 10, 14),
                  color: _brandRed,
                  child: Row(
                    children: [
                      const Icon(Ionicons.notifications, color: Colors.white, size: 22),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'NEW RIDE REQUEST',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.4,
                          ),
                        ),
                      ),
                      Container(
                        width: 32,
                        height: 32,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '$_secondsLeft',
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800),
                        ),
                      ),
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        icon: const Icon(Ionicons.close, color: Colors.white, size: 20),
                        onPressed: () {
                          _countdownTimer?.cancel();
                          FlutterOverlayWindow.closeOverlay();
                        },
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        fare != null && fare.isNotEmpty ? '$currency $fare' : 'A customer is waiting for you',
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                      ),
                      if (serviceName.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          serviceName,
                          style: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.w600),
                        ),
                      ],
                      if (pickupAddress != null && pickupAddress.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Ionicons.locationOutline, size: 18, color: _brandRed),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                pickupAddress,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 14),
                      const Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          'Tap to open  →',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _brandRed),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}