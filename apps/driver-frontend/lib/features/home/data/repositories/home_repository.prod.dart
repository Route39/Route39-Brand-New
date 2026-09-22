import 'dart:async';

import 'package:collection/collection.dart';
import 'package:ridy_driver/core/datasources/graphql_datasource.dart';
import 'package:ridy_driver/core/graphql/documents/home.graphql.dart';
import 'package:ridy_driver/core/graphql/documents/profile.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/chat_message.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/current_order.fragment.graphql.dart';
import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/documents/chat.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/ephemeral_message.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/ride_offer.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/service.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.fragment.graphql.dart';
import 'package:graphql/client.dart';
import 'package:injectable/injectable.dart';
import 'package:rxdart/rxdart.dart';
import 'package:ridy_driver/core/graphql/fragments/cancel_reason.fragment.graphql.dart';

import 'package:ridy_driver/features/notifications/data/notification_history_repository.dart';

import '../../domain/repositories/home_repository.dart';

@prod
@LazySingleton(as: HomeRepository)
class HomeRepositoryImpl implements HomeRepository {
  final NotificationHistoryRepository _notificationHistoryRepository =
      NotificationHistoryRepository();
  // Streams
  @override
  Stream<List<Fragment$RideOffer>> get orderRequests => _orderRequests.stream;
  final BehaviorSubject<List<Fragment$RideOffer>> _orderRequests = BehaviorSubject.seeded([]);

  @override
  Stream<ApiResponse<Fragment$Profile>> get profile => _profile.stream;
  final BehaviorSubject<ApiResponse<Fragment$Profile>> _profile = BehaviorSubject.seeded(ApiResponse.initial());

  @override
  Stream<List<Fragment$ActiveOrder>> get activeOrders => _activeOrders.stream;
  final BehaviorSubject<List<Fragment$ActiveOrder>> _activeOrders = BehaviorSubject.seeded([]);

  @override
  List<Fragment$ActiveOrder> get activeOrdersValue => _activeOrders.value;

  @override
  Stream<List<Fragment$EphemeralMessage>> get ephemeralMessages => _ephemeralMessages.stream;
  final BehaviorSubject<List<Fragment$EphemeralMessage>> _ephemeralMessages = BehaviorSubject.seeded([]);

  // Subscriptions
  StreamSubscription? eventStreamSubscription;

  final GraphqlDatasource graphQLDatasource;

  HomeRepositoryImpl(this.graphQLDatasource);

  @override
  getProfile() async {
    _profile.add(ApiResponse.loading());
    final profile = await graphQLDatasource.query(Options$Query$Profile(fetchPolicy: FetchPolicy.noCache));
    if (profile.data?.me.status == Enum$DriverStatus.Online) {
      refreshRideOffers();
    }
    _profile.add(profile.mapData((r) => r.me));
  }

  @override
  updateRadius({required int? radius}) async {
    final profile = await graphQLDatasource.mutate(
      Options$Mutation$UpdateDriverOfferFilter(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$UpdateDriverOfferFilter(
          input: Input$UpdateDriverOfferFilterInput(searchDistance: radius),
        ),
      ),
    );
    _profile.add(profile.mapData((r) => r.updateDriverOfferFilter));
  }

  @override
  Future<ApiResponse<void>> deleteAccount() async {
    await graphQLDatasource.mutate(Options$Mutation$DeleteAccount());
    _profile.add(ApiResponse.error('Account has been deleted'));
    return ApiResponse.loaded(null);
  }

