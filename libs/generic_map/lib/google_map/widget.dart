import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map_line_editor/flutter_map_line_editor.dart';
import 'package:generic_map/google_map/options.dart';
import 'package:generic_map/interfaces/heat_map_config.dart';
import 'package:generic_map/widget.dart';
import 'package:gm_google_maps_flutter/google_maps_flutter.dart' hide LatLngBounds;
import 'package:generic_map/interfaces/interfaces.dart';
import 'package:generic_map/google_map/parser.dart';
import 'package:generic_map/google_map/controller.dart';
import 'package:generic_map/extensions.dart';
import 'package:latlong2/latlong.dart' as latlong;

class GoogleMapView extends StatefulWidget {
  final MapViewMode mode;
  final bool interactive;
  final GoogleMapsOptions? options;
  final Function(latlong.LatLng latLng, double zoom, LatLngBounds bounds,
      MapMoveEventType eventType)? onMapMoved;
  final Place initialLocation;
  final double initialZoom;
  final List<PolyLineLayer> polylines;
  final List<CustomMarker> markers;
  final List<CircleMarker> circleMarkers;
  final List<HeatmapConfig> heatmapConfig;

  final Function(MapViewController)? onControllerReady;
  final EdgeInsets padding;
  final EdgeInsets buttonsPadding;
  final Size viewportSize;
  final bool showMyLocation;
  final Function(String polylineId, List<latlong.LatLng> points)?
      onPolylineEdited;
  final bool isPolylineDrawEnabled;
  final Function(List<latlong.LatLng>)? onPolylineDrawn;
  final PolyEditor? polyEditor;

  const GoogleMapView({
    super.key,
    required this.initialLocation,
    required this.initialZoom,
    required this.polylines,
    required this.mode,
    this.onControllerReady,
    required this.onMapMoved,
    required this.interactive,
    required this.padding,
    required this.buttonsPadding,
    required this.markers,
    required this.circleMarkers,
    required this.options,
    required this.viewportSize,
    required this.heatmapConfig,
    required this.showMyLocation,
    this.onPolylineEdited,
    this.isPolylineDrawEnabled = false,
    this.onPolylineDrawn,
    this.polyEditor,
  });

  @override
  State<GoogleMapView> createState() => _GoogleMapViewState();
}

class _GoogleMapViewState extends State<GoogleMapView> {
  late GoogleMapsController controller;
  final parser = GoogleMapParser();
  CameraPosition? cameraPosition;
  final Set<Marker> markers = {};
  final Set<Circle> circles = {};
  final Set<Polyline> polylines = {};
  final Set<Heatmap> heatmaps = {};
  String? _mapStyle;
  bool _styleLoading = false;

  /// Whether a `GoogleMap` has been built at least once.
  ///
  /// Blanking the map while a style loads is only acceptable before anything
  /// has been shown. On a *re*load it unmounts the live `GoogleMap` and the
  /// remount restarts it at `initialCameraPosition` — throwing away wherever
  /// the user had panned, and any camera the host had moved. `GoogleMap` takes
  /// `style` as a parameter, so a style swap needs no remount at all.
  bool _hasBuiltMap = false;

  static const _drawingPolygonId = PolygonId('__generic_map_drawing__');
  final List<LatLng> _drawingPoints = [];

  @override
  void initState() {
    controller = GoogleMapsController(
      padding: widget.padding,
      viewportSize: widget.viewportSize,
    );
    if (widget.polyEditor != null) {
      _drawingPoints.addAll(
        widget.polyEditor!.points.map((e) => e.toGoogleMapLatLng()),
      );
    }
    _loadMapStyle();
    super.initState();
  }

