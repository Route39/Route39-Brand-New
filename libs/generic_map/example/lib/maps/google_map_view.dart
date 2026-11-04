import 'dart:math';

import 'package:flutter/material.dart';
import 'package:generic_map/generic_map.dart';
import 'package:generic_map/google_map/widget.dart';
import 'package:generic_map_widgetbook/core/location_pin_marker.dart';
import 'package:generic_map_widgetbook/core/mock_location.dart';
import 'package:latlong2/latlong.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart';

final googleMapsPlatform = PlatformMapProviderSettings(
  defaultProvider: MapProviderEnum.googleMaps,
);

@UseCase(name: 'Default', type: GoogleMapView)
Widget defaulGoogleMapView(
  BuildContext context,
) {
  final isDarkMode = context.knobs.boolean(
    label: 'Dark Mode',
    initialValue: false,
  );

  final googleMapsOptions = GoogleMapsOptions(
    preset:
        isDarkMode ? GoogleMapStylePreset.dark : GoogleMapStylePreset.standard,
  );

  return GenericMap(
    padding: EdgeInsets.all(100),
    initialLocation: Place(
      mockCoordinateSeattle1,
      'address',
      'title',
    ),
    interactive: true,
    platformMapProviderSettings: googleMapsPlatform,
    googleMapOptions: googleMapsOptions,
  );
}

@UseCase(name: 'centerMarker', type: GoogleMapView)
Widget googleMapViewCenterMarker(
  BuildContext context,
) {
  final isDarkMode = context.knobs.boolean(
    label: 'Dark Mode',
    initialValue: false,
  );

  final googleMapsOptions = GoogleMapsOptions(
    preset:
        isDarkMode ? GoogleMapStylePreset.dark : GoogleMapStylePreset.standard,
  );

  return GenericMap(
    padding: EdgeInsets.all(100),
    initialLocation: Place(
      mockCoordinateSeattle1,
      'address',
      'title',
    ),
    centerMarkerBuilder: (context, key, address) {
      return LocationPinMarker(
        key: key,
      ).centerMarker;
    },
    onMapMoved: (_) {},
    addressResolver: (p0, p1) async {
      return Place(mockCoordinateSeattle1, 'address', 'title');
    },
    mode: MapViewMode.picker,
    interactive: true,
    platformMapProviderSettings: googleMapsPlatform,
    googleMapOptions: googleMapsOptions,
  );
}

@UseCase(name: 'markers', type: GoogleMapView)
Widget googleMapViewMarkers(
  BuildContext context,
) {
  final isDarkMode = context.knobs.boolean(
    label: 'Dark Mode',
    initialValue: false,
  );

  final googleMapsOptions = GoogleMapsOptions(
    preset:
        isDarkMode ? GoogleMapStylePreset.dark : GoogleMapStylePreset.standard,
  );

  return GenericMap(
    padding: EdgeInsets.all(100),
    onControllerReady: (controller) {
      controller.fitBounds(mockListLocation);
    },
    initialLocation: Place(
      mockCoordinateSeattle1,
      'address',
      'title',
    ),
    markers: mockListLocation
        .map(
          (e) => CustomMarker(
            id: e.toString(),
            height: 67,
            width: 240,
            position: e,
            widget: LocationPinMarker(
              content: 'Home',
            ),
          ),
        )
        .toList(),
    mode: MapViewMode.static,
    interactive: true,
    platformMapProviderSettings: googleMapsPlatform,
    googleMapOptions: googleMapsOptions,
    isPolylineDrawEnabled: true,
    polylines: mockListLocation
        .map(
          (e) => PolyLineLayer(
            points: mockListLocation,
            gradientColors: [
              Colors.blue,
            ],
          ),
        )
        .toList(),
  );
}

