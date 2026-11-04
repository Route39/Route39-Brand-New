import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart' as flutter_map show LatLngBounds;
import 'package:generic_map/extensions.dart';
import 'package:generic_map/interfaces/interfaces.dart';
import 'package:gm_google_maps_flutter/google_maps_flutter.dart';
import 'package:latlong2/latlong.dart' as latlong;

class GoogleMapsController implements MapViewController {
  final Completer<GoogleMapController> mapController = Completer();
  final EdgeInsets padding;
  final Size viewportSize;

  GoogleMapsController({
    required this.padding,
    required this.viewportSize,
  });

  Future<GoogleMapController> get controller => mapController.future;

  @override
  void fitBounds(List<latlong.LatLng> points) async {
    if (points.length < 2) return;
    var firstLatLng = points.first;
    var s = firstLatLng.latitude,
        n = firstLatLng.latitude,
        w = firstLatLng.longitude,
        e = firstLatLng.longitude;
    for (var i = 1; i < points.length; i++) {
      var latlng = points[i];
      s = min(s, latlng.latitude);
      n = max(n, latlng.latitude);
      w = min(w, latlng.longitude);
      e = max(e, latlng.longitude);
    }
    final bounds =
        LatLngBounds(southwest: LatLng(s, w), northeast: LatLng(n, e));
    (await mapController.future).animateCamera(
      CameraUpdate.newLatLngBounds(
        bounds,
        max(padding.left, max(padding.top, max(padding.right, padding.bottom))),
      ),
    );
  }

  @override
  void moveCamera(latlong.LatLng location, double? zoom) async {
    // First approach, simpler but less accurate
    // final controller = await mapController.future;
    // final visibleRegion = await controller.getVisibleRegion();

    // // Calculate padding offset
    // final paddingOffset = LatLng(
    //   (visibleRegion.northeast.latitude - visibleRegion.southwest.latitude) *
    //       (padding.top - padding.bottom) /
    //       viewportSize.height,
    //   (visibleRegion.northeast.longitude - visibleRegion.southwest.longitude) *
    //       (padding.left - padding.right) /
    //       viewportSize.width,
    // );

    // controller.animateCamera(
    //   CameraUpdate.newCameraPosition(
    //     CameraPosition(
    //       target: LatLng(
    //         location.latitude + paddingOffset.latitude,
    //         location.longitude + paddingOffset.longitude,
    //       ),
    //       zoom: zoom ?? 16,
    //     ),
    //   ),
    // );
    // Second approach, more complex but should be more accurate
    // final c = await mapController.future;

    // // Use current zoom if not provided
    // final currentZoom = await c.getZoomLevel();
    // final targetZoom = zoom ?? currentZoom;

    // // Where the "center" of the padded viewport actually is (in screen px)
    // final paddedCenterX =
    //     (viewportSize.width / 2) + (padding.left - padding.right) / 2;
    // final paddedCenterY =
    //     (viewportSize.height / 2) + (padding.top - padding.bottom) / 2;

    // // Find the lat/lng that appears at that padded center
    // final targetScreen = ScreenCoordinate(
    //   x: paddedCenterX.round(),
    //   y: paddedCenterY.round(),
    // );
    // final latLngAtPaddedCenter = await c.getLatLng(targetScreen);

    // // Compute the lat/lng shift needed so `location` ends up at the padded center
    // final dx = location.latitude - latLngAtPaddedCenter.latitude;
    // final dy = location.longitude - latLngAtPaddedCenter.longitude;

    // await c.animateCamera(
    //   CameraUpdate.newCameraPosition(
    //     CameraPosition(
    //       target: LatLng(
    //         location.latitude +
    //             dx, // effectively centers location at padded center
    //         location.longitude + dy,
    //       ),
    //       zoom: targetZoom,
    //     ),
    //   ),
    // );

    // Third approach, simpler and should be accurate enough
    final c = await mapController.future;
    final currentZoom = await c.getZoomLevel();
    await c.animateCamera(
      CameraUpdate.newLatLngZoom(
          location.toGoogleMapLatLng(), zoom ?? currentZoom),
    );
  }

  @override
  Future<latlong.LatLng> getCenter() async {
    final visibleRegion = await (await mapController.future).getVisibleRegion();
    return latlong.LatLng(
      visibleRegion.southwest.latitude +
          ((visibleRegion.northeast.latitude -
                  visibleRegion.southwest.latitude) /
              2),
      visibleRegion.southwest.longitude +
          ((visibleRegion.northeast.longitude -
                  visibleRegion.southwest.longitude) /
              2),
    );
  }

  @override
  dispose() {
    mapController.future.then((value) => value.dispose());
  }

  @override
  Future<flutter_map.LatLngBounds> getViewportBounds() async {
    final visibleRegion = await (await mapController.future).getVisibleRegion();
    return flutter_map.LatLngBounds.fromPoints([
      visibleRegion.southwest.toLatLng(),
      visibleRegion.northeast.toLatLng(),
    ]);
  }
}
