import 'package:flutter/material.dart';
import 'package:flutter_common/core/entities/place.dart';
import 'package:flutter_common/core/enums/order_status.dart';
import 'package:generic_map/interfaces/map_view_mode.dart';
import 'package:generic_map/interfaces/marker.dart';
import 'package:generic_map/interfaces/polyline_layer.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/entities/place.prod.dart';
import 'package:ridy/core/enums/order_status.prod.dart';
import 'package:ridy/core/graphql/fragments/point.extensions.dart';
import 'package:ridy/core/graphql/fragments/point.fragment.graphql.dart';
import 'package:ridy/core/graphql/schema.gql.dart';

extension HomeStateX on HomeState {
  List<CustomMarker> get markers {
    switch (mode) {
      case HomeMode.loading:
        return [];
      case HomeMode.preSubmission:
        return switch (orderSubmissionPage) {
          OrderSubmissionPage.welcome => driversAround.driverMarkers(DateTime.now().millisecondsSinceEpoch.toString()),
          OrderSubmissionPage.rideWaypointsInput ||
          OrderSubmissionPage.deliverySearchPlaceInput ||
          OrderSubmissionPage.deliveryContactInfoInput => waypoints.nonNulls.toList().markers,
          OrderSubmissionPage.confirmLocation => [],
        };
      case HomeMode.ridePreview:
        final markers = waypoints.nonNulls.toList().markers;
        return markers;

      case HomeMode.rideInProgress:
        final markers = <CustomMarker>[];
        if (activeOrder!.status.toEntity.viewMode == OrderStatusViewMode.looking) {
          markers.addAll(activeOrder!.waypoints.toPlaces.markers);
          return markers;
        }
        if (activeOrder!.driver?.location != null) {
          markers.add(activeOrder!.driver!.location!.driverMarker(activeOrder!.id));
        }
        final nextDestination = activeOrder!.nextDestination;
        markers.add(switch (nextDestination?.role) {
          Enum$WaypointRole.Pickup => nextDestination!.toPlace.markerPickup("${activeOrder!.id}_pickup"),
          Enum$WaypointRole.Dropoff => nextDestination!.toPlace.markerDropoff("${activeOrder!.id}_dropoff"),
          Enum$WaypointRole.Stop => nextDestination!.toPlace.markerDropoff("${activeOrder!.id}_stop"),
          _ => nextDestination!.toPlace.markerDropoff("${activeOrder!.id}_unknown"),
        });

        return markers;
    }
  }

  bool get isInteractive => switch (mode) {
    HomeMode.loading => false,
    HomeMode.preSubmission => switch (orderSubmissionPage) {
      OrderSubmissionPage.welcome => true,
      OrderSubmissionPage.rideWaypointsInput ||
      OrderSubmissionPage.deliverySearchPlaceInput ||
      OrderSubmissionPage.deliveryContactInfoInput => false,
      OrderSubmissionPage.confirmLocation => true,
    },
    HomeMode.ridePreview => true,
    HomeMode.rideInProgress => true,
  };

  MapViewMode get mapViewMode =>
      mode == HomeMode.preSubmission &&
          (orderSubmissionPage == OrderSubmissionPage.welcome ||
              orderSubmissionPage == OrderSubmissionPage.confirmLocation)
      ? MapViewMode.picker
      : MapViewMode.static;

  List<Fragment$Coordinate> get directions => switch (mode) {
    HomeMode.ridePreview => ridePreviewFareResponse.data?.getFares.directions ?? [],
    HomeMode.rideInProgress => _rideInProgressDirections,
    _ => [],
  };

  List<Fragment$Coordinate> get _rideInProgressDirections {
    final order = activeOrder!;
    final fullRoute = order.directions;
    final driverLocation = order.driver?.location;
    final isEnRouteToPickup =
        order.status.toEntity == OrderStatus.driverAccepted || order.status.toEntity == OrderStatus.arrived;
    if (isEnRouteToPickup && driverLocation != null && fullRoute.isNotEmpty) {
      return fullRoute.trimToNearest(driverLocation.toLatLng);
    }
    return fullRoute;
  }

  List<PolyLineLayer> polylines(BuildContext context) => directions.isEmpty ? [] : [directions.toPolyLineLayer(context)];
}
