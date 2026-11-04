import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:generic_map/generic_map.dart';
import 'package:generic_map/interfaces/heat_map_config.dart';
import 'package:generic_map/interfaces/latlng_distance_to.dart';
import 'package:generic_map/mapbox_sdk/controller.dart';
import 'package:generic_map/mapbox_sdk/parser.dart';
import 'package:latlong2/latlong.dart' show LatLng;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'helpers.dart';

class MapBoxView extends StatefulWidget {
  final Function(LatLng latLng, double zoom, LatLngBounds bounds,
      MapMoveEventType eventType)? onMapMoved;
  final bool interactive;
  final Place initialLocation;
  final double initialZoom;
  final List<CircleMarker> circleMarkers;
  final MapboxSdkOptions options;
  final List<PolyLineLayer> polylines;
  final List<CustomMarker> markers;
  final EdgeInsets padding;
  final EdgeInsets buttonsPadding;
  final List<HeatmapConfig> heatmapConfig;
  final Function(MapViewController)? onControllerReady;
  final bool showMyLocation;

  const MapBoxView({
    super.key,
    required this.initialLocation,
    required this.initialZoom,
    required this.onMapMoved,
    required this.interactive,
    required this.circleMarkers,
    required this.options,
    required this.polylines,
    required this.markers,
    required this.padding,
    required this.buttonsPadding,
    required this.heatmapConfig,
    required this.onControllerReady,
    required this.showMyLocation,
  });

  @override
  createState() => _MapBoxViewState();
}

class _MapBoxViewState extends State<MapBoxView> {
  late MapboxController mapboxMapController;

  mapbox.CircleAnnotationManager? circleAnnotationManager;
  mapbox.PolylineAnnotationManager? polylineAnnotationManager;
  mapbox.PointAnnotationManager? pointAnnotationManager;

  List<mapbox.PointAnnotation?> currentPointAnnotations = [];
  List<mapbox.PolylineAnnotation?> currentPolylineAnnotations = [];
  List<mapbox.CircleAnnotation?> currentCircleAnnotations = [];

  late MapBoxSDKParser parser;

  Timer? _debounceTimer;

  @override
  void initState() {
    mapbox.MapboxOptions.setAccessToken(
      widget.options.accessToken,
    );
    parser = MapBoxSDKParser(
      widget.initialZoom,
    );
    mapboxMapController = MapboxController(
      padding: widget.padding,
    );
    super.initState();
  }

  @override
  void didUpdateWidget(covariant MapBoxView oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.circleMarkers != oldWidget.circleMarkers) {
      _updateCircleMarkers(oldWidget);
    }

    if (_hasMarkerListChanged(oldWidget.markers, widget.markers)) {
      _updateMarkers(oldWidget);
    }

    if (widget.polylines != oldWidget.polylines) {
      _updatePolylines(oldWidget);
    }

