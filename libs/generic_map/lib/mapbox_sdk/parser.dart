import 'dart:math' as math;
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:generic_map/interfaces/base_parser.dart';
import 'package:generic_map/interfaces/heat_map_config.dart';
import 'package:generic_map/interfaces/interfaces.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;

class MapBoxSDKParser
    implements
        BaseParser<
            mapbox.PointAnnotationOptions,
            mapbox.CircleAnnotationOptions,
            mapbox.PolylineAnnotationOptions,
            mapbox.HeatmapLayer> {
  double zoomLevel;

  MapBoxSDKParser(this.zoomLevel);

  void setZoomLevel(double zoomLevel) {
    this.zoomLevel = zoomLevel;
  }

  @override
  List<mapbox.CircleAnnotationOptions> parseCircleMarkers(
      List<CircleMarker> markers) {
    return markers.map((e) => parseCircleMarkerToMapbox(e, zoomLevel)).toList();
  }

  @override
  List<mapbox.PointAnnotationOptions> parseMarkers(
    List<CustomMarker> markers,
  ) {
    throw Exception(
      'This code is unreachable. we are using parseMarkersToAnnotations.',
    );
  }

  Future<List<mapbox.PointAnnotationOptions>> parseMarkersToAnnotations(
    List<CustomMarker> markers,
  ) async {
    return await Future.wait(
      markers.map((e) => parseMarkerToMapbox(e)),
    );
  }

  @override
  List<mapbox.PolylineAnnotationOptions> parsePolyLines(
      List<PolyLineLayer> polyLines) {
    return polyLines.map((e) => parsePolyLineToMapbox(e)).toList();
  }

  @override
  List<mapbox.HeatmapLayer> parseHeatmap(List<HeatmapConfig> heatmap) {
    return heatmap.map((e) => parseHeatmapToMapbox(e)).toList();
  }
}

Future<mapbox.PointAnnotationOptions> parseMarkerToMapbox(
    CustomMarker marker) async {
  final Uint8List markerImage = await marker.getUint8List();

  final Map<Alignment, mapbox.IconAnchor> alignmentToIconAnchor = {
    Alignment.topLeft: mapbox.IconAnchor.TOP_LEFT,
    Alignment.topCenter: mapbox.IconAnchor.TOP,
    Alignment.topRight: mapbox.IconAnchor.TOP_RIGHT,
    Alignment.centerLeft: mapbox.IconAnchor.LEFT,
    Alignment.center: mapbox.IconAnchor.CENTER,
    Alignment.centerRight: mapbox.IconAnchor.RIGHT,
    Alignment.bottomLeft: mapbox.IconAnchor.BOTTOM_LEFT,
    Alignment.bottomCenter: mapbox.IconAnchor.BOTTOM,
    Alignment.bottomRight: mapbox.IconAnchor.BOTTOM_RIGHT,
  };

  return mapbox.PointAnnotationOptions(
    geometry: mapbox.Point(
      coordinates:
          mapbox.Position(marker.position.longitude, marker.position.latitude),
    ),
    image: markerImage,
    iconAnchor: alignmentToIconAnchor[marker.alignment],
    iconRotate: marker.rotation.toDouble(),
  );
}

mapbox.CircleAnnotationOptions parseCircleMarkerToMapbox(
    CircleMarker marker, double zoomLevel) {
  final radiusInMeters = marker.radius;
  final pixels = radiusInMeters /
      (156543.03392 *
          math.cos(marker.position.latitude * math.pi / 180) /
          math.pow(2, zoomLevel));
  return mapbox.CircleAnnotationOptions(
    geometry: mapbox.Point(
      coordinates: mapbox.Position(
        marker.position.longitude,
        marker.position.latitude,
      ),
    ),
    circleRadius: pixels,
    circleColor: colorToInt(
      marker.color ?? Colors.blue,
    ),
    circleStrokeColor: colorToInt(
      marker.borderColor ?? Colors.yellow,
    ),
    circleStrokeWidth: marker.borderWidth ?? 5.0,
  );
}

mapbox.PolylineAnnotationOptions parsePolyLineToMapbox(PolyLineLayer polyLine) {
  return mapbox.PolylineAnnotationOptions(
    geometry: mapbox.LineString(
      coordinates: polyLine.points
          .map(
            (p) => mapbox.Position(
              p.longitude,
              p.latitude,
            ),
          )
          .toList(),
    ),
    lineColor: colorToInt(
      polyLine.color ?? Colors.blue,
    ),
    lineWidth: polyLine.width ?? 5.0,
  );
}

mapbox.HeatmapLayer parseHeatmapToMapbox(HeatmapConfig heatmap) {
  return mapbox.HeatmapLayer(
    id: generateHeatmapLayerId(heatmap),
    sourceId: generateHeatmapSourceId(heatmap),
    heatmapRadius: heatmap.heatmapRadius,
    heatmapOpacity: heatmap.heatmapOpacity,
    heatmapIntensity: heatmap.heatmapIntensity,
    heatmapWeightExpression: heatmap.getHeatmapWeightExpression(),
    heatmapColorExpression: heatmap.getHeatmapColorExpression(),
  );
}

String generateHeatmapSourceId(HeatmapConfig heatmapConfig) {
  return 'heatmap-source-${heatmapConfig.hashCode}';
}

String generateHeatmapLayerId(HeatmapConfig heatmapConfig) {
  return 'heatmap-layer-${heatmapConfig.hashCode}';
}

int colorToInt(Color color) {
  return color.toARGB32();
}
