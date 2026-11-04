import 'dart:math';

import 'package:flutter/material.dart';
import 'package:generic_map/generic_map.dart';
import 'package:generic_map/interfaces/heat_map_config.dart';
import 'package:generic_map_widgetbook/core/mock_location.dart';
import 'package:latlong2/latlong.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart';
import 'package:generic_map/mapbox_sdk/widget.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../core/location_pin_marker.dart';

final sdkOptions = MapboxSdkOptions(
  accessToken: dotenv.get('MAPBOX_ACCESS_TOKEN'),
);

@UseCase(name: 'Default', type: MapBoxView)
Widget defaulMapBoxView(
  BuildContext context,
) {
  return GenericMap(
    initialLocation: Place(mockCoordinateSeattle1, 'address', 'title'),
    platformMapProviderSettings: PlatformMapProviderSettings(
      defaultProvider: MapProviderEnum.mapBoxSDK,
    ),
    mapboxSdkOptions: sdkOptions,
  );
}

@UseCase(name: 'centerMarker', type: MapBoxView)
Widget mapBoxViewCenterMarker(
  BuildContext context,
) {
  return GenericMap(
    padding: EdgeInsets.all(100),
    initialLocation: Place(
      mockCoordinateSeattle1,
      'address',
      'title',
    ),
    centerMarkerBuilder: (context, key, address) {
      return LocationPinMarker().centerMarker;
    },
    addressResolver: (p0, p1) async {
      return Place(mockCoordinateSeattle1, 'address', 'title');
    },
    mode: MapViewMode.picker,
    interactive: true,
    platformMapProviderSettings: PlatformMapProviderSettings(
      defaultProvider: MapProviderEnum.mapBoxSDK,
    ),
    mapboxSdkOptions: sdkOptions,
  );
}

