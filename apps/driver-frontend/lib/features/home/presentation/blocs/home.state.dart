part of 'home.bloc.dart';

@freezed
sealed class HomeState with _$HomeState {
  const factory HomeState({
    @Default(ApiResponseInitial()) ApiResponse<Fragment$Profile> profileFragment,
    Fragment$Coordinate? driverLocation,
    DateTime? lastLocationUpdate,

    // Live surge zones
    @Default([]) List<Query$LiveSurgeZones$liveSurgeZones> surgeZones,

    // Online state
    @Default([]) List<Fragment$RideOffer> orderRequests,
    Fragment$RideOffer? currentOrderRequest,

    // On trip state
    @Default(OnTripPage.overview) OnTripPage page,
    @Default([]) List<Fragment$ActiveOrder> activeOrders,
    String? currentOrderId,
    @Default(ApiResponseInitial()) ApiResponse<Fragment$ActiveOrder> acceptOrderReponse,

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

  Color _surgeColor(double percent) =>
      percent >= 30 ? Colors.red : (percent >= 15 ? Colors.deepOrange : Colors.amber.shade700);

  double _rainOf(Query$LiveSurgeZones$liveSurgeZones z) => _debugFakeRainMm > 0 ? _debugFakeRainMm : z.rainMm;

  String _rainLabel(double mm) => mm >= 7.6 ? 'Heavy' : (mm >= 2.5 ? 'Rain' : 'Light');

  String _short(String t) => t.length > 14 ? '${t.substring(0, 13)}…' : t;

  (Color, IconData, String)? _reasonTag(Query$LiveSurgeZones$liveSurgeZones z) => switch (z.type) {
    'Festival' => (Colors.purple.shade600, Icons.celebration, _short(z.name)),
    'Night' => (Colors.indigo.shade600, Icons.nightlight_round, 'Night'),
    'Event' => (Colors.green.shade700, Icons.event, _short(z.name)),
    _ => null,
  };

  List<CustomMarker> get _surgeBadgeMarkers => surgeZones.map((z) {
    final label = z.percent % 1 == 0 ? z.percent.toStringAsFixed(0) : z.percent.toStringAsFixed(1);
    final rain = _rainOf(z);
    final tag = _reasonTag(z);
    Widget pill(Color color, IconData icon, String text) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 2))],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 16),
          const SizedBox(width: 2),
          Text(text, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
        ],
      ),
    );
    return CustomMarker(
      id: 'surge_badge_${z.id}',
      position: LatLng(z.centerLat, z.centerLng),
      width: 92.0 + (rain > 0 ? 108 : 0) + (tag != null ? 130 : 0),
      height: 34,
      widget: FittedBox(
        fit: BoxFit.scaleDown,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            pill(_surgeColor(z.percent), Icons.local_fire_department, '+$label%'),
            if (rain > 0) ...[
              const SizedBox(width: 6),
              pill(Colors.blue.shade700, Icons.water_drop, _rainLabel(rain)),
            ],
            if (tag != null) ...[
              const SizedBox(width: 6),
              pill(tag.$1, tag.$2, tag.$3),
            ],
          ],
        ),
      ),
    );
  }).toList();

  List<CustomMarker> get markers {
    final driverMarker = driverLocation == null
        ? null
        : CustomMarker(
            id: 'me',
            position: LatLng(driverLocation!.lat, driverLocation!.lng),
            rotation: driverLocation?.heading ?? 0,
            widget: Assets.images.evAutoIcon.image(width: 50, height: 50, fit: BoxFit.contain),
            fallbackAssetPath: Assets.images.evAutoIcon.path,
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
          ..._surgeBadgeMarkers,
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
        return [if (driverMarker != null) driverMarker, ..._surgeBadgeMarkers];

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

  List<CircleMarker> circleMarkers(int? radius) {
    final surgeCircles = switch (driverStatus) {
      HomeStateDriverStatus.online || HomeStateDriverStatus.offline =>
        surgeZones.expand((z) {
          final base = z.percent >= 30
              ? Colors.red
              : (z.percent >= 15 ? Colors.deepOrange : Colors.amber);
          final r = z.radiusMeters.toDouble();
          final c = LatLng(z.centerLat, z.centerLng);
          const steps = 7;
          return List.generate(steps, (i) {
            final f = 1.0 - i / steps;
            return CircleMarker(
              id: 'surge_${z.id}_h$i',
              position: c,
              radius: r * f,
              color: base.withValues(alpha: 0.07),
              borderColor: base.withValues(alpha: i == 0 ? 0.35 : 0.0),
              borderWidth: i == 0 ? 1 : 0,
            );
          });
        }).toList(),
      _ => <CircleMarker>[],
    };
    final rainCircles = switch (driverStatus) {
      HomeStateDriverStatus.online || HomeStateDriverStatus.offline =>
        surgeZones.where((z) => _rainOf(z) > 0).expand((z) {
          final c = LatLng(z.centerLat, z.centerLng);
          final r = z.radiusMeters.toDouble() * 0.7;
          const steps = 6;
          return List.generate(steps, (i) {
            return CircleMarker(
              id: 'rain_${z.id}_h$i',
              position: c,
              radius: r * (1.0 - i / steps),
              color: Colors.blue.withValues(alpha: _rainOf(z) >= 7.6 ? 0.10 : 0.07),
              borderColor: Colors.blue.withValues(alpha: i == 0 ? 0.35 : 0.0),
              borderWidth: i == 0 ? 1 : 0,
            );
          });
        }).toList(),
      _ => <CircleMarker>[],
    };
    return [...surgeCircles, ...rainCircles, ..._searchRadiusCircles(radius)];
  }

  List<CircleMarker> _searchRadiusCircles(int? radius) => switch (driverStatus) {
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

// Set to e.g. 3.0 to preview the rain overlay without real rain. Keep 0 for real data.
const double _debugFakeRainMm = 3;

enum OnTripPage { overview, chat }

enum HomeStateDriverStatus { initial, loading, online, offline, onTrip, accessDenied }
