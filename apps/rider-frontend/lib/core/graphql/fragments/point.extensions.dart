import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/entities/driver_location.dart';
import 'package:flutter_common/gen/assets.gen.dart';
import 'package:generic_map/interfaces/marker.dart';
import 'package:generic_map/interfaces/place.dart';
import 'package:generic_map/interfaces/polyline_layer.dart';
import 'package:latlong2/latlong.dart';
import 'package:ridy/core/graphql/fragments/point.fragment.graphql.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:ridy/gen/assets.gen.dart' as rider_assets;

extension LatLngX on LatLng {
  Fragment$Coordinate get toCoordinate => Fragment$Coordinate(lat: latitude, lng: longitude);

  Input$PointInput get toPointInput => Input$PointInput(lat: latitude, lng: longitude);
}

extension CoordinateX on Fragment$Coordinate {
  LatLng get toLatLng => LatLng(lat, lng);
}

// list of LatLng
extension LatLngListX on List<LatLng> {
  List<Fragment$Coordinate> get toCoordinates => map((e) => e.toCoordinate).toList();
}

// list of Fragment$coordinate
extension CoordinateListX on List<Fragment$Coordinate> {
  List<LatLng> get toLatLngs => map((e) => e.toLatLng).toList();

  PolyLineLayer toPolyLineLayer(BuildContext context) => PolyLineLayer(
    points: map((e) => e.toLatLng).toList(),
    width: 3,
    gradientColors: [ColorPalette.primary40, ColorPalette.tertiary60],
  );

  /// Returns the remaining part of this route starting from the point
  /// closest to [from]. Used to "trim" a driver's route line as they move,
  /// without re-fetching directions from the server on every location update.
  List<Fragment$Coordinate> trimToNearest(LatLng from) {
    if (isEmpty) return this;
    const distanceCalculator = Distance();
    var nearestIndex = 0;
    var nearestDistance = double.infinity;
    for (var i = 0; i < length; i++) {
      final d = distanceCalculator.distance(from, this[i].toLatLng);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearestIndex = i;
      }
    }
    return sublist(nearestIndex);
  }
}

extension PointX on Fragment$Coordinate {
  DriverLocation? get toMediaEntity {
    return DriverLocation(lat: lat, lng: lng, rotation: heading);
  }
}

extension DriverLocationX on Fragment$Coordinate {
  CustomMarker driverMarker(String driverId) => CustomMarker(
    id: driverId,
    position: LatLng(lat, lng),
    widget: Image.asset('assets/images/ev_auto_icon.png'),
    fallbackAssetPath: 'assets/images/ev_auto_icon.png',
    alignment: Alignment.center,
    rotation: heading ?? 0,
    width: 48,
    height: 48,
  );
}

extension DriverLocationListX on List<Fragment$Coordinate> {
  List<CustomMarker> driverMarkers(String requestTimestamp) =>
      mapIndexed((index, driver) => driver.driverMarker('$requestTimestamp-$index')).toList();
}

extension WaypointX on Fragment$Waypoint {
  Place get toPlace => Place(location.toLatLng, address, null);

  Input$WaypointInput get toGql => Input$WaypointInput(
    address: address,
    point: Input$PointInput(lat: location.lat, lng: location.lng),
  );
}

extension WaypointListX on List<Fragment$Waypoint> {
  List<Place> get toPlaces => map((e) => e.toPlace).toList();

  List<LatLng> get latLngs => map((e) => e.location.toLatLng).toList();

  List<Input$WaypointInput> get toGql => map((e) => e.toGql).toList();
}

extension PlacesX on Place {
  Input$WaypointInput get toWaypointInputGql => Input$WaypointInput(
    address: address,
    point: Input$PointInput(lat: latLng.latitude, lng: latLng.longitude),
  );
}

extension PlacesListX on List<Place> {
  List<Input$WaypointInput> get toWaypointInputGql => map((e) => e.toWaypointInputGql).toList();
}

extension PlaceGQLX on Fragment$Place {
  Place get toPlace => Place(point.toLatLng, address, null);
}

extension PlaceGQLListX on List<Fragment$Place> {
  List<Place> get toPlaces => map((e) => e.toPlace).toList();
}
