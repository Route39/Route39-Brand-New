import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_animations/flutter_map_animations.dart';
import 'package:generic_map/flutter_map/parser.dart';
import 'package:generic_map/generic_map.dart';
import 'package:generic_map/interfaces/heat_map_config.dart';
import 'package:latlong2/latlong.dart';
import 'package:generic_map/flutter_map/controller.dart';
import '../interfaces/circle_marker.dart' as circle_marker;
import 'package:flutter_map/flutter_map.dart' as fmap;
import 'package:flutter_map_dragmarker/flutter_map_dragmarker.dart';

class FlutterMapView extends StatefulWidget {
  final Function(LatLng latLng, double zoom, LatLngBounds bounds,
      MapMoveEventType eventType)? onMapMoved;
  final MapViewMode mode;
  final bool interactive;
  final Place? initialLocation;
  final double initialZoom;
  final List<PolyLineLayer> polylines;
  final List<CustomMarker> markers;
  final Function(MapViewController)? onControllerReady;
  final EdgeInsets padding;
  final GlobalKey markerKey;
  final CenterMarker? centerMarker;
  final List<circle_marker.CircleMarker> circleMarkers;
  final bool useCachedTiles;
  final bool isPolylineDrawEnabled;
  final PolyEditor? polyEditor;
  final Function(List<LatLng>)? onPolylineDrawn;

  final MapProviderEnum provider;
  final MapboxOptions? mapboxOptions;
  final OpenStreetMapsOptions? openStreetMapOptions;
  final bool showMyLocation;

  final List<HeatmapConfig> heatmapConfig;

  const FlutterMapView({
    super.key,
    required this.initialLocation,
    required this.initialZoom,
    required this.polylines,
    required this.markers,
    required this.mode,
    this.onControllerReady,
    required this.onMapMoved,
    required this.interactive,
    required this.padding,
    required this.markerKey,
    required this.centerMarker,
    required this.circleMarkers,
    required this.useCachedTiles,
    required this.isPolylineDrawEnabled,
    required this.polyEditor,
    this.onPolylineDrawn,
    this.mapboxOptions,
    this.openStreetMapOptions,
    required this.provider,
    required this.heatmapConfig,
    required this.showMyLocation,
  });

  @override
  State<FlutterMapView> createState() => FlutterMapViewState();
}

