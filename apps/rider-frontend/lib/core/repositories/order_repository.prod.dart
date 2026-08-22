import 'dart:async';

import 'package:api_response/api_response.dart';
import 'package:collection/collection.dart';
import 'package:graphql/client.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/graphql/documents/home.graphql.dart';
import 'package:ridy/core/graphql/documents/rate_ride.graphql.dart';
import 'package:ridy/core/graphql/documents/track_order.graphql.dart';
import 'package:ridy/core/graphql/fragments/active_order.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/driver.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/ephemeral_message.fragment.graphql.dart';
import 'package:rxdart/rxdart.dart';

import 'package:ridy/core/datasources/graphql_datasource.dart';
import 'package:ridy/core/graphql/documents/calculate_fare.graphql.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:ridy/core/repositories/order_repository.dart';

@prod
@LazySingleton(as: OrderRepository)
class OrderRepositoryImpl implements OrderRepository {
  final GraphqlDatasource graphqlDatasource;

  OrderRepositoryImpl(this.graphqlDatasource);

  @override
  Stream<ApiResponse<List<Fragment$ActiveOrder>>> get activeOrdersStream => _activeOrdersStream.stream;

  final BehaviorSubject<ApiResponse<List<Fragment$ActiveOrder>>> _activeOrdersStream =
      BehaviorSubject<ApiResponse<List<Fragment$ActiveOrder>>>();

  @override
  Stream<ApiResponse<List<Fragment$EphemeralMessage>>> get ephemeralMessagesStream => _ephemeralMessagesStream.stream;

  final BehaviorSubject<ApiResponse<List<Fragment$EphemeralMessage>>> _ephemeralMessagesStream =
      BehaviorSubject<ApiResponse<List<Fragment$EphemeralMessage>>>();

  StreamSubscription? orderUpdatedSubscription;

  @override
  void refreshActiveOrders() async {
    final activeOrders = await graphqlDatasource.query(Options$Query$CurrentOrder());
    _activeOrdersStream.add(activeOrders.mapData((data) => data.activeOrders));
  }

  @override
  Future<ApiResponse<Query$CalculateFare>> calculateFare({required Input$CalculateFareInput args}) async {
    final result = await graphqlDatasource.query(
      Options$Query$CalculateFare(variables: Variables$Query$CalculateFare(input: args)),
    );
    return result.mapData((r) => r);
  }

  @override
  Future<ApiResponse<List<Fragment$ActiveOrder>>> createOrder({required Input$CreateOrderInput args}) async {
    final orderResponse = await graphqlDatasource.mutate(
      Options$Mutation$CreateOrder(variables: Variables$Mutation$CreateOrder(input: args)),
    );
    if (orderResponse.data == null) {
      return orderResponse.mapData((data) => data.createOrder);
    }
    _activeOrdersStream.add(ApiResponse.loaded(orderResponse.data?.createOrder ?? []));
    return orderResponse.mapData((data) => data.createOrder);
  }

  @override
  Future<ApiResponse<void>> cancelOrder({
    required String orderId,
    required String? reasonId,
    required String? reasonText,
  }) async {
    final cancelOrderResponse = await graphqlDatasource.mutate(
      Options$Mutation$CancelOrder(
        variables: Variables$Mutation$CancelOrder(
          orderId: orderId,
          cancelReasonId: reasonId,
          cancelReasonNote: reasonText,
        ),
      ),
    );
    if (cancelOrderResponse.data != null) {
      final order = _activeOrdersStream.value.data?.firstWhereOrNull((order) => order.id == orderId);
      if (order != null) {
        _activeOrdersStream.add(
          ApiResponse.loaded(_activeOrdersStream.value.data?.where((o) => o.id != orderId).toList() ?? []),
        );
      }
    }
    return cancelOrderResponse.mapData((data) => data.cancelOrder);
  }

  @override
  Future<void> updateLastSeenMessages({required String orderId, required String? lastSeenMessageId}) async {
    final updateResponse = await graphqlDatasource.mutate(
      Options$Mutation$UpdateLastSeenMessagesAt(
        variables: Variables$Mutation$UpdateLastSeenMessagesAt(orderId: orderId),
      ),
    );
    if (updateResponse.data != null) {
      final order = _activeOrdersStream.value.data?.firstWhereOrNull((order) => order.id == orderId);
      if (order != null) {
        final updatedOrder = order.copyWith(unreadMessagesCount: 0);
        _activeOrdersStream.add(
          ApiResponse.loaded(_activeOrdersStream.value.data!.map((e) => e.id == orderId ? updatedOrder : e).toList()),
        );
      }
    }
  }

  @override
  Future<ApiResponse<void>> sendMessage({required String orderId, required String message}) async {
    final sendMessageResponse = await graphqlDatasource.mutate(
      Options$Mutation$SendMessage(
        variables: Variables$Mutation$SendMessage(orderId: orderId, message: message),
      ),
    );
    if (sendMessageResponse.data != null) {
      final order = _activeOrdersStream.value.data?.firstWhereOrNull((order) => order.id == orderId);
      if (order != null) {
        _activeOrdersStream.add(
          ApiResponse.loaded(
            _activeOrdersStream.value.data!
                .map(
                  (e) => e.id == orderId
                      ? e.copyWith(
                          chatMessages: e.chatMessages.followedBy([sendMessageResponse.data!.sendChatMessage]).toList(),
                        )
                      : e,
                )
                .toList(),
          ),
        );
      }
    }
    return sendMessageResponse;
  }

