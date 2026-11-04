// import 'dart:math';

// import 'package:flutter/material.dart';
// import 'package:generic_map/generic_map.dart';
// import 'package:generic_map/interfaces/heat_map_config.dart';
// import 'package:generic_map/maplibre/widget.dart';
// import 'package:generic_map_widgetbook/core/location_pin_marker.dart';
// import 'package:generic_map_widgetbook/core/mock_location.dart';
// import 'package:latlong2/latlong.dart';
// import 'package:widgetbook_annotation/widgetbook_annotation.dart';
// import 'package:flutter_dotenv/flutter_dotenv.dart';

// final platformSettings = PlatformMapProviderSettings(
//   defaultProvider: MapProviderEnum.mapLibre,
// );

// final mapLibreOptions = MapLibreOptions(
//   apiKey: dotenv.get('MAPLIBRE_API_KEY'),
//   styleUrl: dotenv.get('MAPLIBRE_STYLE_URL'),
// );

// @UseCase(name: 'Default', type: MapLibreView)
// Widget defaulMapLibreView(
//   BuildContext context,
// ) {
//   return GenericMap(
//     initialLocation: Place(mockCoordinateSeattle1, 'address', 'title'),
//     platformMapProviderSettings: platformSettings,
//     mapLibreOptions: mapLibreOptions,
//   );
// }

// @UseCase(name: 'centerMarker', type: MapLibreView)
// Widget mapLibreViewCenterMarker(
//   BuildContext context,
// ) {
//   return GenericMap(
//     padding: EdgeInsets.all(100),
//     initialLocation: Place(
//       mockCoordinateSeattle1,
//       'address',
//       'title',
//     ),
//     centerMarkerBuilder: (context, key, address) {
//       return LocationPinMarker().centerMarker;
//     },
//     addressResolver: (p0, p1) async {
//       return Place(mockCoordinateSeattle1, 'address', 'title');
//     },
//     mode: MapViewMode.picker,
//     interactive: true,
//     platformMapProviderSettings: platformSettings,
//     mapLibreOptions: mapLibreOptions,
//   );
// }

// @UseCase(name: 'markers', type: MapLibreView)
// Widget mapLibreViewMarkers(
//   BuildContext context,
// ) {
//   return GenericMap(
//     padding: EdgeInsets.all(100),
//     initialLocation: Place(mockCoordinateSeattle1, 'address', 'title'),
//     platformMapProviderSettings: platformSettings,
//     mapLibreOptions: mapLibreOptions,
//     onControllerReady: (controller) {
//       controller.fitBounds(mockListLocation);
//     },
//     markers: mockListLocation
//         .map(
//           (e) => CustomMarker(
//             alignment: Alignment.topCenter,
//             height: 67,
//             width: 240,
//             position: e,
//             widget: LocationPinMarker(
//               content: 'Home',
//             ),
//           ),
//         )
//         .toList(),
//     mode: MapViewMode.static,
//     interactive: true,
//     isPolylineDrawEnabled: true,
//     polylines: mockListLocation
//         .map(
//           (e) => PolyLineLayer(
//             points: mockListLocation,
//             gradientColors: [
//               Colors.blue,
//             ],
//           ),
//         )
//         .toList(),
//   );
// }

// @UseCase(name: 'circleMarkers', type: MapLibreView)
// Widget mapLibreCircleMarkers(
//   BuildContext context,
// ) {
//   return GenericMap(
//     padding: EdgeInsets.all(100),
//     initialLocation: Place(mockCoordinateSeattle1, 'address', 'title'),
//     platformMapProviderSettings: platformSettings,
//     mapLibreOptions: mapLibreOptions,
//     onControllerReady: (controller) {
//       controller.fitBounds(mockListLocation);
//     },
//     circleMarkers: mockListLocation
//         .map(
//           (e) => CircleMarker(
//             position: e,
//             radius: 100,
//             borderWidth: 2,
//             color: Colors.red,
//             borderColor: Colors.blue,
//           ),
//         )
//         .toList(),
//     mode: MapViewMode.static,
//     interactive: true,
//     isPolylineDrawEnabled: true,
//     polylines: mockListLocation
//         .map(
//           (e) => PolyLineLayer(
//             points: mockListLocation,
//             gradientColors: [
//               Colors.blue,
//             ],
//           ),
//         )
//         .toList(),
//   );
// }

// final ValueNotifier<List<LatLng>> locationList = ValueNotifier(
//   [
//     mockCoordinateSeattle1,
//     mockCoordinateSeattle2,
//   ],
// );