    if (!const DeepCollectionEquality()
        .equals(widget.heatmapConfig, oldWidget.heatmapConfig)) {
      _updateHeatmap(oldWidget);
    }
  }

  Future<void> _updateHeatmap(covariant MapBoxView oldWidget) async {
    for (int i = 0; i < oldWidget.heatmapConfig.length; i++) {
      await (await mapboxMapController.controller).style.removeStyleLayer(
          "heatmap-layer-${oldWidget.heatmapConfig[i].hashCode}");
      await (await mapboxMapController.controller).style.removeStyleSource(
          "heatmap-source-${oldWidget.heatmapConfig[i].hashCode}");
    }

    if (widget.heatmapConfig.isNotEmpty) {
      List<mapbox.HeatmapLayer> layers =
          parser.parseHeatmap(widget.heatmapConfig);

      for (int i = 0; i < layers.length; i++) {
        await mapboxMapController.addHeatMapLayer(
          layers[i],
          widget.heatmapConfig[i].points,
        );
      }
    }
  }

  bool _hasMarkerListChanged(
      List<CustomMarker> oldMarkers, List<CustomMarker> newMarkers) {
    if (oldMarkers.length != newMarkers.length) return true;

    for (int i = 0; i < oldMarkers.length; i++) {
      if (oldMarkers[i] != newMarkers[i]) {
        return true;
      }
    }

    return false;
  }

  Future<void> _updateCircleMarkers(covariant MapBoxView oldWidget) async {
    if (circleAnnotationManager == null) return;

    final tolerance = 0.001;
    List<CircleMarker> newCircles = widget.circleMarkers;
    List<CircleMarker> oldCircles = oldWidget.circleMarkers;

    List<CircleMarker> deleted = [];
    List<CircleMarker> updated = [];
    List<CircleMarker> added = [];

    for (final circle in newCircles) {
      if (!oldCircles.any((oldCircle) =>
          oldCircle.position.distanceTo(circle.position) < tolerance)) {
        added.add(circle);
      }
    }

    for (final oldCircle in oldCircles) {
      bool found = false;
      for (final newCircle in newCircles) {
        if (oldCircle.position.distanceTo(newCircle.position) < tolerance) {
          found = true;
          updated.add(newCircle);
          break;
        }
      }
      if (!found) {
        deleted.add(oldCircle);
      }
    }

    if (deleted.isNotEmpty) {
      for (var circle in deleted) {
        var annotationToRemove = currentCircleAnnotations.firstWhereOrNull(
          (annotation) =>
              annotation?.geometry.coordinates.lat ==
                  circle.position.latitude &&
              annotation?.geometry.coordinates.lng == circle.position.longitude,
        );

        if (annotationToRemove != null) {
          await circleAnnotationManager?.delete(annotationToRemove);
          currentCircleAnnotations.remove(annotationToRemove);
        }
      }
    }

    if (updated.isNotEmpty) {
      for (var circle in updated) {
        var annotationToUpdate = currentCircleAnnotations.firstWhereOrNull(
          (annotation) =>
              annotation?.geometry.coordinates.lat ==
                  circle.position.latitude &&
              annotation?.geometry.coordinates.lng == circle.position.longitude,
        );
        if (annotationToUpdate != null) {
          await circleAnnotationManager?.delete(annotationToUpdate);
          currentCircleAnnotations.remove(annotationToUpdate);
        }
      }
      var newAnnotations = parser.parseCircleMarkers(updated);
      var updatedAnnotations =
          await circleAnnotationManager!.createMulti(newAnnotations);
      currentCircleAnnotations.addAll(updatedAnnotations);
    }

    if (added.isNotEmpty) {
      var newAnnotations = parser.parseCircleMarkers(added);
      var addedAnnotations =
          await circleAnnotationManager!.createMulti(newAnnotations);
      currentCircleAnnotations.addAll(addedAnnotations);
    }
  }

  void redrawCircles() async {
    if (circleAnnotationManager == null) return;
    await circleAnnotationManager?.deleteAll();

    currentCircleAnnotations.clear();
    List<mapbox.CircleAnnotationOptions> circleAnnotations =
        parser.parseCircleMarkers(widget.circleMarkers);
    var annotations =
        await circleAnnotationManager!.createMulti(circleAnnotations);
    currentCircleAnnotations.addAll(annotations);
  }

  int _lastUpdateId = 0;

  Future<void> _updateMarkers(covariant MapBoxView oldWidget) async {
    if (pointAnnotationManager == null) return;

    final int currentUpdateId = ++_lastUpdateId;
    final tolerance = 0.001;

    List<CustomMarker> markersList = widget.markers;
    List<CustomMarker> oldMarkersList = oldWidget.markers;

    List<CustomMarker> deleted = <CustomMarker>[];
    final List<CustomMarker> updated = <CustomMarker>[];
    final List<CustomMarker> added = <CustomMarker>[];

    // Detect added
    for (final point1 in markersList) {
      bool found = false;
      for (final point2 in oldMarkersList) {
        if (point1 == point2 ||
            point1.position.distanceTo(point2.position) < tolerance) {
          found = true;
          break;
        }
      }
      if (!found) {
        added.add(point1);
      }
    }

    // Add new markers
    if (added.isNotEmpty) {
      final annotationsToAdd = await parser.parseMarkersToAnnotations(added);
      if (currentUpdateId != _lastUpdateId) return;

      final pointAnnotations =
          await pointAnnotationManager?.createMulti(annotationsToAdd);
      if (currentUpdateId != _lastUpdateId) return;

      currentPointAnnotations.addAll(pointAnnotations!);
    }

    // Detect deleted and updated
    for (final oldMarker in oldMarkersList) {
      bool found = false;

      for (final newMarker in markersList) {
        final positionCloseEnough =
            oldMarker.position.distanceTo(newMarker.position) < tolerance;

        if (positionCloseEnough) {
          found = true;

          if (oldMarker != newMarker) {
            updated.add(newMarker);
          }

          break;
        }
      }

      if (!found) {
        deleted.add(oldMarker);
      }
    }

    // Delete removed markers
    if (deleted.isNotEmpty) {
      for (var marker in deleted) {
        var annotationToRemove = currentPointAnnotations.firstWhereOrNull(
          (annotation) =>
              annotation?.geometry.coordinates.lat ==
                  marker.position.latitude &&
              annotation?.geometry.coordinates.lng == marker.position.longitude,
        );

        if (annotationToRemove != null) {
          await pointAnnotationManager?.delete(annotationToRemove);
          if (currentUpdateId != _lastUpdateId) return;

          currentPointAnnotations.remove(annotationToRemove);
        }
      }
    }

    // Update changed markers
    if (updated.isNotEmpty) {
      for (var marker in updated) {
        var annotationToUpdate = currentPointAnnotations.firstWhereOrNull(
          (annotation) =>
              annotation?.geometry.coordinates.lat ==
                  marker.position.latitude &&
              annotation?.geometry.coordinates.lng == marker.position.longitude,
        );

        if (annotationToUpdate != null) {
          await pointAnnotationManager?.delete(annotationToUpdate);
          if (currentUpdateId != _lastUpdateId) return;

          currentPointAnnotations.remove(annotationToUpdate);
        }
      }

      final newAnnotations = await parser.parseMarkersToAnnotations(updated);
      if (currentUpdateId != _lastUpdateId) return;

      final updatedAnnotations =
          await pointAnnotationManager!.createMulti(newAnnotations);
      if (currentUpdateId != _lastUpdateId) return;

      currentPointAnnotations.addAll(updatedAnnotations);
    }
  }

  Future<void> _updatePolylines(covariant MapBoxView oldWidget) async {
    if (polylineAnnotationManager == null) {
      return;
    }

    List<PolyLineLayer> newPolylines = widget.polylines;
    List<PolyLineLayer> oldPolylines = oldWidget.polylines;

    List<PolyLineLayer> deleted = [];
    List<PolyLineLayer> updated = [];
    List<PolyLineLayer> added = [];

    for (final polyline in newPolylines) {
      if (!oldPolylines.contains(polyline)) {
        added.add(polyline);
      }
    }

    for (final oldPolyline in oldPolylines) {
      if (!newPolylines.contains(oldPolyline)) {
        deleted.add(oldPolyline);
      } else {
        updated.add(oldPolyline);
      }
    }

    if (deleted.isNotEmpty) {
      for (var polyline in deleted) {
        var annotationToRemove = currentPolylineAnnotations.firstWhereOrNull(
          (annotation) => ListEquality().equals(
            annotation?.geometry.coordinates
                .map(
                  (e) => LatLng(
                    e.lat.toDouble(),
                    e.lng.toDouble(),
                  ),
                )
                .toList(),
            polyline.points,
          ),
        );

        if (annotationToRemove != null) {
          await polylineAnnotationManager?.delete(annotationToRemove);
          currentPolylineAnnotations.remove(annotationToRemove);
        }
      }
    }

    if (updated.isNotEmpty) {
      for (var polyline in updated) {
        var annotationToUpdate = currentPolylineAnnotations.firstWhereOrNull(
          (annotation) => ListEquality().equals(
            annotation?.geometry.coordinates
                .map(
                  (e) => LatLng(
                    e.lat.toDouble(),
                    e.lng.toDouble(),
                  ),
                )
                .toList(),
            polyline.points,
          ),
        );
        if (annotationToUpdate != null) {
          await polylineAnnotationManager?.delete(annotationToUpdate);
          currentPolylineAnnotations.remove(annotationToUpdate);
        }
      }

      var newAnnotations = parser.parsePolyLines(updated);
      var updatedAnnotations =
          await polylineAnnotationManager!.createMulti(newAnnotations);
      currentPolylineAnnotations.addAll(updatedAnnotations);
    }

    if (added.isNotEmpty) {
      var newAnnotations = parser.parsePolyLines(added);
      var addedAnnotations =
          await polylineAnnotationManager!.createMulti(newAnnotations);
      currentPolylineAnnotations.addAll(addedAnnotations);
    }
  }

  // Future<void> _moveToCurrentLocation() async {
  //   geolocator.LocationPermission permission =
  //       await geolocator.Geolocator.requestPermission();
  //   if (permission == geolocator.LocationPermission.denied ||
  //       permission == geolocator.LocationPermission.deniedForever) {
  //     geolocator.Geolocator.openAppSettings();
  //     return;
  //   }

  //   geolocator.Position position =
  //       await geolocator.Geolocator.getCurrentPosition();
  //   (await mapboxMapController.controller).flyTo(
  //     mapbox.CameraOptions(
  //       center: mapbox.Point(
  //         coordinates: geotypes.Position(
  //           position.longitude,
  //           position.latitude,
  //         ),
  //       ),
  //       zoom: 14.0,
  //     ),
  //     mapbox.MapAnimationOptions(duration: 1000),
  //   );
  // }

  Future<void> _onMapCreated(mapbox.MapboxMap mapboxMap) async {
    mapboxMapController.mapController.complete(mapboxMap);
    await mapboxMap.logo.updateSettings(
      mapbox.LogoSettings(
        enabled: true,
        marginBottom: widget.buttonsPadding.bottom,
        marginLeft: widget.buttonsPadding.left,
        marginRight: widget.buttonsPadding.right,
        marginTop: widget.buttonsPadding.top,
      ),
    );
    await mapboxMap.location.updateSettings(
        LocationComponentSettings(enabled: widget.showMyLocation));
    widget.onControllerReady?.call(mapboxMapController);

    circleAnnotationManager =
        await mapboxMap.annotations.createCircleAnnotationManager();

    if (widget.circleMarkers.isNotEmpty) {
      List<mapbox.CircleAnnotationOptions> circleAnnotations =
          parser.parseCircleMarkers(widget.circleMarkers);

      var annotations =
          await circleAnnotationManager!.createMulti(circleAnnotations);

      currentCircleAnnotations.addAll(annotations);
    }

    polylineAnnotationManager =
        await mapboxMap.annotations.createPolylineAnnotationManager();

    if (widget.polylines.isNotEmpty) {
      List<mapbox.PolylineAnnotationOptions> polylineAnnotations =
          parser.parsePolyLines(widget.polylines);

      var polylines =
          await polylineAnnotationManager!.createMulti(polylineAnnotations);

      currentPolylineAnnotations.addAll(polylines);
    }

    pointAnnotationManager =
        await mapboxMap.annotations.createPointAnnotationManager();

    if (widget.markers.isNotEmpty) {
      List<mapbox.PointAnnotationOptions> annotations =
          await parser.parseMarkersToAnnotations(widget.markers);

      var pointAnnotations =
          await pointAnnotationManager!.createMulti(annotations);

      currentPointAnnotations.addAll(pointAnnotations);
    }

    if (widget.heatmapConfig.isNotEmpty) {
      List<mapbox.HeatmapLayer> layers =
          parser.parseHeatmap(widget.heatmapConfig);

      for (int i = 0; i < layers.length; i++) {
        await mapboxMapController.addHeatMapLayer(
          layers[i],
          widget.heatmapConfig[i].points,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return mapbox.MapWidget(
      cameraOptions: mapbox.CameraOptions(
        center: widget.initialLocation.latLng.mapboxLatLng,
        zoom: widget.initialZoom,
        padding: mapbox.MbxEdgeInsets(
          top: widget.padding.top,
          bottom: widget.padding.bottom,
          left: widget.padding.left,
          right: widget.padding.right,
        ),
      ),
      styleUri: widget.options.style.styleId,
      onMapCreated: _onMapCreated,
      androidHostingMode: mapbox.AndroidPlatformViewHostingMode.HC,
      onMapIdleListener: (mapIdleEventData) {},
      onCameraChangeListener: (mapbox.CameraChangedEventData event) async {
        // Apply debounce to camera changes
        _debounceTimer?.cancel();
        final latLng = event.cameraState.center.latLng;
        final bounds = await mapboxMapController.getViewportBounds();
        widget.onMapMoved?.call(
            latLng, event.cameraState.zoom, bounds, MapMoveEventType.start);
        _debounceTimer = Timer(const Duration(milliseconds: 500), () async {
          parser.setZoomLevel(event.cameraState.zoom);
          redrawCircles();
          final latLng = event.cameraState.center.latLng;
          final bounds = await (await mapboxMapController.mapController.future)
              .getBounds();
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
          widget.onMapMoved?.call(latLng, event.cameraState.zoom, parsedBounds,
              MapMoveEventType.idle);
        });
      },
    );
  }
}
