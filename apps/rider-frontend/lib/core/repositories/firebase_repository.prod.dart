import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/config/env.dart';
import 'package:ridy/core/datasources/graphql_datasource.dart';
import 'package:ridy/core/graphql/documents/home.graphql.dart';
import 'package:ridy/core/repositories/firebase_repository.dart';

@prod
@LazySingleton(as: FirebaseRepository)
class FirebaseRepositoryImpl implements FirebaseRepository {
  final GraphqlDatasource _graphqlDatasource;

  FirebaseRepositoryImpl(this._graphqlDatasource);

  StreamSubscription<String>? _tokenRefreshSubscription;

  @override
  Future<void> retrieveAndUpdateFcmToken() async {
    if (_tokenRefreshSubscription != null) {
      return; // Prevent multiple subscriptions
    }
    FirebaseMessaging messaging = FirebaseMessaging.instance;
    NotificationSettings settings = await messaging.requestPermission(
      alert: true,
      announcement: true,
      badge: true,
      carPlay: true,
      criticalAlert: false,
      provisional: true,
      sound: true,
    );
    if (settings.authorizationStatus != AuthorizationStatus.denied) {
      try {
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
}
