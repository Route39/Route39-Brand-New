part of 'home.bloc.dart';

@freezed
sealed class HomeState with _$HomeState {
  const factory HomeState({
    @Default(ApiResponseInitial()) ApiResponse<Fragment$Profile> profileFragment,
    Fragment$Coordinate? driverLocation,
    DateTime? lastLocationUpdate,

    // Online state
    @Default([]) List<Fragment$RideOffer> orderRequests,
    Fragment$RideOffer? currentOrderRequest,

    // On trip state
    @Default(OnTripPage.overview) OnTripPage page,
    @Default([]) List<Fragment$ActiveOrder> activeOrders,
    String? currentOrderId,
    @Default(ApiResponseInitial()) ApiResponse<void> acceptOrderReponse,

    // Ephemeral messages
    @Default([]) List<Fragment$EphemeralMessage> ephemeralMessages,

    @Default(ApiResponseInitial()) ApiResponse<void> updateStatusResponse,
  }) = _HomeState;

  // factory HomeState.fromJson(Map<String, dynamic> json) => _$HomeStateFromJson(json);

  const HomeState._();
  Fragment$Profile? get profile => profileFragment.data;

  Fragment$ActiveOrder? get currentOrder =>
      activeOrders.where((e) => e.id == currentOrderId).firstOrNull ?? activeOrders.firstOrNull;

  HomeStateDriverStatus get driverStatus {
    if (profileFragment.isLoading) {
      return HomeStateDriverStatus.loading;
    } else if (profileFragment.isError) {
      return HomeStateDriverStatus.initial;
    } else if (profile != null) {
      if (activeOrders.isNotEmpty) {
        return HomeStateDriverStatus.onTrip;
      }
      return switch (profile!.status) {
        Enum$DriverStatus.Online => HomeStateDriverStatus.online,
        Enum$DriverStatus.Offline => HomeStateDriverStatus.offline,
        Enum$DriverStatus.InService => switch (currentOrder?.status) {
          Enum$OrderStatus.DriverAccepted ||
          Enum$OrderStatus.Arrived ||
          Enum$OrderStatus.Started ||
          Enum$OrderStatus.Found ||
          Enum$OrderStatus.Requested ||
          Enum$OrderStatus.NoCloseFound ||
          Enum$OrderStatus.WaitingForPrePay ||
          Enum$OrderStatus.WaitingForReview ||
          Enum$OrderStatus.NotFound ||
          Enum$OrderStatus.WaitingForPostPay => HomeStateDriverStatus.onTrip,
          _ => HomeStateDriverStatus.onTrip,
        },
        Enum$DriverStatus.SoftReject ||
        Enum$DriverStatus.WaitingDocuments ||
        Enum$DriverStatus.HardReject ||
        Enum$DriverStatus.Blocked => HomeStateDriverStatus.accessDenied,
        Enum$DriverStatus.PendingApproval => HomeStateDriverStatus.offline,
        Enum$DriverStatus.$unknown => throw UnimplementedError(),
      };
    } else {
      return HomeStateDriverStatus.initial;
    }
  }

  EdgeInsets mapPadding(BuildContext context) {
    switch (driverStatus) {
      case HomeStateDriverStatus.online:
        if (orderRequests.isEmpty) {
          return EdgeInsets.only(bottom: 20, left: 100, right: 100, top: 100);
        } else {
          return EdgeInsets.only(bottom: 450, left: 100, right: 100, top: 200);
        }
      case HomeStateDriverStatus.onTrip:
      case HomeStateDriverStatus.offline:
      case HomeStateDriverStatus.accessDenied:
      case HomeStateDriverStatus.initial:
      case HomeStateDriverStatus.loading:
        return EdgeInsets.only(bottom: 16, left: 100, right: 100, top: 140);
    }
  }

  List<CustomMarker> get markers {
    final driverMarker = driverLocation == null
        ? null
        : CustomMarker(
            id: 'me',
            position: LatLng(driverLocation!.lat, driverLocation!.lng),
            rotation: driverLocation?.heading ?? 0,
            widget: Assets.images.carTopView.image(width: 50, height: 50, fit: BoxFit.cover),
            fallbackAssetPath: Assets.images.carTopView.path,
          );

    switch (driverStatus) {
      case HomeStateDriverStatus.online:
        final activeOrder = orderRequests.isEmpty ? null : (currentOrderRequest ?? orderRequests.firstOrNull);
        final waypointsMarkers = activeOrder?.waypoints.toPlaces.markers;
        final directionsCapMarkers =
            activeOrder?.directions.map((e) => e.toLatLng).toList().directionsCapMarkers(activeOrder.id) ?? [];
        return [
          if (waypointsMarkers != null) ...waypointsMarkers,
          if (driverMarker != null) driverMarker,
          ...directionsCapMarkers,
        ];

      case HomeStateDriverStatus.onTrip:
        final List<CustomMarker> waypointsMarkers =
            switch (currentOrder?.status) {
              Enum$OrderStatus.DriverAccepted => [currentOrder?.waypoints.toPlaces.markers.first].nonNulls.toList(),
              Enum$OrderStatus.Arrived => [currentOrder?.waypoints.toPlaces.markers.firstOrNull].nonNulls.toList(),
              Enum$OrderStatus.WaitingForPrePay => currentOrder?.waypoints.toPlaces.markers,
              Enum$OrderStatus.WaitingForPostPay => currentOrder?.waypoints.toPlaces.markers,
              Enum$OrderStatus.Started => [?currentOrder?.nextDestination?.genericMarker()],
              _ => currentOrder?.waypoints.toPlaces.markers,
            } ??
            [];
        final directionsCapMarkers = currentOrder?.directions.toLatLngList().directionsCapMarkers(currentOrder!.id);
        return [...waypointsMarkers, ...(directionsCapMarkers ?? []), if (driverMarker != null) driverMarker];

      case HomeStateDriverStatus.offline:
        return [if (driverMarker != null) driverMarker];

      default:
        return [];
    }
  }

  List<PolyLineLayer> polylines(BuildContext context) => switch (driverStatus) {
    HomeStateDriverStatus.online => [
      if ((currentOrderRequest ?? orderRequests.firstOrNull)?.directions
              .map((e) => e.toLatLng)
              .toList()
              .toPolyLineLayer !=
          null)
        (currentOrderRequest ?? orderRequests.firstOrNull)!.directions.map((e) => e.toLatLng).toList().toPolyLineLayer,
    ],
    HomeStateDriverStatus.onTrip => [currentOrder?.directions.toPolyLineLayer(context)].nonNulls.toList(),
    _ => [],
  };

  List<CircleMarker> circleMarkers(int? radius) => switch (driverStatus) {
    HomeStateDriverStatus.online when radius != null && driverLocation != null => [
      CircleMarker(
        id: 'search_radius',
        position: LatLng(driverLocation!.lat, driverLocation!.lng),
        radius: radius.toDouble(),
        color: ColorPalette.primary80.withValues(alpha: 0.2),
        borderColor: ColorPalette.primary80.withValues(alpha: 0.8),
        borderWidth: 1,
      ),
    ],
    _ => [],
  };
}

enum OnTripPage { overview, chat }

enum HomeStateDriverStatus { initial, loading, online, offline, onTrip, accessDenied }