  @override
  Future<ApiResponse<void>> updateStatus({required Enum$DriverStatus status, Input$PointInput? location}) async {
    if (status == Enum$DriverStatus.Online) {
      if (location == null) {
        return ApiResponse.error('Location must be provided when going online');
      }
      final response = await graphQLDatasource.mutate(
        Options$Mutation$goOnline(
          fetchPolicy: FetchPolicy.noCache,
          variables: Variables$Mutation$goOnline(location: location),
        ),
      );
      if (response.isLoaded) {
        _profile.add(ApiResponse.loaded(_profile.value.data!.copyWith(status: status)));
      }
      return response.fold((error, {failure}) => ApiResponse.error(error, failure: failure), (data) => ApiResponse.loaded(null));
    } else if (status == Enum$DriverStatus.Offline) {
      final response = await graphQLDatasource.mutate(Options$Mutation$goOffline(fetchPolicy: FetchPolicy.noCache));
      if (response.isLoaded) {
        _profile.add(ApiResponse.loaded(_profile.value.data!.copyWith(status: status)));
      }
      return response.fold((error, {failure}) => ApiResponse.error(error, failure: failure), (data) => ApiResponse.loaded(null));
    }
    return ApiResponse.loaded(null);
  }
//   @override
// void startListeningToOrderUpdates() {
//   print('[DRIVER-SOCKET] Starting DriverEvents subscription');

//   // Cancel any previous subscription before creating a new one.
//   eventStreamSubscription?.cancel();
//   eventStreamSubscription = null;

//   final orderUpdateStream = graphQLDatasource.subscribe(
//     Options$Subscription$DriverEvents(
//       fetchPolicy: FetchPolicy.noCache,
//     ),
//   );

//   eventStreamSubscription = orderUpdateStream.listen(
//     (event) {
//       print(
//         '[DRIVER-SOCKET] EVENT RECEIVED: '
//         'type=${event.driverEvents.type}, '
//         'orderId=${event.driverEvents.orderId}',
//       );

//       switch (event.driverEvents.type) {
//         case Enum$DriverEventType.RideOfferReceived:
//           print(
//             '[DRIVER-SOCKET] RIDE OFFER RECEIVED: '
//             'orderId=${event.driverEvents.orderId}',
//           );

//           final rideOffer = event.driverEvents.rideOffer;

//           if (rideOffer == null) {
//             print(
//               '[DRIVER-SOCKET] ERROR: RideOfferReceived event '
//               'has null rideOffer. orderId=${event.driverEvents.orderId}',
//             );
//             break;
//           }

//           final currentRequests = _orderRequests.value;

//           if (!currentRequests.any((e) => e.id == rideOffer.id)) {
//             _orderRequests.add(
//               [
//                 ...currentRequests,
//                 rideOffer,
//               ],
//             );

//             print(
//               '[DRIVER-SOCKET] Added ride offer to orderRequests: '
//               '${rideOffer.id}',
//             );
//           } else {
//             print(
//               '[DRIVER-SOCKET] Ride offer already exists: '
//               '${rideOffer.id}',
//             );
//           }

//           break;

//         case Enum$DriverEventType.RideOfferRevoked:
//           print(
//             '[DRIVER-SOCKET] RIDE OFFER REVOKED: '
//             '${event.driverEvents.orderId}',
//           );

//           _orderRequests.add(
//             _orderRequests.value
//                 .where((e) => e.id != event.driverEvents.orderId)
//                 .toList(),
//           );

//           break;

//         case Enum$DriverEventType.ActiveOrderCompleted:
//           print(
//             '[DRIVER-SOCKET] ACTIVE ORDER COMPLETED: '
//             '${event.driverEvents.orderId}',
//           );

//           _activeOrders.add(
//             _activeOrders.value
//                 .where((e) => e.id != event.driverEvents.orderId)
//                 .toList(),
//           );

//           if (_activeOrders.value.isEmpty) {
//             _profile.add(
//               ApiResponse.loaded(
//                 _profile.value.data!.copyWith(
//                   status: Enum$DriverStatus.Online,
//                 ),
//               ),
//             );
//           }

//           getEphemeralMessages();

//           break;

//         case Enum$DriverEventType.MessageReceived:
//           print(
//             '[DRIVER-SOCKET] MESSAGE RECEIVED: '
//             '${event.driverEvents.orderId}',
//           );

//           final message = event.driverEvents.message;

//           if (message == null) {
//             print(
//               '[DRIVER-SOCKET] ERROR: MessageReceived event '
//               'has null message.',
//             );
//             break;
//           }

//           final order = _activeOrders.value.firstWhereOrNull(
//             (element) => element.id == event.driverEvents.orderId,
//           );

//           if (order == null) {
//             print(
//               '[DRIVER-SOCKET] Message received for order not found '
//               'in activeOrders: ${event.driverEvents.orderId}',
//             );
//             break;
//           }

//           final updatedOrders = _activeOrders.value.map((e) {
//             if (e.id == order.id) {
//               return e.copyWith(
//                 chatMessages: [
//                   ...e.chatMessages,
//                   message,
//                 ],
//                 unreadMessagesCount:
//                     event.driverEvents.unreadMessagesCount,
//               );
//             }

//             return e;
//           }).toList();

//           _activeOrders.add(updatedOrders);

//           break;

//         case Enum$DriverEventType.$unknown:
//           print(
//             '[DRIVER-SOCKET] Unknown driver event type received.',
//           );
//           break;

//         case Enum$DriverEventType.ActiveOrderUpdated:
//           print(
//             '[DRIVER-SOCKET] ACTIVE ORDER UPDATED: '
//             '${event.driverEvents.orderId} '
//             'status=${event.driverEvents.status}',
//           );

//           final currentOrders = _activeOrders.value;

//           final updatedOrders = currentOrders
//               .map((e) {
//                 if (e.id == event.driverEvents.orderId) {
//                   if (event.driverEvents.status ==
//                       Enum$OrderStatus.Finished) {
//                     return null;
//                   }

//                   return e.copyWith(
//                     status:
//                         event.driverEvents.status ?? e.status,
//                     waitMinutes:
//                         event.driverEvents.waitTime ?? e.waitMinutes,
//                     totalCost:
//                         event.driverEvents.totalCost ?? e.totalCost,
//                   );
//                 }

//                 return e;
//               })
//               .nonNulls
//               .toList();

//           if (updatedOrders.isEmpty) {
//             _profile.add(
//               ApiResponse.loaded(
//                 _profile.value.data!.copyWith(
//                   status: Enum$DriverStatus.Online,
//                 ),
//               ),
//             );
//           }

//           _activeOrders.add(updatedOrders);

//           break;

//         case Enum$DriverEventType.ActiveOrderAssigned:
//           print(
//             '[DRIVER-SOCKET] ACTIVE ORDER ASSIGNED: '
//             '${event.driverEvents.orderId}',
//           );

//           // acceptOrderRequest() already updates _activeOrders
//           // immediately. Do not refresh here because a stale
//           // server response can overwrite the newly accepted order.
//           break;
//       }
//     },
//     onError: (error, stackTrace) {
//       print(
//         '[DRIVER-SOCKET] SUBSCRIPTION ERROR: $error',
//       );
//       print(
//         '[DRIVER-SOCKET] STACK TRACE: $stackTrace',
//       );
//     },
//     onDone: () {
//       print(
//         '[DRIVER-SOCKET] DriverEvents subscription CLOSED',
//       );
//     },
//     cancelOnError: false,
//   );

//   print(
//     '[DRIVER-SOCKET] DriverEvents subscription started',
//   );
// }

// @override
// void stopListeningToOrderUpdates() {
//   print(
//     '[DRIVER-SOCKET] Stopping DriverEvents subscription',
//   );

//   eventStreamSubscription?.cancel();
//   eventStreamSubscription = null;
// }
  @override
startListeningToOrderUpdates() {
  print('[DRIVER-SOCKET] Starting DriverEvents subscription');

  final orderUpdateStream = graphQLDatasource.subscribe(
    Options$Subscription$DriverEvents(fetchPolicy: FetchPolicy.noCache),
  );

  eventStreamSubscription = orderUpdateStream.listen(
    (event) {
      print(
        '[DRIVER-SOCKET] EVENT RECEIVED: '
        'type=${event.driverEvents.type}, '
        'orderId=${event.driverEvents.orderId}',
      );

      switch (event.driverEvents.type) {
        case Enum$DriverEventType.RideOfferReceived:
          print(
            '[DRIVER-SOCKET] RIDE OFFER RECEIVED: '
            '${event.driverEvents.orderId}',
          );

          _orderRequests.add(
            _orderRequests.value
                .followedBy([event.driverEvents.rideOffer!])
                .fold<List<Fragment$RideOffer>>(
              [],
              (
                previousValue,
                element,
              ) {
                if (!previousValue.any((e) => e.id == element.id)) {
                  previousValue.add(element);
                }
                return previousValue;
              },
            ).toList(),
          );

          break;

        // keep your existing cases here...
  // @override
  // startListeningToOrderUpdates() {
  //   final orderUpdateStream = graphQLDatasource.subscribe(
  //     Options$Subscription$DriverEvents(fetchPolicy: FetchPolicy.noCache),
  //   );
  //   eventStreamSubscription = orderUpdateStream.listen((event) {
  //     switch (event.driverEvents.type) {
        case Enum$DriverEventType.RideOfferReceived:
          _orderRequests.add(
            _orderRequests.value.followedBy([event.driverEvents.rideOffer!]).fold<List<Fragment$RideOffer>>([], (
              previousValue,
              element,
            ) {
              if (!previousValue.any((e) => e.id == element.id)) {
                previousValue.add(element);
              }
              return previousValue;
            }).toList(),
          );
          break;
        case Enum$DriverEventType.RideOfferRevoked:
        final missedOffer = _orderRequests.value.firstWhereOrNull(
            (e) => e.id == event.driverEvents.orderId,
          );
          if (missedOffer != null) {
            _notificationHistoryRepository.saveNotifications([
              {
                'messageId': 'missed_${missedOffer.id}_${DateTime.now().millisecondsSinceEpoch}',
                'type': 'RideOfferMissed',
                'serviceName': missedOffer.serviceName,
                'fareEstimate': missedOffer.fareEstimate.toStringAsFixed(0),
                'currency': missedOffer.currency,
                'createdAt': DateTime.now().toIso8601String(),
              },
            ]);
          }
          _orderRequests.add(_orderRequests.value.where((e) => e.id != event.driverEvents.orderId).toList());
          break;
        case Enum$DriverEventType.ActiveOrderCompleted:
          _activeOrders.add(_activeOrders.value.where((e) => e.id != event.driverEvents.orderId).toList());
          if (_activeOrders.value.isEmpty) {
            _profile.add(ApiResponse.loaded(_profile.value.data!.copyWith(status: Enum$DriverStatus.Online)));
          }
          getEphemeralMessages();
          break;

        case Enum$DriverEventType.MessageReceived:
          final message = event.driverEvents.message;
          final order = _activeOrders.value.firstWhereOrNull((element) => element.id == event.driverEvents.orderId);
          if (order == null) return;
          final updatedOrders = _activeOrders.value.map((e) {
            if (e.id == order.id) {
              return e.copyWith(
                chatMessages: [...e.chatMessages, message!],
                unreadMessagesCount: event.driverEvents.unreadMessagesCount,
              );
            }
            return e;
          }).toList();
          _activeOrders.add(updatedOrders);
        case Enum$DriverEventType.$unknown:
          throw UnsupportedError('Unknown driver event type');
        case Enum$DriverEventType.ActiveOrderUpdated:
          final currentOrders = _activeOrders.value;
          final updatedOrders = currentOrders
              .map((e) {
                if (e.id == event.driverEvents.orderId) {
                  if (event.driverEvents.status == Enum$OrderStatus.Finished) {
                    return null;
                  }
                  return e.copyWith(
                    status: event.driverEvents.status ?? e.status,
                    waitMinutes: event.driverEvents.waitTime ?? e.waitMinutes,
                    totalCost: event.driverEvents.totalCost ?? e.totalCost,
                  );
                }
                return e;
              })
              .nonNulls
              .toList();
          if (_activeOrders.value.isEmpty) {
            _profile.add(ApiResponse.loaded(_profile.value.data!.copyWith(status: Enum$DriverStatus.Online)));
          }
          _activeOrders.add(updatedOrders);
          break;
        
case Enum$DriverEventType.ActiveOrderAssigned:
  // acceptOrderRequest() already updates _activeOrders immediately.
  // Do not refresh here because a stale server response can overwrite
  // the newly accepted order before the UI rebuilds.
  break;

      }
    });
  }