class FlutterMapViewState extends State<FlutterMapView>
    with TickerProviderStateMixin {
  final parser = FlutterMapParser();

  late final FlutterMapController controller = FlutterMapController(
    mapController: AnimatedMapController(vsync: this),
    padding: widget.padding,
  );
  final GlobalKey mapKey = GlobalKey();
  fmap.Polygon? polygonDrawing;
  PolyEditor? polyEditor;

  @override
  void initState() {
    super.initState();
  }

  Map<double, MaterialColor> convertToGradientMap(
      List<double> stops, List<Color> colors) {
    Map<double, MaterialColor> gradientMap = {};

    for (int i = 0; i < stops.length; i++) {
      MaterialColor materialColor = _getMaterialColorFromColor(colors[i]);
      gradientMap[stops[i]] = materialColor;
    }

    return gradientMap;
  }

  MaterialColor _getMaterialColorFromColor(Color color) {
    return MaterialColor(color.toARGB32(), {
      50: color.withValues(alpha: 0.1),
      100: color.withValues(alpha: 0.2),
      200: color.withValues(alpha: 0.3),
      300: color.withValues(alpha: 0.4),
      400: color.withValues(alpha: 0.5),
      500: color.withValues(alpha: 0.6),
      600: color.withValues(alpha: 0.7),
      700: color.withValues(alpha: 0.8),
      800: color.withValues(alpha: 0.9),
      900: color.withValues(alpha: 1.0),
    });
  }

  @override
  void didChangeDependencies() {
    if (widget.polyEditor != null) {
      polygonDrawing = fmap.Polygon(
        points: widget.polyEditor?.points ?? [],
        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.5),
        borderStrokeWidth: 2,
        borderColor: Theme.of(context).colorScheme.primary,
      );
      polyEditor = PolyEditor(
        points: polygonDrawing!.points,
        pointIcon: widget.polyEditor!.pointIcon,
        intermediateIcon: widget.polyEditor?.intermediateIcon,
        pointIconSize: widget.polyEditor?.pointIconSize ?? const Size(20, 20),
        intermediateIconSize:
            widget.polyEditor?.intermediateIconSize ?? const Size(20, 20),
        callbackRefresh: (latlng) {
          setState(() {});
          widget.onPolylineDrawn?.call(polygonDrawing?.points ?? []);
        },
        addClosePathMarker: true,
      );
    }
    super.didChangeDependencies();
  }

  @override
  Widget build(BuildContext context) {
    final polylines = parser.parsePolyLines(widget.polylines).toList();
    return FlutterMap(
      key: mapKey,
      mapController: controller.mapController.mapController,
      options: MapOptions(
        maxZoom: 19,
        onTap: (position, latLng) {
          if (widget.isPolylineDrawEnabled) {
            final points = polyEditor?.add(
              polygonDrawing?.points ?? [],
              latLng,
            );
            widget.onPolylineDrawn?.call(polygonDrawing?.points ?? []);
            if (kDebugMode) {
              print('points: $points');
            }
          }
        },
        interactionOptions: InteractionOptions(
          flags:
              widget.interactive ? (InteractiveFlag.all) : InteractiveFlag.none,
        ),
        initialCenter:
            widget.initialLocation?.latLng ?? const LatLng(50.5, 30.51),
        initialZoom: widget.initialZoom,
        onMapEvent: (event) async {
          if (event is MapEventMoveStart ||
              event is MapEventDoubleTapZoomStart) {
            widget.onMapMoved?.call(event.camera.center, event.camera.zoom,
                event.camera.visibleBounds, MapMoveEventType.start);
          } else if (event is MapEventMoveEnd ||
              event is MapEventDoubleTapZoomEnd) {
            // RenderBox markerBox = widget.markerKey.currentContext
            //     ?.findRenderObject() as RenderBox;
            // Offset position = markerBox.localToGlobal(Offset.zero);
            // RenderBox mapBox =
            //     mapKey.currentContext?.findRenderObject() as RenderBox;
            // Offset mapPosition = mapBox.localToGlobal(Offset.zero);
            // final latLng = event.camera.pointToLatLng(
            //   Point(
            //     (position.dx + (markerBox.size.width / 2)) -
            //         mapPosition.dx,
            //     (position.dy + markerBox.size.height) - mapPosition.dy,
            //   ),
            // );
            if (widget.centerMarker != null) {
              final markerBox = widget.markerKey.currentContext
                  ?.findRenderObject() as RenderBox;
              final centerMarkerSize = widget.centerMarker!.size;
              final markerAlignment = widget.centerMarker!.alignment;
              final markerCenter = Offset(
                markerBox.size.width / 2,
                markerBox.size.height / 2,
              );
              final markerAlignmentOffset = Offset(
                (markerAlignment.x) * (centerMarkerSize.width / 2),
                (-markerAlignment.y) * (centerMarkerSize.height / 2),
              );
              RenderBox mapBox =
                  mapKey.currentContext?.findRenderObject() as RenderBox;
              Offset mapPosition = mapBox.localToGlobal(Offset.zero);

              Offset position = markerBox.localToGlobal(markerCenter);
              position = position + markerAlignmentOffset - mapPosition;
            }
            final latLng = event.camera.center;
            widget.onMapMoved?.call(latLng, event.camera.zoom,
                event.camera.visibleBounds, MapMoveEventType.idle);
          }
        },
        onMapReady: widget.onControllerReady != null
            ? () {
                widget.onControllerReady!(controller);
              }
            : null,
      ),
      children: [
        switch (widget.provider) {
          MapProviderEnum.openStreetMaps => widget.openStreetMapOptions!
              .tileLayer(isCacheEnabled: widget.useCachedTiles),
          MapProviderEnum.mapBox => widget.mapboxOptions!
              .tileLayer(isCacheEnabled: widget.useCachedTiles),
          _ => throw Exception(
              'This should be unreachable, flutter map only supports OpenStreetMap and MapBox static',
            )
        },
        if (polylines.isNotEmpty)
          PolylineLayer(
            polylines: polylines,
          ),
        if (widget.circleMarkers.isNotEmpty)
          CircleLayer(
            circles: parser.parseCircleMarkers(widget.circleMarkers),
          ),
        if (widget.markers.isNotEmpty)
          MarkerLayer(
            alignment: Alignment.bottomCenter,
            markers: parser.parseMarkers(widget.markers).toList(),
          ),
        if (widget.isPolylineDrawEnabled) ...[
          if (polygonDrawing?.points.isNotEmpty ?? false)
            PolygonLayer(
              polygons: [
                polygonDrawing!,
              ],
            ),
          DragMarkers(
            markers: polyEditor?.edit() ?? [],
          ),
        ],
        if (widget.heatmapConfig.isNotEmpty)
          for (var config in parser.parseHeatmap(widget.heatmapConfig)) config,
        // Disabling showing my current location for now because it interfers with the app being able to retrieve current location if fired at same time on iOS real devices.
        // if (widget.showMyLocation) CurrentLocationLayer()
      ],
    );
  }

  @override
  void dispose() {
    controller.mapController.dispose();
    super.dispose();
  }
}
