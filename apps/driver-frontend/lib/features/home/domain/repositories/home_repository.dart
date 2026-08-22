import 'package:ridy_driver/core/graphql/fragments/cancel_reason.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/chat_message.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/current_order.fragment.graphql.dart';
import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/ephemeral_message.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/ride_offer.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/service.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';

abstract class HomeRepository {
  Stream<List<Fragment$RideOffer>> get orderRequests;
  Stream<List<Fragment$ActiveOrder>> get activeOrders;
  Stream<ApiResponse<Fragment$Profile>> get profile;
  Stream<List<Fragment$EphemeralMessage>> get ephemeralMessages;

  void getProfile();

  void updateRadius({required int? radius});

  Future<ApiResponse<void>> updateDriverLocation({required Fragment$Coordinate location});

  Future<ApiResponse<void>> deleteAccount();

  void refreshRideOffers();

  void refreshActiveOrders();

  Future<ApiResponse<void>> updateStatus({required Enum$DriverStatus status, Input$PointInput? location});

  Future<ApiResponse<void>> acceptOrderRequest({required String requestId});

  void onLoggedIn({required Fragment$Profile profile});

  void startListeningToOrderUpdates();

  void stopListeningToOrderUpdates();

  Future<ApiResponse<List<Fragment$CancelReason>>> getCancelReasons();

  Future<ApiResponse<void>> cancelOrder({required String orderId, required String reasonId, String? reasonNote});

  Future<ApiResponse<void>> arrivedToPickup({required String orderId});

  Future<ApiResponse<void>> startTrip({required String orderId});

  Future<ApiResponse<void>> submitReview({required String orderId, required int rating, required String? review});

  Future<ApiResponse<void>> paidInCash({required String orderId, required double amount});

  Future<ApiResponse<void>> arrivedToDestination({required Fragment$ActiveOrder order});

  Future<ApiResponse<Fragment$ChatMessage>> sendMessage({required String orderId, required String message});

  Future<ApiResponse<void>> sendSosSignal({required String orderId});

  Future<ApiResponse<void>> updateLastSeenMessagesAt({required String orderId});

  Future<ApiResponse<List<Fragment$Service>>> getActiveServices();

  Future<ApiResponse<void>> getEphemeralMessages();

  Future<ApiResponse<void>> markEphemeralMessagesAsRead({required String messageId});
}