  @override
  stopListeningToOrderUpdates() {
    eventStreamSubscription?.cancel();
    eventStreamSubscription = null;
  }

@override
Future<ApiResponse<Fragment$ActiveOrder>> acceptOrderRequest({
  required String requestId,
}) async {
  final response = await graphQLDatasource.mutate(
    Options$Mutation$acceptRideOffer(
      fetchPolicy: FetchPolicy.noCache,
      variables: Variables$Mutation$acceptRideOffer(
        offerId: requestId,
      ),
    ),
  );

  final accepted = response.mapData((r) => r.acceptRideOffer);

  if (accepted.data != null) {
    final acceptedOrder = accepted.data!;

    // Immediately update the local active-order state.
    // This allows the UI to rebuild without waiting for
    // ActiveOrderAssigned websocket/refresh events.
    final updatedOrders = [
      ..._activeOrders.value.where(
        (order) => order.id != acceptedOrder.id,
      ),
      acceptedOrder,
    ];

    _activeOrders.add(updatedOrders);

    // Remove the accepted request from pending ride requests.
    _orderRequests.add(
      _orderRequests.value
          .where((request) => request.id != requestId)
          .toList(),
    );
  }

  return accepted;
}

  @override
  void onLoggedIn({required Fragment$Profile profile}) async {
    _profile.add(ApiResponse.loaded(profile));
  }

