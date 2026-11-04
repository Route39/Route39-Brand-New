import 'package:latlong2/latlong.dart' as latlng;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

extension MapboxLatLngX on Point {
  latlng.LatLng get latLng =>
      latlng.LatLng(coordinates[1]!.toDouble(), coordinates[0]!.toDouble());
}

extension MapboxLatLngXX on latlng.LatLng {
  Point get mapboxLatLng => Point(coordinates: Position(longitude, latitude));
}
