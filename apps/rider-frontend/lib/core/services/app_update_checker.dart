import 'package:flutter/foundation.dart';
import 'package:in_app_update/in_app_update.dart';

/// Checks Google Play for a newer version.
/// force=true  -> full-screen update, user must update (driver app)
/// force=false -> optional background update (rider app)
/// Only works on Play-installed release builds; skipped in debug/web/iOS.
Future<void> checkForAppUpdate({required bool force}) async {
  if (kIsWeb || kDebugMode || defaultTargetPlatform != TargetPlatform.android) return;
  try {
    final info = await InAppUpdate.checkForUpdate();
    if (info.updateAvailability != UpdateAvailability.updateAvailable) return;
    if (force && info.immediateUpdateAllowed) {
      await InAppUpdate.performImmediateUpdate();
    } else if (info.flexibleUpdateAllowed) {
      final result = await InAppUpdate.startFlexibleUpdate();
      if (result == AppUpdateResult.success) {
        await InAppUpdate.completeFlexibleUpdate();
      }
    }
  } catch (e) {
    debugPrint('[UPDATE] check failed: $e');
  }
}