  @override
  Future<ApiResponse<void>> updateDriverLocation({required Fragment$Coordinate location}) async {
    final result = await graphQLDatasource.mutate(
      Options$Mutation$UpdateDriverLocation(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$UpdateDriverLocation(
          point: Input$PointInput(lat: location.lat, lng: location.lng, heading: location.heading),
        ),
      ),
    );
    return result;
  }

  @override
  Future<ApiResponse<Fragment$ActiveOrder?>> arrivedToDestination({required Fragment$ActiveOrder order}) async {
    final updateResponse = await graphQLDatasource.mutate(
      Options$Mutation$arrivedToDestination(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$arrivedToDestination(id: order.id),
      ),
    );
    return _updateOrderStatus(updateResponse.mapData((r) => r.arrivedToDestination));
  }

  @override
  Future<ApiResponse<Fragment$ActiveOrder?>> arrivedToPickup({required String orderId}) async {
    final updateResponse = await graphQLDatasource.mutate(
      Options$Mutation$arrivedToPickup(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$arrivedToPickup(id: orderId),
      ),
    );
    return _updateOrderStatus(updateResponse.mapData((r) => r.arrivedToPickup));
  }

  @override
  Future<ApiResponse<Fragment$ActiveOrder?>> cancelOrder({required String orderId, required String reasonId, String? reasonNote}) async {
    final updateResponse = await graphQLDatasource.mutate(
      Options$Mutation$CancelRide(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$CancelRide(rideId: orderId, reasonId: reasonId, reasonNote: reasonNote),
      ),
    );
    return _updateOrderStatus(updateResponse.mapData((r) => r.cancelRide));
  }

