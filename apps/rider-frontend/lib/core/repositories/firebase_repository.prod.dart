import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/config/env.dart';
import 'package:ridy/core/datasources/graphql_datasource.dart';
import 'package:ridy/core/graphql/documents/home.graphql.dart';
import 'package:ridy/core/repositories/firebase_repository.dart';
import 'package:ridy/core/blocs/notification_history.cubit.dart';
import 'package:ridy/config/locator/locator.dart';

@prod
@LazySingleton(as: FirebaseRepository)
class FirebaseRepositoryImpl implements FirebaseRepository {
  final GraphqlDatasource _graphqlDatasource;

  FirebaseRepositoryImpl(this._graphqlDatasource);

  StreamSubscription<String>? _tokenRefreshSubscription;
  StreamSubscription<RemoteMessage>? _messageSubscription;

  @override
  Future<void> initializeNotificationListener() async {
    if (_messageSubscription != null) return;

    final messaging = FirebaseMessaging.instance;

    _messageSubscription = FirebaseMessaging.onMessage.listen((message) {
      _saveNotification(message);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _saveNotification(message);
    });

    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) {
      _saveNotification(initialMessage);
    }
  }

  void _saveNotification(RemoteMessage message) {
    final type = message.data['type']?.toString();
    final notification = message.notification;

    String title = notification?.title ?? '';
    String body = notification?.body ?? '';

    final fallback = _notificationText(type);
    if (title.isEmpty) title = fallback.$1;
    if (body.isEmpty) body = fallback.$2;

    if (title.isEmpty && body.isEmpty) return;

    locator<NotificationHistoryCubit>().add(title, body);
  }

  (String, String) _notificationText(String? type) {
    switch (type) {
      case 'accepted':
        return ('Driver Accepted', 'A driver has accepted your request');
      case 'bookingAssigned':
        return ('Driver Assigned', 'A driver has been assigned to your trip');
      case 'arrived':
        return ('Driver Arrived', 'Driver has arrived to your location');
      case 'started':
        return ('Trip Started', 'Trip has been started');
      case 'waitingForPostPay':
        return ('Trip Finished', 'Waiting for post-pay');
      case 'finished':
        return ('Trip Finished', 'Trip has been finished.');
      case 'canceled':
        return ('Trip Canceled', 'Your trip has been canceled');
      case 'message':
        return ('New Message', 'You have received a new message');
      default:
        return ('', '');
    }
  }

  @override
  Future<void> retrieveAndUpdateFcmToken() async {
    if (_tokenRefreshSubscription != null) {
      return; // Prevent multiple subscriptions
    }
    try {
      FirebaseMessaging messaging = FirebaseMessaging.instance;
      NotificationSettings settings = await messaging
          .requestPermission(
            alert: true,
            announcement: true,
            badge: true,
            carPlay: true,
            criticalAlert: false,
            provisional: true,
            sound: true,
          )
          .timeout(
            const Duration(seconds: 5),
            onTimeout: () {
              throw Exception('Push notification permission request timed out');
            },
          );
      if (settings.authorizationStatus == AuthorizationStatus.denied) return;
      final token = await messaging.getToken(
        vapidKey: Env.firebaseMessagingVapidKey,
      );
      _tokenRefreshSubscription = messaging.onTokenRefresh.listen((newToken) {
        _graphqlDatasource.mutate(
          Options$Mutation$UpdateFcmToken(
            variables: Variables$Mutation$UpdateFcmToken(token: newToken),
          ),
        );
      });
      if (token != null) {
        await _graphqlDatasource.mutate(
          Options$Mutation$UpdateFcmToken(
            variables: Variables$Mutation$UpdateFcmToken(token: token),
          ),
        );
      }
    } catch (e) {
      if (kDebugMode) {
        print(e);
      }
    }
  }
}
