import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:generic_map/interfaces/map_controller.dart';
import 'package:generic_map/mapbox_sdk/helpers.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:latlong2/latlong.dart';

class MapboxController implements MapViewController {
  final Completer<MapboxMap> mapController = Completer();
  final EdgeInsets padding;

  MapboxController({
    required this.padding,
  });

  Future<MapboxMap> get controller => mapController.future;

  @override
  void moveCamera(LatLng location, double? zoom) async {
    CameraState? cameraState = await (await controller).getCameraState();
    double currentZoom = zoom ?? cameraState.zoom;
    final cameraOptions = CameraOptions(
      center: getPoint(location),
      zoom: currentZoom,
      padding: MbxEdgeInsets(
        top: padding.top,
        bottom: padding.bottom,
        left: padding.left,
        right: padding.right,
      ),
    );

    (await mapController.future).setCamera(cameraOptions);
  }

  @override
  Future<void> fitBounds(List<LatLng> points) async {
    final List<Point> mapboxPoints = getPoints(points);
    if (mapboxPoints.length < 2) {
      return;
    }

    final coordinates = await (await controller).cameraForCoordinatesPadding(
      mapboxPoints,
      CameraOptions(
        padding: MbxEdgeInsets(
          top: padding.top,
          left: padding.left,
          bottom: padding.bottom,
          right: padding.right,
        ),
      ),
      null,
      13,
      null,
    );
    (await controller).setCamera(
      coordinates,
    );
  }

  Future<void> addHeatMapLayer(
      HeatmapLayer heatmapLayer, List<LatLng> points) async {
    final String heatMapJsonData = jsonEncode(
      _generateHeatMapGeoJson(
        points,
      ),
    );

    await (await mapController.future).style.addSource(
          GeoJsonSource(
            id: heatmapLayer.sourceId,
            data: heatMapJsonData,
          ),
        );

    await (await mapController.future).style.addLayer(
          heatmapLayer,
        );
  }

  Map<String, dynamic> _generateHeatMapGeoJson(List<LatLng> points) {
    return {
      "type": "FeatureCollection",
      "features": points.map((point) {
        return {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [point.longitude, point.latitude]
          },
          "properties": {}
        };
      }).toList()
    };
  }

  @override
  Future<LatLng> getCenter() async {
    final cameraState = await (await mapController.future).getCameraState();
    final center = cameraState.center;
    return LatLng(
      center.coordinates.lat.toDouble(),
      center.coordinates.lng.toDouble(),
    );
  }

  @override
  void dispose() async {
    (await mapController.future).dispose();
  }

  Point getPoint(LatLng latLng) {
    return Point(
      coordinates: Position(
        latLng.longitude,
        latLng.latitude,
      ),
    );
  }

  List<Point> getPoints(List<LatLng> latLngs) {
    return latLngs
        .map(
          (p) => Point(
            coordinates: Position(
              p.longitude,
              p.latitude,
            ),
          ),
        )
        .toList();
  }

  @override
  Future<LatLngBounds> getViewportBounds() async {
    final bounds = await (await mapController.future).getBounds();
    final parsedBounds = LatLngBounds.fromPoints(
      [
        LatLng(
          bounds.bounds.northeast.latLng.latitude.toDouble(),
          bounds.bounds.northeast.latLng.longitude.toDouble(),
        ),
        LatLng(
          bounds.bounds.southwest.latLng.latitude.toDouble(),
          bounds.bounds.southwest.latLng.longitude.toDouble(),
        ),
      ],
    );
    return parsedBounds;
  }
}
