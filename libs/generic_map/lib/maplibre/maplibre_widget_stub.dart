import 'package:flutter/material.dart';
import 'package:generic_map/generic_map.dart';
import 'package:generic_map/interfaces/heat_map_config.dart';
import 'package:latlong2/latlong.dart' as latlng;

class MapLibreView extends StatefulWidget {
  final Function(latlng.LatLng latLng, double zoom, LatLngBounds bounds,
      MapMoveEventType eventType)? onMapMoved;
  final bool interactive;
  final Place initialLocation;
  final List<CircleMarker> circleMarkers;
  final dynamic options;
  final List<PolyLineLayer> polylines;
  final List<CustomMarker> markers;

  final EdgeInsets padding;
  final EdgeInsets buttonsPadding;
  final List<HeatmapConfig> heatmapConfig;
  final double initialZoom;
  final bool showMyLocation;
  final Function(MapViewController)? onControllerReady;

  const MapLibreView({
    super.key,
    required this.initialLocation,
    required this.onMapMoved,
    required this.interactive,
    required this.circleMarkers,
    required this.polylines,
    required this.markers,
    required this.options,
    required this.initialZoom,
    required this.padding,
    required this.buttonsPadding,
    required this.heatmapConfig,
    required this.showMyLocation,
    required this.onControllerReady,
  });

  @override
  State<MapLibreView> createState() => _MapLibreViewState();
}

class _MapLibreViewState extends State<MapLibreView> {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.grey[300],
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.map_outlined,
              size: 64,
              color: Colors.grey,
            ),
            SizedBox(height: 16),
            Text(
              'MapLibre not supported on this platform',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
