// import 'package:flutter/material.dart';
// import 'package:generic_map/interfaces/heat_map_config.dart';
// import 'package:generic_map/interfaces/map_controller.dart';
// import 'package:latlong2/latlong.dart' as latlng;
// import 'package:maplibre_gl/maplibre_gl.dart';

// class MaplibreController extends MapViewController {
//   final MapLibreMapController mapController;
//   final EdgeInsets padding;

//   MaplibreController({
//     required this.mapController,
//     required this.padding,
//   });

//   @override
//   void moveCamera(latlng.LatLng location, double? zoom) async {
//     final desiredZoom =
//         zoom ?? mapController.cameraPosition?.zoom.toDouble() ?? 16;
//     final cameraOptions = CameraUpdate.newLatLngZoom(
//       LatLng(
//         location.latitude,
//         location.longitude,
//       ),
//       desiredZoom,
//     );

//     mapController.moveCamera(cameraOptions);
//   }

//   @override
//   void fitBounds(List<latlng.LatLng> points) {
//     if (points.length < 2) {
//       return;
//     }

//     double minLat =
//         points.map((e) => e.latitude).reduce((a, b) => a < b ? a : b);
//     double maxLat =
//         points.map((e) => e.latitude).reduce((a, b) => a > b ? a : b);
//     double minLng =
//         points.map((e) => e.longitude).reduce((a, b) => a < b ? a : b);
//     double maxLng =
//         points.map((e) => e.longitude).reduce((a, b) => a > b ? a : b);

//     LatLngBounds bounds = LatLngBounds(
//       southwest: LatLng(minLat, minLng),
//       northeast: LatLng(maxLat, maxLng),
//     );

//     final CameraUpdate cameraUpdate = CameraUpdate.newLatLngBounds(bounds,
//         left: padding.left,
//         top: padding.top,
//         right: padding.right,
//         bottom: padding.bottom);

//     mapController.animateCamera(cameraUpdate);
//   }

//   Future<void> addHeatMapLayer(
//       HeatmapConfig heatmapConfigs, HeatmapLayerProperties layer) async {
//     final heatmapSourceId = "heatmap-source-${heatmapConfigs.hashCode}";
//     final heatmapLayerId = "heatmap-layer-${heatmapConfigs.hashCode}";

//     final heatMapData = _generateHeatMapGeoJson(heatmapConfigs.points);

//     await mapController.addSource(
//       heatmapSourceId,
//       GeojsonSourceProperties(
//         data: heatMapData,
//       ),
//     );

//     await mapController.addLayer(
//       heatmapSourceId,
//       heatmapLayerId,
//       layer,
//     );
//   }

//   Map<String, dynamic> _generateHeatMapGeoJson(List<latlng.LatLng> points) {
//     return {
//       "type": "FeatureCollection",
//       "features": points.map((point) {
//         return {
//           "type": "Feature",
//           "geometry": {
//             "type": "Point",
//             "coordinates": [point.longitude, point.latitude]
//           },
//           "properties": {}
//         };
//       }).toList()
//     };
//   }

//   @override
//   Future<latlng.LatLng> getCenter() async {
//     final cameraState = latlng.LatLng(
//         mapController.cameraPosition!.target.latitude,
//         mapController.cameraPosition!.target.longitude);
//     return cameraState;
//   }

//   @override
//   void dispose() {
//     mapController.dispose();
//   }
// }
