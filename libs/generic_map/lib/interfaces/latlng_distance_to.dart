import 'package:latlong2/latlong.dart';

extension LatLngDistanceTo on LatLng {
  double distanceTo(LatLng other) {
    final distance = Distance();
    return distance.as(LengthUnit.Meter, this, other);
  }
}
