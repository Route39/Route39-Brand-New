import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.fragment.graphql.dart';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/markers/app_marker_drop_off.dart';
import 'package:flutter_common/core/presentation/markers/app_marker_pickup.dart';
import 'package:flutter_common/core/presentation/markers/app_marker_stop.dart';
import 'package:generic_map/generic_map.dart';
import 'package:latlong2/latlong.dart';

extension CoordinateX on Fragment$Coordinate {
  LatLng get toLatLng {
    return LatLng(lat, lng);
  }

  Input$PointInput get toPointInput => Input$PointInput(lat: lat, lng: lng, heading: heading ?? 0);

  Place get toPlace => Place(toLatLng, '', null);
}

extension CoordinateListX on List<Fragment$Coordinate> {
  PolyLineLayer toPolyLineLayer(BuildContext context) {
    return PolyLineLayer(
      gradientColors: [context.colorScheme.primary, context.colorScheme.secondary],
      points: map((e) => e.toLatLng).toList(),
    );
  }

  List<LatLng> toLatLngList() {
    return map((e) => e.toLatLng).toList();
  }
}

extension PlaceX on Fragment$place {
  Place get toPlace => Place(point.toLatLng, address, title);
}

extension PlaceListX on List<Fragment$place> {
  List<Place> get toPlaces => map((e) => e.toPlace).toList();
}

extension PlaceListToMarkerList on List<Place> {
  List<LatLng> get toLatLngs => map((e) => e.latLng).toList();
}

extension WaypointX on Fragment$Waypoint {
  Place get toPlace => Place(location.toLatLng, address, null);

  CustomMarker genericMarker() => switch (role) {
    Enum$WaypointRole.Pickup => AppMarkerPickup(address: address).genericMarker(role.name, location.toLatLng),
    Enum$WaypointRole.Dropoff => AppMarkerDropoff(address: address).genericMarker(role.name, location.toLatLng),
    Enum$WaypointRole.Stop => AppMarkerStop(address: address, stopIndex: 0).genericMarker(role.name, location.toLatLng),
    Enum$WaypointRole.$unknown => AppMarkerStop(
      address: address,
      stopIndex: 0,
    ).genericMarker(role.name, location.toLatLng),
  };
}

extension WaypointListX on List<Fragment$Waypoint> {
  List<Place> get toPlaces => map((e) => e.toPlace).toList();

  List<LatLng> get latLngs => map((e) => e.location.toLatLng).toList();
}