@UseCase(name: 'markers', type: MapBoxView)
Widget mapBoxViewMarkers(
  BuildContext context,
) {
  return GenericMap(
    platformMapProviderSettings: PlatformMapProviderSettings(
      defaultProvider: MapProviderEnum.mapBoxSDK,
    ),
    mapboxSdkOptions: sdkOptions,
    padding: EdgeInsets.all(100),
    initialLocation: Place(mockCoordinateSeattle1, 'address', 'title'),
    onControllerReady: (controller) => controller.fitBounds(mockListLocation),
    markers: mockListLocation
        .map(
          (e) => CustomMarker(
            id: e.toString(),
            alignment: Alignment.bottomCenter,
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

@UseCase(name: 'circleMarkers', type: MapBoxView)
Widget mapBoxViewCircleMarkers(
  BuildContext context,
) {
  return GenericMap(
    padding: EdgeInsets.all(100),
    initialLocation: Place(mockCoordinateSeattle1, 'address', 'title'),
    platformMapProviderSettings: PlatformMapProviderSettings(
      defaultProvider: MapProviderEnum.mapBoxSDK,
    ),
    mapboxSdkOptions: sdkOptions,
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

@UseCase(name: 'editMap', type: MapBoxView)
Widget mapBoxEdit(
  BuildContext context,
) {
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
                initialLocation:
                    Place(mockCoordinateSeattle1, 'address', 'title'),
                platformMapProviderSettings: PlatformMapProviderSettings(
                  defaultProvider: MapProviderEnum.mapBoxSDK,
                ),
                mapboxSdkOptions: sdkOptions,
                onControllerReady: (controller) {
                  controller.fitBounds(locationList.value);
                },
                markers: locationList.value
                    .map(
                      (e) => CustomMarker(
                        id: e.toString(),
                        alignment: Alignment.bottomCenter,
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
              locationList.value = List.from(locationList.value)..removeLast();
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

@UseCase(name: 'heatMap', type: MapBoxView)
Widget mapBoxHeatMap(
  BuildContext context,
) {
  return GenericMap(
    padding: EdgeInsets.all(100),
    initialLocation: Place(LatLng(37.7749, -122.4194), 'address', 'title'),
    platformMapProviderSettings: PlatformMapProviderSettings(
      defaultProvider: MapProviderEnum.mapBoxSDK,
    ),
    mapboxSdkOptions: sdkOptions,
    onControllerReady: (controller) {
      controller.fitBounds(mockListLocation);
    },
    mode: MapViewMode.static,
    interactive: true,
    isPolylineDrawEnabled: true,
    heatmapConfig: [
      HeatmapConfig(
        heatmapRadius: 25.0,
        heatmapOpacity: 0.5,
        heatmapIntensity: 1.5,
        zoomWeights: [
          0.3,
          0.5,
          0.8,
          1.0,
        ],
        stops: [
          0.2,
          0.4,
          0.6,
          0.8,
          1.0,
        ],
        zoomStops: [
          0.0,
          2.0,
          3.0,
          10.0,
        ],
        interpolationMethod: HeatmapInterpolation.linear,
        colors: [
          Colors.purple,
          Colors.blue,
          Colors.pink,
          Colors.blueGrey,
          Colors.orange,
        ],
        points: [
          LatLng(37.7749, -122.4194),
          LatLng(37.7849, -122.4294),
          LatLng(37.7949, -122.4394),
          LatLng(37.8049, -122.4494),
          LatLng(37.8149, -122.4594),
          LatLng(37.8249, -122.4694),
          LatLng(37.8349, -122.4794),
          LatLng(37.8449, -122.4894),
          LatLng(37.8549, -122.4994),
          LatLng(37.8649, -122.5094),
          LatLng(37.8749, -122.5194),
          LatLng(37.8849, -122.5294),
          LatLng(37.8949, -122.5394),
          LatLng(37.9049, -122.5494),
          LatLng(37.9149, -122.5594),
          LatLng(37.9249, -122.5694),
        ],
      ),
      HeatmapConfig(
        heatmapRadius: 25.0,
        heatmapOpacity: 0.5,
        heatmapIntensity: 1.5,
        interpolationMethod: HeatmapInterpolation.linear,
        colors: [
          Colors.purple,
          Colors.blue,
          Colors.pink,
          Colors.blueGrey,
          Colors.black,
        ],
        points: [
          LatLng(34.6400, 50.8750),
          LatLng(34.6500, 50.8800),
          LatLng(34.6700, 50.8900),
          LatLng(34.6900, 50.9100),
          LatLng(34.7200, 50.9300),
          LatLng(34.7400, 50.9500),
          LatLng(34.7600, 50.9700),
          LatLng(34.7800, 50.9900),
        ],
      ),
      HeatmapConfig(
        heatmapRadius: 25.0,
        heatmapOpacity: 0.5,
        heatmapIntensity: 1.5,
        interpolationMethod: HeatmapInterpolation.linear,
        colors: [
          Colors.purple,
          Colors.blue,
          Colors.pink,
          Colors.blueGrey,
          Colors.green,
        ],
        points: [
          LatLng(37.2800, 49.5900),
          LatLng(37.2900, 49.6000),
          LatLng(37.3000, 49.6100),
          LatLng(37.3100, 49.6200),
          LatLng(37.3200, 49.6300),
          LatLng(37.3300, 49.6400),
          LatLng(37.3400, 49.6500),
          LatLng(37.3500, 49.6600),
        ],
      ),
      HeatmapConfig(
        heatmapRadius: 25.0,
        heatmapOpacity: 0.5,
        heatmapIntensity: 1.5,
        interpolationMethod: HeatmapInterpolation.linear,
        colors: [
          Colors.purple,
          Colors.blue,
          Colors.pink,
          Colors.blueGrey,
          Colors.yellow,
        ],
        points: [
          LatLng(36.2700, 49.2300),
          LatLng(36.2800, 49.2400),
          LatLng(36.2900, 49.2500),
          LatLng(36.3000, 49.2600),
          LatLng(36.3100, 49.2700),
          LatLng(36.3200, 49.2800),
          LatLng(36.3300, 49.2900),
        ],
      ),
    ],
  );
}
