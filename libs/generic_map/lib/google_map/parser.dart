import 'package:flutter/material.dart';
import 'package:generic_map/extensions.dart';
import 'package:generic_map/interfaces/base_parser.dart';
import 'package:generic_map/interfaces/heat_map_config.dart';
import 'package:generic_map/interfaces/interfaces.dart';
import 'package:gm_google_maps_flutter/google_maps_flutter.dart';

class GoogleMapParser
    implements BaseParser<Future<Marker>, Circle, Polyline, Heatmap> {
  @override
  List<Circle> parseCircleMarkers(List<CircleMarker> marker) {
    return marker.map((e) => _parseCircleMarker(e)).toList();
  }

  Circle _parseCircleMarker(CircleMarker marker) {
    return Circle(
      circleId: CircleId(marker.id),
      center: LatLng(marker.position.latitude, marker.position.longitude),
      radius: marker.radius,
      fillColor: marker.color ?? Colors.blue,
      strokeColor: marker.borderColor ?? Colors.yellow,
      strokeWidth: marker.borderWidth?.toInt() ?? 5,
    );
  }

  @override
  List<Future<Marker>> parseMarkers(List<CustomMarker> marker) {
    return marker.map((e) => _parseMarker(e)).toList();
  }

  Future<Marker> _parseMarker(CustomMarker marker) async {
    return Marker(
      markerId: MarkerId(marker.id),
      anchor: marker.getAnchor(),
      position: LatLng(marker.position.latitude, marker.position.longitude),
      rotation: marker.rotation.toDouble(),
      icon: await marker.getBitmapDescriptor(),
    );
  }

  @override
  List<Polyline> parsePolyLines(List<PolyLineLayer> polyLine) {
    return polyLine.map((e) => _parsePolyLine(e)).toList();
  }

  Polyline _parsePolyLine(PolyLineLayer polyLine) {
    return Polyline(
      polylineId: PolylineId(polyLine.id ?? polyLine.points.toString()),
      points: polyLine.points
          .map(
            (e) => LatLng(e.latitude, e.longitude),
          )
          .toList(),
      color: polyLine.color ?? Colors.black,
      width: polyLine.width?.toInt() ?? 5,
      editable: polyLine.editable,
    );
  }

  @override
  List<Heatmap> parseHeatmap(List<HeatmapConfig> heatmap) {
    return heatmap.map((e) => _parseHeatmap(e)).toList();
  }

  Heatmap _parseHeatmap(HeatmapConfig config) {
    return Heatmap(
      heatmapId: HeatmapId(config.toString()),
      data: config.points
          .map(
            (e) => WeightedLatLng(e.toGoogleMapLatLng()),
          )
          .toList(),
      radius: HeatmapRadius.fromPixels((config.heatmapIntensity * 10).toInt()),
      opacity: config.heatmapOpacity,
    );
  }
}
