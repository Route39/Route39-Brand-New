import 'package:generic_map/generic_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:ridy/core/graphql/fragments/point.extensions.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:flutter_common/core/presentation/markers/app_marker_drop_off.dart';
import 'package:flutter_common/core/presentation/markers/app_marker_pickup.dart';

extension PlaceExtensionX on Place {
  CustomMarker markerPickup(String orderId) => AppMarkerPickup(address: address).genericMarker(orderId, latLng);
  CustomMarker markerDropoff(String orderId) => AppMarkerDropoff(address: address).genericMarker(orderId, latLng);

  Input$PointInput get toGql {
    return latLng.toPointInput;
  }
}

extension PlaceListX on List<Place> {
  // List<CustomMarker> get markers => mapIndexed((index, e) {
  //       if (index == 0) {
  //         return e.markerPickup();
  //       }
  //       return e.markerDropoff();
  //     }).toList();
  List<LatLng> get latLngs => map((e) => e.latLng).toList();

  List<Input$PointInput> get toGql {
    return map((e) => e.latLng.toPointInput).toList();
  }
}