  Future<void> _loadMapStyle() async {
    final options = widget.options;
    if (options == null || !options.hasStyle) {
      setState(() {
        _mapStyle = null;
        _styleLoading = false;
      });
      return;
    }

    // Priority: customStyleJson > preset > cloudMapId
    if (options.customStyleJson != null) {
      setState(() {
        _mapStyle = options.customStyleJson;
        _styleLoading = false;
      });
    } else if (options.preset != null) {
      setState(() => _styleLoading = true);
      try {
        final styleJson =
            await rootBundle.loadString(options.preset!.assetPath);
        if (!mounted) return;
        setState(() {
          _mapStyle = styleJson;
          _styleLoading = false;
        });
      } catch (e) {
        debugPrint('Failed to load map style preset: $e');
        if (!mounted) return;
        setState(() {
          _mapStyle = null;
          _styleLoading = false;
        });
      }
    } else {
      // Only cloudMapId is set — no style JSON to load
      setState(() {
        _mapStyle = null;
        _styleLoading = false;
      });
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant GoogleMapView oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.options != oldWidget.options) {
      _loadMapStyle();
    }
    if (_hasMarkerListChanged(widget.markers, oldWidget.markers)) {
      _updateMarkers(oldWidget);
    }
    // Compared element-wise, not by identity. Callers build these lists inline
    // in `build`, so a fresh-but-identical list arrives every rebuild and an
    // identity check would fire `setState` from `didUpdateWidget` on each one.
    if (!listEquals(widget.circleMarkers, oldWidget.circleMarkers)) {
      _updateCircles();
    }
    if (!listEquals(widget.polylines, oldWidget.polylines)) {
      _updatePolylines();
    }
    if (widget.heatmapConfig != oldWidget.heatmapConfig) {
      _updateHeatmap();
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

  int _lastUpdateId = 0;
  void _updateMarkers(covariant GoogleMapView oldWidget) async {
    final int currentUpdateId = ++_lastUpdateId;
    final newMarkersList =
        await Future.wait(parser.parseMarkers(widget.markers));
    if (currentUpdateId != _lastUpdateId) return;

    // Index existing by id
    final existingById = {for (final m in markers) m.markerId.value: m};

    // Build the new Set, replacing by id
    final Set<Marker> next = <Marker>{};
    for (final m in newMarkersList) {
      next.add(m); // same id -> replaces logically
      existingById.remove(m.markerId.value); // mark as kept
    }
    // Any leftover in existingById are deletions (we just don't carry them over)

    setState(() {
      markers
        ..clear()
        ..addAll(next);
    });
  }

  void _updateCircles() async {
    setState(() {
      circles.clear();
      circles.addAll(
        parser.parseCircleMarkers(
          widget.circleMarkers,
        ),
      );
    });
  }

  void _updatePolylines() async {
    setState(() {
      polylines.clear();
      polylines.addAll(
        _parsePolylinesWithCallbacks(),
      );
    });
  }

  List<Polyline> _parsePolylinesWithCallbacks() {
    final parsed = parser.parsePolyLines(widget.polylines);
    final hasEditCallback =
        widget.onPolylineEdited != null || widget.onPolylineDrawn != null;
    if (!hasEditCallback && !widget.isPolylineDrawEnabled) return parsed;
    return List.generate(parsed.length, (i) {
      final p = parsed[i];
      final source = widget.polylines[i];
      final bool isEditable = source.editable || widget.isPolylineDrawEnabled;
      if (!isEditable) return p;
      return p.copyWith(
        editableParam: true,
        onEditedParam: (List<LatLng> points) {
          final converted = points.map((e) => e.toLatLng()).toList();
          widget.onPolylineEdited?.call(
            source.id ?? source.points.toString(),
            converted,
          );
          widget.onPolylineDrawn?.call(converted);
        },
      );
    });
  }

  void _updateHeatmap() async {
    setState(() {
      heatmaps.clear();
      heatmaps.addAll(
        parser.parseHeatmap(
          widget.heatmapConfig,
        ),
      );
    });
  }

  Set<Polygon> _buildDrawingPolygons() {
    if (!widget.isPolylineDrawEnabled || _drawingPoints.isEmpty) {
      return const {};
    }
    final fillColor = Theme.of(context).colorScheme.primary;
    return {
      Polygon(
        polygonId: _drawingPolygonId,
        points: List<LatLng>.unmodifiable(_drawingPoints),
        fillColor: fillColor.withValues(alpha: 0.3),
        strokeColor: fillColor,
        strokeWidth: 2,
        editable: true,
        onEdited: (points, _) {
          setState(() {
            _drawingPoints
              ..clear()
              ..addAll(points);
          });
          widget.onPolylineDrawn
              ?.call(points.map((e) => e.toLatLng()).toList());
        },
      ),
    };
  }

  void _onMapTapped(LatLng latLng) {
    if (!widget.isPolylineDrawEnabled) return;
    setState(() {
      _drawingPoints.add(latLng);
    });
    widget.onPolylineDrawn
        ?.call(_drawingPoints.map((e) => e.toLatLng()).toList());
  }

  @override
  Widget build(BuildContext context) {
    // Only the very first load may blank: there is nothing to preserve yet.
    // Afterwards the existing map stays mounted and simply restyles.
    if (_styleLoading && !_hasBuiltMap) {
      return const SizedBox.shrink();
    }
    _hasBuiltMap = true;
    return GoogleMap(
      style: _mapStyle,
      mapId: _mapStyle != null ? null : widget.options?.cloudMapId,
      padding: widget.buttonsPadding,
      scrollGesturesEnabled: widget.interactive,
      zoomGesturesEnabled: widget.interactive,
      myLocationButtonEnabled: false,
      myLocationEnabled: widget.showMyLocation,
      zoomControlsEnabled: false,
      tiltGesturesEnabled: widget.interactive,
      minMaxZoomPreference: const MinMaxZoomPreference(3, 20),
      compassEnabled: false,
      mapToolbarEnabled: false,
      rotateGesturesEnabled: widget.interactive,
      onTap: _onMapTapped,
      onMapCreated: (mapController) async {
        if (widget.onControllerReady != null) {
          widget.onControllerReady!(controller);
        }
        controller.mapController.complete(mapController);

        if (widget.markers.isNotEmpty) {
          final newMarkers = await Future.wait(
            parser.parseMarkers(widget.markers),
          );

          setState(() {
            markers.addAll(newMarkers.toSet());
          });
        }

        if (widget.circleMarkers.isNotEmpty) {
          circles.addAll(
            parser.parseCircleMarkers(
              widget.circleMarkers,
            ),
          );
        }

        if (widget.polylines.isNotEmpty) {
          polylines.addAll(
            _parsePolylinesWithCallbacks(),
          );
        }
        if (widget.heatmapConfig.isNotEmpty) {
          heatmaps.addAll(
            parser.parseHeatmap(
              widget.heatmapConfig,
            ),
          );
        }
      },
      onCameraMoveStarted: () async {
        if (cameraPosition == null) return;
        final bounds = await controller.getViewportBounds();
        widget.onMapMoved?.call(cameraPosition!.target.toLatLng(),
            cameraPosition!.zoom, bounds, MapMoveEventType.start);
      },
      onCameraIdle: () async {
        if (cameraPosition == null) return;

        final bounds = await controller.getViewportBounds();
        widget.onMapMoved?.call(cameraPosition!.target.toLatLng(),
            cameraPosition!.zoom, bounds, MapMoveEventType.idle);
      },
      onCameraMove: widget.mode != MapViewMode.picker
          ? null
          : (position) => cameraPosition = position,
      markers: markers,
      circles: circles,
      polylines: polylines,
      polygons: _buildDrawingPolygons(),
      heatmaps: heatmaps,
      initialCameraPosition: CameraPosition(
        target: widget.initialLocation.latLng.toGoogleMapLatLng(),
        zoom: widget.initialZoom,
      ),
    );
  }
}