  @override
  Future<ApiResponse<Fragment$ActiveOrder?>> startTrip({
    required String orderId,
  }) async {
    final updateResponse = await graphQLDatasource.mutate(
      Options$Mutation$initiateRide(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$initiateRide(id: orderId),
      ),
    );

    final statusResponse =
        updateResponse.mapData((r) => r.initiateRide);

    // Update the local order immediately.
    final mergedResponse = await _updateOrderStatus(statusResponse);

    // Re-fetch the complete active order.
    // This gets the final total calculated by the backend,
    // including waiting charges, GST, platform fee and
    // payment gateway fee.
    await refreshActiveOrders();

    // Return the freshly fetched order instead of the older
    // initiateRide response.
    final refreshedOrder = _activeOrders.value.firstWhereOrNull(
      (order) => order.id == orderId,
    );

    if (refreshedOrder != null) {
      return ApiResponse.loaded(refreshedOrder);
    }

    // Fallback in case the refresh did not return the order.
    return mergedResponse;
  }

  @override
  Future<ApiResponse<void>> verifyPickupOtp({required String orderId, required String otp, int? waitSeconds}) async {
    final updateResponse = await graphQLDatasource.mutate(
      Options$Mutation$verifyPickupOtp(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$verifyPickupOtp(id: orderId, otp: otp, waitSeconds: waitSeconds),
      ),
    );
    return _updateOrderStatus(updateResponse.mapData((r) => r.verifyPickupOtp));
  }

  Future<ApiResponse<Fragment$ActiveOrder?>> _updateOrderStatus(ApiResponse<Fragment$UpdateStatus> response) async {
    final data = response.data;
    if (data == null) {
      return response.fold(
        (error, {failure}) => ApiResponse.error(error, failure: failure),
        (_) => ApiResponse.loaded(null),
      );
    }
    final currentActiveOrders = _activeOrders.value;
    Fragment$ActiveOrder? mergedOrder;
    final updatedOrders = currentActiveOrders
        .map((e) {
          if (e.id == data.orderId) {
            if (data.status == Enum$OrderStatus.Finished || data.status == Enum$OrderStatus.DriverCanceled) {
              return null; // Remove the order if it's finished
            }
            mergedOrder = e.copyWith(
              status: data.status,
              directions: data.directions ?? e.directions,
              nextDestination: data.nextDestination ?? e.nextDestination,
              totalCost: data.totalCost ?? e.totalCost,
              waitingChargeAmount: data.waitingChargeAmount ?? e.waitingChargeAmount,
            );
            return mergedOrder;
          }
          return e;
        })
        .nonNulls
        .toList();
    if (updatedOrders.isEmpty) {
      _profile.add(ApiResponse.loaded(_profile.value.data!.copyWith(status: Enum$DriverStatus.Online)));
    }
    _activeOrders.add(updatedOrders);
    // Return the merged order directly so the bloc can update the UI
    // immediately instead of waiting on the async activeOrders stream.
    return ApiResponse.loaded(mergedOrder);
  }

