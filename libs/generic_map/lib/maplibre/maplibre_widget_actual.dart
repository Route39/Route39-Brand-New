// import 'package:collection/collection.dart';
// import 'package:flutter/material.dart';
// import 'package:generic_map/generic_map.dart';
// import 'package:generic_map/interfaces/heat_map_config.dart';
// import 'package:generic_map/interfaces/latlng_distance_to.dart';
// import 'package:generic_map/maplibre/controller.dart';
// import 'package:generic_map/maplibre/parser.dart' show MapLibreParser;
// import 'package:maplibre_gl/maplibre_gl.dart' hide LatLngBounds;
// import 'package:latlong2/latlong.dart' as latlng;

// export 'options.dart';
// export 'controller.dart';

// class MapLibreView extends StatefulWidget {
//   final Function(
//           latlng.LatLng latLng, double zoom, LatLngBounds bounds, bool isStart)?
//       onMapMoved;
//   final bool interactive;
//   final Place initialLocation;
//   final List<CircleMarker> circleMarkers;
//   final MapLibreOptions options;
//   final List<PolyLineLayer> polylines;
//   final List<CustomMarker> markers;

//   final EdgeInsets padding;
//   final EdgeInsets buttonsPadding;
//   final List<HeatmapConfig> heatmapConfig;
//   final double initialZoom;
//   final bool showMyLocation;
//   final Function(MapViewController)? onControllerReady;

//   const MapLibreView({
//     super.key,
//     required this.initialLocation,
//     required this.onMapMoved,
//     required this.interactive,
//     required this.circleMarkers,
//     required this.polylines,
//     required this.markers,
//     required this.options,
//     required this.initialZoom,
//     required this.padding,
//     required this.buttonsPadding,
//     required this.heatmapConfig,
//     required this.showMyLocation,
//     required this.onControllerReady,
//   });

//   @override
//   State<MapLibreView> createState() => _MapLibreViewState();
// }

// class _MapLibreViewState extends State<MapLibreView> {
//   MaplibreController? mapController;
//   final MapLibreParser parser = MapLibreParser();

//   @override
//   void initState() {
//     super.initState();
//   }

//   @override
//   void didUpdateWidget(covariant MapLibreView oldWidget) {
//     super.didUpdateWidget(oldWidget);

//     if (mapController != null) {
//       if (_hasMarkerListChanged(widget.markers, oldWidget.markers)) {
//         _updateMarkers(oldWidget);
//       }

//       if (widget.polylines != oldWidget.polylines) {
//         _updatePolylines();
//       }
//       if (widget.circleMarkers != oldWidget.circleMarkers) {
//         _updateCircles();
//       }

//       if (!const DeepCollectionEquality()
//           .equals(widget.heatmapConfig, oldWidget.heatmapConfig)) {
//         _updateHeatmap(oldWidget);
//       }
//     }
//   }

//   Future<void> _updateHeatmap(covariant MapLibreView oldWidget) async {
//     if (mapController == null) return;

//     for (int i = 0; i < oldWidget.heatmapConfig.length; i++) {
//       await mapController!.mapController
//           .removeLayer("heatmap-layer-${oldWidget.heatmapConfig[i].hashCode}");
//       await mapController!.mapController.removeSource(
//           "heatmap-source-${oldWidget.heatmapConfig[i].hashCode}");
//     }

//     if (widget.heatmapConfig.isNotEmpty) {
//       List<HeatmapLayerProperties> layers =
//           parser.parseHeatmap(widget.heatmapConfig);

//       for (int i = 0; i < widget.heatmapConfig.length; i++) {
//         await mapController!.addHeatMapLayer(
//           widget.heatmapConfig[i],
//           layers[i],
//         );
//       }
//     }
//   }

//   void _onMapCreated(MapLibreMapController controller) async {
//     mapController = MaplibreController(
//       mapController: controller,
//       padding: widget.padding,
//     );
//     widget.onControllerReady?.call(mapController!);
//     _updatePolylines();
//     _updateCircles();
//     var markersList = await parser.parseMarkersToAnnotations(
//         widget.markers, mapController!.mapController);

//     for (var marker in markersList) {
//       mapController!.mapController.addSymbol(
//         marker,
//       );
//     }

//     if (widget.heatmapConfig.isNotEmpty && mapController != null) {
//       List<HeatmapLayerProperties> layers =
//           parser.parseHeatmap(widget.heatmapConfig);
//       for (int i = 0; i < widget.heatmapConfig.length; i++) {
//         mapController!.addHeatMapLayer(
//           widget.heatmapConfig[i],
//           layers[i],
//         );
//       }
//     }
//   }

//   bool _hasMarkerListChanged(
//       List<CustomMarker> oldMarkers, List<CustomMarker> newMarkers) {
//     if (oldMarkers.length != newMarkers.length) return true;

//     for (int i = 0; i < oldMarkers.length; i++) {
//       if (oldMarkers[i] != newMarkers[i]) {
//         return true;
//       }
//     }

//     return false;
//   }

//   // Future<void> _moveToCurrentLocation() async {
//   //   LocationPermission permission = await Geolocator.requestPermission();
//   //   if (permission == LocationPermission.denied ||
//   //       permission == LocationPermission.deniedForever) {
//   //     Geolocator.openAppSettings();
//   //     return;
//   //   }

//   //   Position position = await Geolocator.getCurrentPosition();
//   //   mapController?.mapController.animateCamera(
//   //     CameraUpdate.newLatLngZoom(
//   //       LatLng(position.latitude, position.longitude),
//   //       14.0,
//   //     ),
//   //   );
//   // }
//   int _lastUpdateId = 0;

