import 'package:api_response/api_response.dart';
import 'package:ridy/core/graphql/documents/calculate_fare.graphql.dart';
import 'package:ridy/core/graphql/fragments/active_order.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/ephemeral_message.fragment.graphql.dart';
import 'package:ridy/core/graphql/schema.gql.dart';

abstract class OrderRepository {
  Stream<ApiResponse<List<Fragment$ActiveOrder>>> get activeOrdersStream;

  Stream<ApiResponse<List<Fragment$EphemeralMessage>>> get ephemeralMessagesStream;

  void refreshActiveOrders();

  void startListeningToActiveOrders();
  void stopListeningToActiveOrders();

  Future<ApiResponse<Query$CalculateFare>> calculateFare({required Input$CalculateFareInput args});

  Future<ApiResponse<List<Fragment$ActiveOrder>>> createOrder({required Input$CreateOrderInput args});

  Future<ApiResponse<void>> getEphemeralMessages();

  void markEphemeralMessageAsSeen({required String messageId});

  Future<ApiResponse<void>> cancelOrder({
    required String orderId,
    required String? reasonId,
    required String? reasonText,
  });

  Future<void> updateLastSeenMessages({required String orderId, required String? lastSeenMessageId});

  Future<ApiResponse<void>> sendMessage({required String orderId, required String message});

  Future<ApiResponse<void>> submitReview({
    required String orderId,
    required int rating,
    required bool isFavorite,
    required String? comment,
    required List<int> reviewParameters,
  });
}