  @override
  Future<ApiResponse<List<Fragment$CancelReason>>> getCancelReasons() async {
    final reasons = await graphQLDatasource.query(Options$Query$CancelReasons());
    return reasons.mapData((r) => r.cancelReasons);
  }

  @override
  Future<ApiResponse<void>> submitReview({required String orderId, required int rating, required String? review}) async {
    final result = await graphQLDatasource.mutate(
      Options$Mutation$SubmitReview(
        variables: Variables$Mutation$SubmitReview(orderId: orderId, rating: rating, review: review),
      ),
    );
    return result.mapData((r) => r.submitReview);
  }

  @override
  Future<ApiResponse<Fragment$ActiveOrder?>> paidInCash({required String orderId, required double amount}) async {
    final updateResponse = await graphQLDatasource.mutate(
      Options$Mutation$riderPaidInCash(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$riderPaidInCash(orderId: orderId),
      ),
    );
    return _updateOrderStatus(updateResponse.mapData((r) => r.riderPaidInCash));
  }

  @override
  Future<ApiResponse<Fragment$ChatMessage>> sendMessage({required String orderId, required String message}) async {
    final result = await graphQLDatasource.mutate(
      Options$Mutation$SendMessage(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$SendMessage(orderId: orderId, message: message),
      ),
    );
    final messageParsed = result.mapData((r) => r.sendChatMessage);
    final currentOrders = _activeOrders.value;

    if (currentOrders.any((element) => element.id == orderId)) {
      final updatedOrders = currentOrders.map((e) {
        if (e.id == orderId) {
          return e.copyWith(chatMessages: [...e.chatMessages, messageParsed.data!]);
        }
        return e;
      }).toList();
      _activeOrders.add(updatedOrders);
    }
    return messageParsed;
  }

  @override
  Future<ApiResponse<void>> sendSosSignal({required String orderId}) async {
    final result = await graphQLDatasource.mutate(
      Options$Mutation$SendSOS(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$SendSOS(id: orderId),
      ),
    );
    return result;
  }

  @override
  Future<ApiResponse<void>> updateLastSeenMessagesAt({required String orderId}) {
    return graphQLDatasource.mutate(
      Options$Mutation$updateLastSeenMessagesAt(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$updateLastSeenMessagesAt(orderId: orderId),
      ),
    );
  }

  @override
  void refreshRideOffers() async {
    final rideOffers = await graphQLDatasource.query(Options$Query$RideOffers());
    _orderRequests.add(rideOffers.data?.rideOffers ?? []);
  }

  @override
  Future<ApiResponse<List<Fragment$Service>>> getActiveServices() async {
    final result = await graphQLDatasource.query(Options$Query$ActiveServices());
    return result.mapData((r) => r.activeServices);
  }

  @override
  Future<void> refreshActiveOrders() async {
    final activeOrders = await graphQLDatasource.query(
      Options$Query$ActiveOrders(
        fetchPolicy: FetchPolicy.noCache,
      ),
    );
    if (activeOrders.isLoaded) {
      _activeOrders.add(activeOrders.data?.activeOrders ?? []);
    } else {
      // A failed fetch (e.g. auth not fully ready yet right after a page refresh)
      // should not be treated as "no active ride" - retry once shortly after
      // instead of silently clearing an in-progress trip.
      await Future.delayed(const Duration(seconds: 2));
      final retry = await graphQLDatasource.query(
        Options$Query$ActiveOrders(
          fetchPolicy: FetchPolicy.noCache,
        ),
      );
      if (retry.isLoaded) {
        _activeOrders.add(retry.data?.activeOrders ?? []);
      }
    }
  }

  @override
  Future<ApiResponse<void>> getEphemeralMessages() async {
    final response = await graphQLDatasource.query(Options$Query$EphemeralMessages(fetchPolicy: FetchPolicy.noCache));
    _ephemeralMessages.add(response.data?.ephemeralMessages ?? []);
    return response;
  }

  @override
  Future<ApiResponse<void>> markEphemeralMessagesAsRead({required String messageId}) async {
    _ephemeralMessages.add(
      _ephemeralMessages.value.where((e) => e.messageId != messageId).toList(),
    );
    final readResponse = await graphQLDatasource.mutate(
      Options$Mutation$MarkEphemeralMessageAsRead(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$MarkEphemeralMessageAsRead(messageId: messageId),
      ),
    );
    return readResponse;
  }
}
