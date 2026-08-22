import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/fragments/ephemeral_message.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/profile.mock.dart';
import 'package:ridy_driver/core/graphql/fragments/ride_offer.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/ride_offer.mock.dart';
import 'package:ridy_driver/core/graphql/fragments/service.fragment.graphql.dart';
import 'package:ridy_driver/features/home/domain/repositories/home_repository.dart';
import 'package:injectable/injectable.dart';

import 'package:ridy_driver/core/graphql/fragments/cancel_reason.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/chat_message.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/current_order.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/current_order.mock.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:rxdart/rxdart.dart';
import 'package:time/time.dart';

@dev
@LazySingleton(as: HomeRepository)
class HomeRepositoryMock implements HomeRepository {
  @override
  Stream<List<Fragment$RideOffer>> get orderRequests => _orderRequests.stream;
  final BehaviorSubject<List<Fragment$RideOffer>> _orderRequests = BehaviorSubject.seeded([]);

  @override
  Stream<ApiResponse<Fragment$Profile>> get profile => _profile.stream;
  final BehaviorSubject<ApiResponse<Fragment$Profile>> _profile = BehaviorSubject.seeded(
    ApiResponse.loaded(mockProfile1),
  );

  @override
  Stream<List<Fragment$ActiveOrder>> get activeOrders => _activeOrders.stream;
  final BehaviorSubject<List<Fragment$ActiveOrder>> _activeOrders = BehaviorSubject.seeded([]);

  @override
  Stream<List<Fragment$EphemeralMessage>> get ephemeralMessages => _ephemeralMessages.stream;
  final BehaviorSubject<List<Fragment$EphemeralMessage>> _ephemeralMessages = BehaviorSubject.seeded([]);

  @override
  Future<ApiResponse<void>> updateDriverLocation({required Fragment$Coordinate location}) async {
    return const ApiResponse.loaded(null);
  }

  @override
  Future<ApiResponse<Fragment$ActiveOrder>> arrivedToDestination({required Fragment$ActiveOrder order}) async {
    final updatedOrder = mockCurrentOrder1.copyWith(status: Enum$OrderStatus.WaitingForPostPay);
    return ApiResponse.loaded(updatedOrder);
  }

  @override
  Future<ApiResponse<Fragment$ActiveOrder>> arrivedToPickup({required String orderId}) async {
    final updatedOrder = mockCurrentOrder1.copyWith(status: Enum$OrderStatus.Arrived);
    return ApiResponse.loaded(updatedOrder);
  }

  @override
  Future<ApiResponse<Fragment$ActiveOrder>> cancelOrder({
    required String orderId,
    required String? reasonId,
    String? reasonNote,
  }) async {
    final updatedOrder = mockCurrentOrder1.copyWith(status: Enum$OrderStatus.DriverCanceled);
    return ApiResponse.loaded(updatedOrder);
  }

  @override
  Future<ApiResponse<Fragment$ActiveOrder>> startTrip({required String orderId}) async {
    final updatedOrder = mockCurrentOrder1.copyWith(status: Enum$OrderStatus.Started);
    return ApiResponse.loaded(updatedOrder);
  }

  @override
  Future<ApiResponse<List<Fragment$CancelReason>>> getCancelReasons() async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded([]);
  }

  @override
  Future<ApiResponse<Fragment$ActiveOrder>> submitReview({
    required String orderId,
    required int rating,
    required String? review,
  }) async {
    return ApiResponse.loaded(mockCurrentOrder1.copyWith(status: Enum$OrderStatus.Finished));
  }

  @override
  Future<ApiResponse<Fragment$ActiveOrder>> paidInCash({required String orderId, required double amount}) async {
    final newOrder = mockCurrentOrder1.copyWith(status: Enum$OrderStatus.Finished);
    return ApiResponse.loaded(newOrder);
  }

  @override
  Future<ApiResponse<Fragment$ChatMessage>> sendMessage({required String orderId, required String message}) async {
    return ApiResponse.loaded(Fragment$ChatMessage(message: message, isFromMe: true, createdAt: 5.minutes.ago));
  }

  @override
  Future<ApiResponse<void>> sendSosSignal({required String orderId}) async {
    return ApiResponse.loaded(null);
  }

  @override
  void refreshRideOffers() {
    _orderRequests.add([mockRideOffer]);
  }

  @override
  Future<ApiResponse<void>> updateLastSeenMessagesAt({required String orderId}) async {
    return ApiResponse.loaded(null);
  }

  @override
  getProfile() {
    _profile.add(ApiResponse.loaded(mockProfile1));
  }

  @override
  updateRadius({required int? radius}) async {
    await Future.delayed(const Duration(seconds: 1));
    return _profile.add(ApiResponse.loaded(mockProfile1.copyWith(searchDistance: radius)));
  }

  @override
  Future<ApiResponse<void>> deleteAccount() async {
    await Future.delayed(const Duration(seconds: 1));
    _profile.add(ApiResponse.error('Account has been deleted'));
    return ApiResponse.loaded(null);
  }

  @override
  Future<ApiResponse<void>> updateStatus({required Enum$DriverStatus status, Input$PointInput? location}) async {
    _profile.add(ApiResponse.loaded(_profile.value.data!.copyWith(status: status)));
    return ApiResponse.loaded(null);
  }

  @override
  startListeningToOrderUpdates() {
    _profile.add(
      ApiResponse.loaded(
        mockProfile1.copyWith(
            // currentOrders: [],
            ),
      ),
    );
  }

  @override
  stopListeningToOrderUpdates() {}

  @override
  Future<ApiResponse<void>> acceptOrderRequest({required String requestId}) async {
    _profile.add(ApiResponse.loaded(mockProfile1.copyWith()));
    return ApiResponse.loaded(null);
  }

  @override
  void onLoggedIn({required Fragment$Profile profile}) async {
    _profile.add(ApiResponse.loaded(profile));
  }

  @override
  Future<ApiResponse<List<Fragment$Service>>> getActiveServices() async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded([]);
  }

  @override
  void refreshActiveOrders() {
    _activeOrders.add([mockCurrentOrder1]);
  }

  @override
  Future<ApiResponse<void>> getEphemeralMessages() async {
    return ApiResponse.loaded(null);
  }

  @override
  Future<ApiResponse<void>> markEphemeralMessagesAsRead({required String messageId}) async {
    _ephemeralMessages.add(
      _ephemeralMessages.value.where((e) => e.messageId != messageId).toList(),
    );
    return ApiResponse.loaded(null);
  }
}
