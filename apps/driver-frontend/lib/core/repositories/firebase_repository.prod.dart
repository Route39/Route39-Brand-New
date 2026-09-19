import 'dart:async';
import 'package:flutter/foundation.dart';

import 'package:ridy_driver/core/graphql/documents/profile.graphql.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';
import 'package:injectable/injectable.dart';

import '../datasources/graphql_datasource.dart';
import 'firebase_repository.dart';

@prod
@LazySingleton(as: FirebaseRepository)
class FirebaseRepositoryImpl implements FirebaseRepository {
  final GraphqlDatasource _graphqlDatasource;

  FirebaseRepositoryImpl(this._graphqlDatasource);

  StreamSubscription? _fcmTokenSubscription;

  // Only prompt for "display over other apps" once per app run - the OS
  // settings screen is disruptive to open on every resume if the driver
  // has already dismissed it once.
  bool _overlayPermissionRequested = false;

  Future<void> _ensureOverlayPermission() async {
    if (_overlayPermissionRequested) return;
    _overlayPermissionRequested = true;
    try {
      final granted = await FlutterOverlayWindow.isPermissionGranted();
      if (!granted) {
        // Opens the system "display over other apps" settings screen for
        // this app. Without this, incoming ride requests can only appear
        // while the app itself is open in the foreground.
        await FlutterOverlayWindow.requestPermission();
      }
    } catch (_) {
      // Non-fatal: the driver still gets the regular push notification.
    }
  }

  @override
  Future<void> retrieveAndUpdateFcmToken() async {
    unawaited(_ensureOverlayPermission());
    
    FirebaseMessaging messaging = FirebaseMessaging.instance;
    if (!await messaging.isSupported()) {
      return;
    }
    try {
      NotificationSettings settings = await messaging.requestPermission(
        alert: true,
        announcement: true,
        badge: true,
        carPlay: true,
        criticalAlert: false,
        provisional: true,
        sound: true,
      );
      debugPrint('FCM permission status: ${settings.authorizationStatus}');
      if (settings.authorizationStatus != AuthorizationStatus.denied) {
        final token = await messaging.getToken(
          vapidKey: "",
        );
        debugPrint('FCM token fetched: $token');
        if (token != null) {
          await _graphqlDatasource.mutate(
            Options$Mutation$UpdateFcmToken(
              variables: Variables$Mutation$UpdateFcmToken(token: token),
            ),
          );
        }

        // Only subscribe AFTER the first fetch succeeds
        if (_fcmTokenSubscription == null) {
        _fcmTokenSubscription = messaging.onTokenRefresh.listen(
          (String? token) async {
            if (token != null) {
              await _graphqlDatasource.mutate(
                Options$Mutation$UpdateFcmToken(
                  variables: Variables$Mutation$UpdateFcmToken(token: token),
                ),
              );
            }
          },
        );
        
        }
      }
    } catch (e, stack) {
      debugPrint('FCM token retrieval failed: $e');
      debugPrint('$stack');
    }
  }
}
