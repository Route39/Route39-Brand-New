// import 'dart:typed_data';
// import 'package:flutter/material.dart';
// import 'package:generic_map/interfaces/base_parser.dart';
// import 'package:generic_map/interfaces/heat_map_config.dart';
// import 'package:generic_map/interfaces/interfaces.dart';
// import 'package:maplibre_gl/maplibre_gl.dart';

// class MapLibreParser
//     implements
//         BaseParser<Symbol, CircleOptions, LineOptions, HeatmapLayerProperties> {
//   MapLibreParser();

//   @override
//   List<CircleOptions> parseCircleMarkers(List<CircleMarker> markers) {
//     return markers.map((e) => parseCircleMarkerToMapLibre(e)).toList();
//   }

//   @override
//   List<Symbol> parseMarkers(
//     List<CustomMarker> markers,
//   ) {
//     throw Exception(
//       'This code is unreachable. we are using parseMarkersToAnnotations.',
//     );
//   }

//   Future<List<SymbolOptions>> parseMarkersToAnnotations(
//     List<CustomMarker> markers,
//     MapLibreMapController controller,
//   ) async {
//     return await Future.wait(
//       markers.map(
//         (e) => parseMarkerToMapLibre(e, controller),
//       ),
//     );
//   }

//   @override
//   List<LineOptions> parsePolyLines(List<PolyLineLayer> polyLines) =>
//       polyLines.map((e) => parsePolyLineToMapLibre(e)).toList();

//   @override
//   List<HeatmapLayerProperties> parseHeatmap(List<HeatmapConfig> heatmap) =>
//       heatmap.map((e) => parseHeatmapToMapLibre(e)).toList();
// }

// Future<SymbolOptions> parseMarkerToMapLibre(
//   CustomMarker marker,
//   MapLibreMapController controller,
// ) async {
//   final Uint8List markerImage = await marker.getUint8List();
//   String imageName =
//       "marker_${marker.position.latitude}_${marker.position.longitude}";

//   await controller.addImage(imageName, markerImage);
//   return SymbolOptions(
//     geometry: LatLng(marker.position.latitude, marker.position.longitude),
//     iconImage: imageName,
//     iconSize: 1.0,
//     iconAnchor: _getIconAnchor(marker.alignment),
//   );
// }

// String _getIconAnchor(Alignment alignment) {
//   if (alignment == Alignment.center) return "center";
//   if (alignment == Alignment.topLeft) return "bottom-left";
//   if (alignment == Alignment.topRight) return "bottom-right";
//   if (alignment == Alignment.bottomLeft) return "top-left";
//   if (alignment == Alignment.bottomRight) return "top-right";
//   if (alignment == Alignment.topCenter) return "bottom";
//   if (alignment == Alignment.bottomCenter) return "top";
//   if (alignment == Alignment.centerLeft) return "left";
//   if (alignment == Alignment.centerRight) return "right";
//   return "center";
// }

// CircleOptions parseCircleMarkerToMapLibre(CircleMarker marker) {
//   return CircleOptions(
//     geometry: LatLng(
//       marker.position.latitude,
//       marker.position.longitude,
//     ),
//     circleRadius: marker.radius.toDouble(),
//     circleColor: colorToString(marker.color ?? Colors.black.withAlpha(100)),
//     circleStrokeColor: colorToString(marker.borderColor ?? Colors.black),
//     circleStrokeWidth: marker.borderWidth?.toDouble() ?? 1.0,
//   );
// }

// LineOptions parsePolyLineToMapLibre(PolyLineLayer polyLine) {
//   return LineOptions(
//     geometry:
//         polyLine.points.map((e) => LatLng(e.latitude, e.longitude)).toList(),
//     lineColor: colorToString(polyLine.color ?? Colors.black),
//     lineWidth: polyLine.width?.toDouble() ?? 2.0,
//   );
// }

// HeatmapLayerProperties parseHeatmapToMapLibre(HeatmapConfig config) {
//   return HeatmapLayerProperties(
//     heatmapRadius: config.heatmapRadius,
//     heatmapOpacity: config.heatmapOpacity,
//     heatmapIntensity: config.heatmapIntensity,
//     heatmapWeight: config.getHeatmapWeightExpression(),
//     heatmapColor: config.getHeatmapColorExpression(),
//   );
// }

// String colorToString(Color color) {
//   return '#${color.toARGB32().toString().substring(2)}';
// }
