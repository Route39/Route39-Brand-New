import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_animations/flutter_map_animations.dart';
import 'package:generic_map/interfaces/interfaces.dart';
import 'package:latlong2/latlong.dart';

class FlutterMapController implements MapViewController {
  final AnimatedMapController mapController;
  final EdgeInsets? padding;

  FlutterMapController({
    required this.mapController,
    this.padding,
  });

  @override
  void fitBounds(List<LatLng> points) {
    if (points.length < 2) {
      return;
    }
    mapController.animatedFitCamera(
      cameraFit: CameraFit.coordinates(
        coordinates: points,
        padding: padding ?? const EdgeInsets.all(0),
        maxZoom: 18.0,
      ),
    );
  }

  @override
  void moveCamera(LatLng location, double? zoom) {
    final yAxis = (((padding?.top ?? 0) - (padding?.bottom ?? 0)) / 2);
    final xAxis = (((padding?.left ?? 0) - (padding?.right ?? 0)) / 2);
    final offsetFromPadding = Offset(xAxis, yAxis);
    final currentZoom = mapController.mapController.camera.zoom;
    mapController.animateTo(
      customId: 'moveCamera',
      dest: location,
      zoom: zoom ?? currentZoom,
      offset: offsetFromPadding,
    );
    //mapController.centerOnPoint(location);
    // mapController.animateTo(dest: location, zoom: zoom);
  }

  @override
  Future<LatLng> getCenter() async {
    return mapController.mapController.camera.center;
  }

  @override
  dispose() {
    mapController.dispose();
  }

  @override
  Future<LatLngBounds> getViewportBounds() async {
    return mapController.mapController.camera.visibleBounds;
  }
}
