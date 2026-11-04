import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart' as fmap;
import 'package:flutter_map_heatmap_plus/flutter_map_heatmap.dart';
import 'package:generic_map/interfaces/base_parser.dart';
import 'package:generic_map/interfaces/heat_map_config.dart';
import 'package:generic_map/interfaces/interfaces.dart';

import 'dart:math' as math;

import 'package:latlong2/latlong.dart';

class FlutterMapParser
    implements
        BaseParser<fmap.Marker, fmap.CircleMarker, fmap.Polyline,
            HeatMapLayer> {
  @override
  List<fmap.CircleMarker> parseCircleMarkers(List<CircleMarker> marker) {
    return marker.map((e) => parseCircleMarkerToFMap(e)).toList();
  }

  @override
  List<fmap.Marker> parseMarkers(List<CustomMarker> marker) {
    return marker.map((e) => parseMarkerToFMap(e)).toList();
  }

  @override
  List<fmap.Polyline> parsePolyLines(List<PolyLineLayer> polyLine) {
    return polyLine.map((e) => parsePolyLineToFMap(e)).nonNulls.toList();
  }

  @override
  List<HeatMapLayer> parseHeatmap(List<HeatmapConfig> heatmap) {
    return heatmap.map((e) => parseHeatMapToFMap(e)).toList();
  }
}

class MapBoxProvider
    implements
        BaseParser<fmap.Marker, fmap.CircleMarker, fmap.Polyline,
            HeatmapConfig> {
  final String secretKey;
  final String userId;
  final String tileSetId;

  MapBoxProvider({
    required this.secretKey,
    required this.userId,
    required this.tileSetId,
  });

  @override
  List<fmap.CircleMarker> parseCircleMarkers(List<CircleMarker> marker) {
    return marker.map((e) => parseCircleMarkerToFMap(e)).toList();
  }

  @override
  List<fmap.Marker> parseMarkers(List<CustomMarker> marker) {
    return marker.map((e) => parseMarkerToFMap(e)).toList();
  }

  @override
  List<fmap.Polyline> parsePolyLines(List<PolyLineLayer> polyLine) {
    return polyLine.map((e) => parsePolyLineToFMap(e)).nonNulls.toList();
  }

  @override
  List<HeatmapConfig> parseHeatmap(List<HeatmapConfig> heatmap) {
    // We do not need to parse heatmap for flutter_map provider. The conversion happens withing the widget
    throw Exception(
      'This code is unreachable. we are using parseHeatmapToFMap.',
    );
  }
}

fmap.Marker parseMarkerToFMap(CustomMarker marker) {
  return fmap.Marker(
    point: LatLng(marker.position.latitude, marker.position.longitude),
    child: Transform.rotate(
      angle: marker.rotation.toDouble() * math.pi / 180,
      child: marker.widget,
    ),
    width: marker.width,
    height: marker.height,
    alignment: marker.alignment,
  );
}

fmap.CircleMarker parseCircleMarkerToFMap(CircleMarker marker) {
  return fmap.CircleMarker(
    point: marker.position,
    color: marker.color ?? Colors.blue,
    borderColor: marker.borderColor ?? Colors.yellow,
    borderStrokeWidth: marker.borderWidth ?? 5,
    radius: marker.radius,
    useRadiusInMeter: true,
  );
}

fmap.Polyline? parsePolyLineToFMap(PolyLineLayer polyLine) {
  if (polyLine.points.length < 2) {
    return null; // A polyline requires at least two points
  }
  return fmap.Polyline(
    points: polyLine.points,
    gradientColors: polyLine.gradientColors,
    color: polyLine.color ?? Colors.blue,
    strokeWidth: polyLine.width ?? 5,
  );
}

HeatMapLayer parseHeatMapToFMap(HeatmapConfig config) {
  return HeatMapLayer(
    tileDisplay: fmap.TileDisplay.fadeIn(),
    heatMapDataSource: InMemoryHeatMapDataSource(
      data: config.points
          .map((point) => WeightedLatLng(point, config.heatmapIntensity))
          .toList(),
    ),
    heatMapOptions: HeatMapOptions(
      layerOpacity: config.heatmapOpacity,
      radius: config.heatmapRadius,
      gradient: convertToGradientMap(
        config.stops,
        config.colors,
      ),
    ),
  );
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