@UseCase(name: 'circleMarkers', type: GoogleMapView)
Widget openStreetMapCircleMarkers(
  BuildContext context,
) {
  final isDarkMode = context.knobs.boolean(
    label: 'Dark Mode',
    initialValue: false,
  );

  final googleMapsOptions = GoogleMapsOptions(
    preset:
        isDarkMode ? GoogleMapStylePreset.dark : GoogleMapStylePreset.standard,
  );

  return GenericMap(
    padding: EdgeInsets.all(100),
    initialLocation: Place(mockCoordinateSeattle1, 'address', 'title'),
    platformMapProviderSettings: googleMapsPlatform,
    googleMapOptions: googleMapsOptions,
    onControllerReady: (controller) {
      controller.fitBounds(mockListLocation);
    },
    circleMarkers: mockListLocation
        .map(
          (e) => CircleMarker(
            id: "Circle",
            position: e,
            radius: 100,
            borderWidth: 2,
            color: Colors.red,
            borderColor: Colors.blue,
          ),
        )
        .toList(),
    mode: MapViewMode.static,
    interactive: true,
    isPolylineDrawEnabled: true,
    polylines: mockListLocation
        .map(
          (e) => PolyLineLayer(
            points: mockListLocation,
            gradientColors: [
              Colors.blue,
            ],
          ),
        )
        .toList(),
  );
}

final ValueNotifier<List<LatLng>> locationList = ValueNotifier(
  [
    mockCoordinateSeattle1,
    mockCoordinateSeattle2,
  ],
);

@UseCase(name: 'editMap', type: GoogleMapView)
Widget googleMapEdit(
  BuildContext context,
) {
  final isDarkMode = context.knobs.boolean(
    label: 'Dark Mode',
    initialValue: false,
  );

  final googleMapsOptions = GoogleMapsOptions(
    preset:
        isDarkMode ? GoogleMapStylePreset.dark : GoogleMapStylePreset.standard,
  );

  return Column(
    spacing: 30,
    children: [
      SizedBox(
        height: 400,
        child: ValueListenableBuilder<List<LatLng>>(
            valueListenable: locationList,
            builder: (context, value, child) {
              return GenericMap(
                padding: EdgeInsets.all(100),
                onControllerReady: (controller) {
                  controller.fitBounds(mockListLocation);
                },
                initialLocation: Place(
                  mockCoordinateSeattle1,
                  'address',
                  'title',
                ),
                markers: locationList.value
                    .map(
                      (e) => CustomMarker(
                        id: e.toString(),
                        height: 67,
                        width: 240,
                        position: e,
                        widget: LocationPinMarker(
                          content: 'Home',
                        ),
                      ),
                    )
                    .toList(),
                mode: MapViewMode.static,
                interactive: true,
                platformMapProviderSettings: googleMapsPlatform,
                googleMapOptions: googleMapsOptions,
                isPolylineDrawEnabled: true,
                polylines: locationList.value
                    .map(
                      (e) => PolyLineLayer(
                        points: locationList.value,
                        gradientColors: [
                          Colors.blue,
                        ],
                      ),
                    )
                    .toList(),
              );
            }),
      ),
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        spacing: 15,
        children: [
          ElevatedButton(
            onPressed: () {
              if (locationList.value.length == 1) {
                locationList.value = [];
              } else {
                locationList.value = List.from(locationList.value)
                  ..removeLast();
              }
            },
            child: Text('Delete'),
          ),
          ElevatedButton(
            onPressed: () {
              LatLng newLocation;

              if (locationList.value.length < 10) {
                do {
                  newLocation =
                      mockAllLatLng[Random().nextInt(mockAllLatLng.length)];
                } while (locationList.value.contains(
                  newLocation,
                ));

                locationList.value = List.from(locationList.value)
                  ..add(newLocation);
              }
            },
            child: Text('Add'),
          ),
          ElevatedButton(
            onPressed: () {
              LatLng updateLocation;
              do {
                updateLocation =
                    mockAllLatLng[Random().nextInt(mockAllLatLng.length)];
              } while (locationList.value.contains(
                updateLocation,
              ));
              locationList.value = List.from(locationList.value)
                ..removeLast()
                ..add(
                  updateLocation,
                );
            },
            child: Text('Update'),
          ),
        ],
      ),
    ],
  );
}
