import 'package:latlong2/latlong.dart';
import 'package:flutter_map/flutter_map.dart' show LatLngBounds;

abstract class MapViewController {
  void fitBounds(List<LatLng> points);
  void moveCamera(LatLng location, double? zoom);
  Future<LatLng> getCenter();
  Future<LatLngBounds> getViewportBounds();
  void dispose();
}
