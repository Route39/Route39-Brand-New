import 'dart:async';

import 'package:ridy_driver/core/graphql/documents/profile.graphql.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:injectable/injectable.dart';

import '../datasources/graphql_datasource.dart';
import 'firebase_repository.dart';

@prod
@LazySingleton(as: FirebaseRepository)
class FirebaseRepositoryImpl implements FirebaseRepository {
  final GraphqlDatasource _graphqlDatasource;

  FirebaseRepositoryImpl(this._graphqlDatasource);

  StreamSubscription? _fcmTokenSubscription;

  @override
  Future<void> retrieveAndUpdateFcmToken() async {
    if (_fcmTokenSubscription != null) {
      return; // Already subscribed
    }
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
      if (settings.authorizationStatus != AuthorizationStatus.denied) {
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
        final token = await messaging.getToken(
          vapidKey: "",
        );
        if (token != null) {
          await _graphqlDatasource.mutate(
            Options$Mutation$UpdateFcmToken(
              variables: Variables$Mutation$UpdateFcmToken(token: token),
            ),
          );
        }
      }
    } catch (e) {
      // Handle error
    }
  }
}