// @UseCase(name: 'editMap', type: MapLibreView)
// Widget mapLibreEdit(
//   BuildContext context,
// ) {
//   return Column(
//     spacing: 30,
//     children: [
//       SizedBox(
//         height: 400,
//         child: ValueListenableBuilder<List<LatLng>>(
//             valueListenable: locationList,
//             builder: (context, value, child) {
//               return GenericMap(
//                 padding: EdgeInsets.all(100),
//                 initialLocation:
//                     Place(mockCoordinateSeattle1, 'address', 'title'),
//                 platformMapProviderSettings: platformSettings,
//                 mapLibreOptions: mapLibreOptions,
//                 onControllerReady: (controller) {
//                   controller.fitBounds(locationList.value);
//                 },
//                 markers: locationList.value
//                     .map(
//                       (e) => CustomMarker(
//                         alignment: Alignment.bottomCenter,
//                         height: 67,
//                         width: 240,
//                         position: e,
//                         widget: LocationPinMarker(
//                           content: 'Home',
//                         ),
//                       ),
//                     )
//                     .toList(),
//                 mode: MapViewMode.static,
//                 interactive: true,
//                 isPolylineDrawEnabled: true,
//                 polylines: locationList.value
//                     .map(
//                       (e) => PolyLineLayer(
//                         points: locationList.value,
//                         gradientColors: [
//                           Colors.blue,
//                         ],
//                       ),
//                     )
//                     .toList(),
//               );
//             }),
//       ),
//       Row(
//         mainAxisAlignment: MainAxisAlignment.center,
//         spacing: 15,
//         children: [
//           ElevatedButton(
//             onPressed: () {
//               if (locationList.value.isNotEmpty) {
//                 locationList.value = List.from(locationList.value)
//                   ..removeLast();
//               }
//             },
//             child: Text('Delete'),
//           ),
//           ElevatedButton(
//             onPressed: () {
//               LatLng newLocation;

//               if (locationList.value.length < 10) {
//                 do {
//                   newLocation =
//                       mockAllLatLng[Random().nextInt(mockAllLatLng.length)];
//                 } while (locationList.value.contains(
//                   newLocation,
//                 ));

//                 locationList.value = List.from(locationList.value)
//                   ..add(newLocation);
//               }
//             },
//             child: Text('Add'),
//           ),
//           ElevatedButton(
//             onPressed: () {
//               LatLng updateLocation;
//               do {
//                 updateLocation =
//                     mockAllLatLng[Random().nextInt(mockAllLatLng.length)];
//               } while (locationList.value.contains(
//                 updateLocation,
//               ));
//               locationList.value = List.from(locationList.value)
//                 ..removeLast()
//                 ..add(
//                   updateLocation,
//                 );
//             },
//             child: Text('Update'),
//           ),
//         ],
//       ),
//     ],
//   );
// }

// @UseCase(name: 'heatMap', type: MapLibreView)
// Widget mapLibreHeatMap(
//   BuildContext context,
// ) {
//   return GenericMap(
//     padding: EdgeInsets.all(100),
//     initialLocation: Place(LatLng(37.7749, -122.4194), 'address', 'title'),
//     platformMapProviderSettings: platformSettings,
//     mapLibreOptions: mapLibreOptions,
//     onControllerReady: (controller) {
//       controller.fitBounds(mockListLocation);
//     },
//     mode: MapViewMode.static,
//     interactive: true,
//     isPolylineDrawEnabled: true,
//     heatmapConfig: [
//       HeatmapConfig(
//         heatmapRadius: 25.0,
//         heatmapOpacity: 0.5,
//         heatmapIntensity: 1.5,
//         interpolationMethod: HeatmapInterpolation.linear,
//         colors: [
//           Colors.purple,
//           Colors.blue,
//           Colors.pink,
//           Colors.blueGrey,
//           Colors.yellow,
//         ],
//         points: [
//           LatLng(37.7749, -122.4194),
//           LatLng(37.7849, -122.4294),
//           LatLng(37.7949, -122.4394),
//           LatLng(37.8049, -122.4494),
//           LatLng(37.8149, -122.4594),
//           LatLng(37.8249, -122.4694),
//           LatLng(37.8349, -122.4794),
//           LatLng(37.8449, -122.4894),
//           LatLng(37.8549, -122.4994),
//           LatLng(37.8649, -122.5094),
//           LatLng(37.8749, -122.5194),
//           LatLng(37.8849, -122.5294),
//           LatLng(37.8949, -122.5394),
//           LatLng(37.9049, -122.5494),
//           LatLng(37.9149, -122.5594),
//           LatLng(37.9249, -122.5694),
//         ],
//       ),
//     ],
//   );
// }