//   Future<void> _updateMarkers(covariant MapLibreView oldWidget) async {
//     if (mapController == null) return;

//     final int currentUpdateId = ++_lastUpdateId;
//     final tolerance = 0.001;

//     final List<CustomMarker> newMarkers = widget.markers;
//     final List<CustomMarker> oldMarkers = oldWidget.markers;

//     final List<CustomMarker> added = [];
//     final List<CustomMarker> updated = [];
//     final List<CustomMarker> deleted = [];

//     for (final newMarker in newMarkers) {
//       bool found = false;
//       for (final oldMarker in oldMarkers) {
//         if (newMarker == oldMarker ||
//             newMarker.position.distanceTo(oldMarker.position) < tolerance) {
//           found = true;
//           break;
//         }
//       }
//       if (!found) {
//         added.add(newMarker);
//       }
//     }

//     for (final oldMarker in oldMarkers) {
//       bool found = false;
//       for (final newMarker in newMarkers) {
//         final positionCloseEnough =
//             oldMarker.position.distanceTo(newMarker.position) < tolerance;

//         if (positionCloseEnough) {
//           found = true;
//           if (oldMarker != newMarker) {
//             updated.add(newMarker);
//           }
//           break;
//         }
//       }
//       if (!found) {
//         deleted.add(oldMarker);
//       }
//     }

//     if (deleted.isNotEmpty) {
//       if (currentUpdateId != _lastUpdateId) return;

//       final symbolsToRemove =
//           mapController!.mapController.symbols.where((symbol) {
//         return deleted.any((marker) =>
//             (symbol.options.geometry!.latitude - marker.position.latitude)
//                     .abs() <
//                 tolerance &&
//             (symbol.options.geometry!.longitude - marker.position.longitude)
//                     .abs() <
//                 tolerance);
//       }).toList();

//       if (symbolsToRemove.isNotEmpty) {
//         mapController!.mapController.removeSymbols(symbolsToRemove);
//       }
//     }

//     if (updated.isNotEmpty) {
//       if (currentUpdateId != _lastUpdateId) return;

//       final symbolsToUpdate =
//           mapController!.mapController.symbols.where((symbol) {
//         return updated.any((marker) =>
//             (symbol.options.geometry!.latitude - marker.position.latitude)
//                     .abs() <
//                 tolerance &&
//             (symbol.options.geometry!.longitude - marker.position.longitude)
//                     .abs() <
//                 tolerance);
//       }).toList();

//       if (symbolsToUpdate.isNotEmpty) {
//         mapController!.mapController.removeSymbols(symbolsToUpdate);
//       }

//       final newAnnotations = await parser.parseMarkersToAnnotations(
//         updated,
//         mapController!.mapController,
//       );

//       if (currentUpdateId != _lastUpdateId) return;

//       for (var marker in newAnnotations) {
//         mapController!.mapController.addSymbol(marker);
//       }
//     }

//     if (added.isNotEmpty) {
//       final newAnnotations = await parser.parseMarkersToAnnotations(
//         added,
//         mapController!.mapController,
//       );

//       if (currentUpdateId != _lastUpdateId) return;

//       for (var marker in newAnnotations) {
//         mapController!.mapController.addSymbol(marker);
//       }
//     }
//   }

//   void _updatePolylines() {
//     mapController!.mapController.clearLines();

//     var polylinesList = parser.parsePolyLines(
//       widget.polylines,
//     );

//     for (var polyline in polylinesList) {
//       mapController?.mapController.addLine(
//         polyline,
//       );
//     }
//   }

//   void _updateCircles() async {
//     mapController!.mapController.clearCircles();

//     var circleMarkersList = parser.parseCircleMarkers(
//       widget.circleMarkers,
//     );

//     for (var circle in circleMarkersList) {
//       mapController?.mapController.addCircle(
//         circle,
//       );
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return MapLibreMap(
//       styleString: widget.options.styleString,
//       myLocationRenderMode: MyLocationRenderMode.compass,
//       initialCameraPosition: CameraPosition(
//         target: widget.initialLocation.latLng.mapLibreLatLng,
//         zoom: 14.0,
//       ),
//       onMapCreated: _onMapCreated,
//       myLocationEnabled: true,
//       myLocationTrackingMode: widget.showMyLocation == true
//           ? MyLocationTrackingMode.tracking
//           : MyLocationTrackingMode.none,
//       trackCameraPosition: true,
//       onCameraIdle: () async {
//         final latLng =
//             mapController?.mapController.cameraPosition?.target.latLng;
//         if (latLng == null) return;
//         final bounds = await mapController?.mapController.getVisibleRegion();
//         widget.onMapMoved?.call(
//             latLng,
//             mapController?.mapController.cameraPosition?.zoom ??
//                 widget.initialZoom,
//             LatLngBounds.fromPoints(
//               [
//                 latlng.LatLng(
//                     bounds!.southwest.latitude, bounds.southwest.longitude),
//                 latlng.LatLng(
//                     bounds.northeast.latitude, bounds.northeast.longitude),
//               ],
//             ),
//             false);
//       },
//     );
//   }
// }

// extension MapLibreLatLngX on LatLng {
//   latlng.LatLng get latLng => latlng.LatLng(latitude, longitude);
// }

// extension MapLibreLatLngXX on latlng.LatLng {
//   LatLng get mapLibreLatLng => LatLng(latitude, longitude);
// }