  @override
  void startListeningToActiveOrders() {
    if (orderUpdatedSubscription != null) {
      stopListeningToActiveOrders();
    }
    orderUpdatedSubscription = graphqlDatasource.subscribe(Options$Subscription$OrderUpdateSubsctipion()).listen((
      event,
    ) {
      final order = _activeOrdersStream.value.data?.firstWhereOrNull(
        (order) => order.id == event.activeOrderUpdated.orderId,
      );
      if (order == null) {
        return;
      }
      switch (event.activeOrderUpdated.type) {
        case Enum$RiderOrderUpdateType.OrderCompleted:
          _activeOrdersStream.add(
            ApiResponse.loaded(_activeOrdersStream.value.data?.where((e) => e.id != order.id).toList() ?? []),
          );
          getEphemeralMessages();
          break;
        case Enum$RiderOrderUpdateType.DriverAssigned:
          _activeOrdersStream.add(
            ApiResponse.loaded(
              _activeOrdersStream.value.data?.map((e) {
                    if (e.id == order.id) {
                      return order.copyWith(
                        driver: event.activeOrderUpdated.driver,
                        status: event.activeOrderUpdated.status ?? e.status,
                        directions: event.activeOrderUpdated.directions ?? e.directions,
                        nextDestination: event.activeOrderUpdated.nextDestination ?? e.nextDestination,
                      );
                    }
                    return e;
                  }).toList() ??
                  [],
            ),
          );
        case Enum$RiderOrderUpdateType.StatusUpdated:
          _activeOrdersStream.add(
            ApiResponse.loaded(
              _activeOrdersStream.value.data?.map((e) {
                    if (e.id == order.id) {
                      return order.copyWith(
                        status: event.activeOrderUpdated.status ?? e.status,
                        directions: event.activeOrderUpdated.directions ?? e.directions,
                        nextDestination: event.activeOrderUpdated.nextDestination ?? e.nextDestination,
                      );
                    }
                    return e;
                  }).toList() ??
                  [],
            ),
          );
        case Enum$RiderOrderUpdateType.NewMessageReceived:
          _activeOrdersStream.add(
            ApiResponse.loaded(
              _activeOrdersStream.value.data?.map((e) {
                    if (e.id == order.id) {
                      return order.copyWith(
                        chatMessages: e.chatMessages.followedBy([event.activeOrderUpdated.message!]).toList(),
                        unreadMessagesCount: event.activeOrderUpdated.unreadMessagesCount ?? order.unreadMessagesCount,
                      );
                    }
                    return e;
                  }).toList() ??
                  [],
            ),
          );
        case Enum$RiderOrderUpdateType.DriverLocationUpdated:
          _activeOrdersStream.add(
            ApiResponse.loaded(
              _activeOrdersStream.value.data?.map((e) {
                    if (e.id == order.id) {
                      return order.copyWith(
                        driver: order.driver?.copyWith(
                          location: event.activeOrderUpdated.driverLocation ?? order.driver!.location,
                        ),
                      );
                    }
                    return e;
                  }).toList() ??
                  [],
            ),
          );
        case Enum$RiderOrderUpdateType.DriverCancelled:
          _activeOrdersStream.add(
            ApiResponse.loaded(_activeOrdersStream.value.data?.where((e) => e.id != order.id).toList() ?? []),
          );
          getEphemeralMessages();
        case Enum$RiderOrderUpdateType.NewEphemeralMessage:
          getEphemeralMessages();
          break;
        case Enum$RiderOrderUpdateType.$unknown:
          throw Exception('Unknown order update type: ${event.activeOrderUpdated.type}');
        case Enum$RiderOrderUpdateType.NoDriverFound:
          _activeOrdersStream.add(
            ApiResponse.loaded(_activeOrdersStream.value.data?.where((e) => e.id != order.id).toList() ?? []),
          );
          getEphemeralMessages();
      }
    });
  }

  @override
  void stopListeningToActiveOrders() {
    orderUpdatedSubscription?.cancel();
    orderUpdatedSubscription = null;
  }

  @override
  Future<ApiResponse<void>> submitReview({
    required String orderId,
    required int rating,
    required bool isFavorite,
    required String? comment,
    required List<int> reviewParameters,
  }) async {
    final result = await graphqlDatasource.mutate(
      Options$Mutation$SubmitReview(
        variables: Variables$Mutation$SubmitReview(
          requestId: orderId,
          score: rating,
          feedback: comment,
          parameterIds: reviewParameters.map((e) => e.toString()).toList(),
          addToFavorite: isFavorite,
        ),
      ),
    );
    if (result.data != null) {
      final order = _activeOrdersStream.value.data?.firstWhereOrNull((order) => order.id == orderId);
      if (order != null) {
        _activeOrdersStream.add(
          ApiResponse.loaded(_activeOrdersStream.value.data!.where((e) => e.id != orderId).toList()),
        );
      }
    }

    return result;
  }

  @override
  Future<ApiResponse<void>> getEphemeralMessages() async {
    final response = await graphqlDatasource.query(Options$Query$EphemeralMessages(fetchPolicy: FetchPolicy.noCache));
    _ephemeralMessagesStream.add(response.mapData((r) => r.ephemeralMessages));
    return response;
  }

  @override
  void markEphemeralMessageAsSeen({required String messageId}) {
    _ephemeralMessagesStream.add(
      ApiResponse.loaded(
        _ephemeralMessagesStream.value.data
                ?.where((e) => e.messageId != messageId)
                .toList() ??
            [],
      ),
    );
    graphqlDatasource.mutate(
      Options$Mutation$MarkEphemeralMessageAsRead(
        variables: Variables$Mutation$MarkEphemeralMessageAsRead(
          messageId: messageId,
        ),
      ),
    );
  }
}
