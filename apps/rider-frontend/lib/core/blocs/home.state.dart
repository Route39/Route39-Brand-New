part of 'home.bloc.dart';

@freezed
sealed class HomeState with _$HomeState {
  const factory HomeState({
    // General
    @Default(ApiResponse.initial()) ApiResponse<Place> currentLocationResponse,
    @Default([]) List<Fragment$EphemeralMessage> ephemeralMessages,
    MapViewController? mapViewController,
    @Default(OrderSubmissionPage.welcome) OrderSubmissionPage orderSubmissionPage,

    // Order Submission
    @Default(Enum$TaxiOrderType.Ride) Enum$TaxiOrderType orderType,
    @Default([]) List<Place?> waypoints,
    @Default([]) List<Fragment$Coordinate> driversAround,

    // Order Submission - Delivery
    Input$DeliveryContactInput? senderContact,
    Input$DeliveryContactInput? receiverContact,

    // Confirm Location
    int? selectedWaypointIndex,
    @Default(ApiResponse.initial()) ApiResponse<Place> selectedLocationResponse,

    // Ride Preview
    @Default(ApiResponse.initial()) ApiResponse<Query$CalculateFare> ridePreviewFareResponse,
    PaymentMethodUnion? selectedPaymentMethod,
    Fragment$ServiceCategory? selectedServiceCategory,
    Fragment$Service? selectedService,
    String? couponCode,
    @Default(false) bool isTwoWayRide,
    int? waitTime,
    @Default([]) List<Fragment$RideOption> rideOptions,
    DateTime? selectedDateTime,
    @Default(ApiResponse.initial()) ApiResponse<void> createOrderResponse,

    // Ride In Progress
    @Default(ApiResponse.initial()) ApiResponse<List<Fragment$ActiveOrder>> currentOrdersResponse,
    String? currentRideId,
    @Default(TrackOrderPage.overview) TrackOrderPage page,
    @Default(ApiResponseInitial()) ApiResponse<void> cancelOrderResponse,
    @Default(ApiResponseInitial()) ApiResponse<void> sendMessageState,
    @Default(ApiResponseInitial()) ApiResponse<void> reviewSubmissionState,
  }) = _HomeState;

  Fragment$ActiveOrder? get activeOrder => currentOrdersResponse.data?.firstWhereOrNull(
    (order) =>
        (order.id == currentRideId || currentRideId == null) &&
        (order.status.toEntity.viewMode != OrderStatusViewMode.finished && order.status != Enum$OrderStatus.Booked),
  );

  ApiResponse<List<Fragment$ActiveOrder>> get deliveryOrdersResponse => currentOrdersResponse.mapData(
    (data) => data
        .where(
          (order) => order.type == Enum$TaxiOrderType.ParcelDelivery || order.type == Enum$TaxiOrderType.FoodDelivery,
        )
        .toList(),
  );

  ApiResponse<List<Fragment$ActiveOrder>> get scheduledRidesResponse =>
      currentOrdersResponse.mapData((data) => data.where((order) => order.status == Enum$OrderStatus.Booked).toList());

  bool get canSubmitOrder {
    return (selectedPaymentMethod != null && selectedService != null) && !createOrderResponse.isLoading;
  }

  Input$DeliveryContactInput? get selectedContact {
    if (selectedWaypointIndex == 0) {
      return senderContact;
    } else if (selectedWaypointIndex == 1) {
      return receiverContact;
    }
    return null;
  }

  HomeMode get mode {
    if (activeOrder != null) {
      return HomeMode.rideInProgress;
    }
    if (ridePreviewFareResponse.isLoaded || ridePreviewFareResponse.isLoading) {
      return HomeMode.ridePreview;
    }
    return HomeMode.preSubmission;
  }

  DeliveryParty get deliveryParty => selectedWaypointIndex == 1 ? DeliveryParty.receiver : DeliveryParty.sender;

  const HomeState._();

  List<Place?> get currentWaypoints => activeOrder?.waypoints.toPlaces ?? waypoints;
}

enum HomeMode { loading, preSubmission, ridePreview, rideInProgress }

enum OrderSubmissionPage {
  welcome,
  rideWaypointsInput,
  deliverySearchPlaceInput,
  deliveryContactInfoInput,
  confirmLocation,
}

enum TrackOrderPage { overview, chat, payment }

enum ErrorType { regionNotSupported, noInternet, unknown }

enum DeliveryParty { sender, receiver }
