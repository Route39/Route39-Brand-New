# Generic Map

A simple wrapper around:

- flutter_map
- google_maps_flutter
- mapbox_maps_flutter
- maplibre_gl

This library acts as a wrapper around some of the most popular map providers in Flutter. It provides a unified API over multiple map providers, allowing you to switch between them with minimal changes to your code. This is specifically useful when you want to support multiple platforms and need to switch between map providers based on the platform.
Additionally it tries to resolve some of the limitations and shortcomings of the official map providers.

## ✨ Features

- **🔄 Unified API:** Consistent interface across multiple map providers
- **🎯 Feature Parity:** Achieve identical functionality across all map providers
- **🎨 Widget Markers:** Support for widget markers on google_maps (Beyond official API)
- **📍 Mapbox Markers:** Widget marker support for mapbox_maps (Not in official API)
- **📝 Declarative Syntax:** Simplified marker, polyline, and polygon management vs native APIs
- **💾 Enhanced Caching:** Caching capabilities for flutter_map out of the box (thanks to flutter_map_tile_caching)
- **⏳ Debouncing Support:** Debouncing support for more reliable address resolution & improved performance
- **🎬 Animation Support:** Smooth animations for flutter_map components

## Feature Comparison

| Feature            | flutter_map (OSM, MapBox) | Google Maps | Mapbox OpenGL | MapLibre GL |
| ------------------ | ------------------------- | ----------- | ------------- | ----------- |
| Static Markers     | ✅                         | ✅         | ✅           | ✅         |
| Interactive Markers| ✅                         | ❌         | ❌           | ❌         |
| Polylines          | ✅                         | ✅         | ✅           | ✅         |
| Circles            | ✅                         | ✅         | ✅           | ✅         |
| Map Gestures       | ✅                         | ✅         | ✅           | ✅         |
| Heatmaps           | ✅                         | ✅         | ✅           | ✅         |
| Geofencing         | ✅                         | ❌         | ❌           | ❌         |
| Caching            | ✅                         | ❌         | ❌           | ❌         |
| Animations         | ✅                         | ✅         | ✅           | ✅         |

## Platform Support

Some map providers do not support all platforms. Through `PlatformMapProviderSettings` you can specify which map provider to use on each platform.

| Platform | flutter_map (OSM, MapBox) | Google Maps | Mapbox OpenGL | MapLibre GL |
|----------|---------------------------|-------------|---------------|-------------|
| Android  | ✅                           | ✅          | ✅            | ✅          |
| iOS      | ✅                           | ✅          | ✅            | ✅          |
| Web      | ✅                           | ❌          | ❌            | ✅          |
| Desktop  | ✅                           | ❌          | ❌            | ❌          |

## Installation

Add this package to your `pubspec.yaml` as a git dependency:

```yaml
dependencies:
  generic_map:
    git:
      url: https://github.com/lume-code/generic_map.git
```

To pin to a specific version, add a `ref`:

```yaml
  generic_map:
    git:
      url: https://github.com/lume-code/generic_map.git
      ref: v0.11.1  # tag, branch, or commit SHA
```

This package uses `gm_google_maps_flutter` (a renamed fork of `google_maps_flutter` with editable polyline/polygon support on web). No `dependency_overrides` are needed -- the forked packages are bundled and resolved automatically via path dependencies.

## Usage

```dart
import 'package:generic_map/generic_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter/material.dart';

final map = GenericMap(
  initialLocation: Place(
    LatLng(37.7749, -122.4194), // San Francisco coordinates
    "San Francisco",
    "CA",
  ),
  platformMapProviderSettings: PlatformMapProviderSettings(
    android: MapProviderEnum.googleMaps,
    ios: MapProviderEnum.mapbox,
    web: MapProviderEnum.mapLibre,
  ),
  mapboxOptions: MapboxOptions(
    accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN',
    styleUri: 'YOUR_MAPBOX_STYLE_URI',
  ),
  mapLibreOptions: MapLibreOptions(
    accessToken: 'YOUR_MAPLIBRE_ACCESS_TOKEN',
    styleUri: 'YOUR_MAPLIBRE_STYLE_URI',
  ),
  mode: MapViewMode.static,
  interactive: true,
  markers: [
    CustomMarker(
      id: "marker1",
      position: LatLng(37.7749, -122.4194),
      widget: Container(
        padding: EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.5),
              spreadRadius: 2,
              blurRadius: 5,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Text(
          'San Francisco',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
    ),
  ],
  polylines: [
    PolyLineLayer(
      id: "route1",
      points: [
        LatLng(37.7749, -122.4194),
        LatLng(37.7952, -122.4028),
      ],
      color: Colors.blue,
      width: 3,
    ),
  ],
  circleMarkers: [
    CircleMarker(
      id: "circle1",
      color: Colors.red.withOpacity(0.5),
      borderColor: Colors.red,
      borderStrokeWidth: 2,
      radius: 30,
      point: LatLng(37.7833, -122.4667),
    ),
  ],
  padding: EdgeInsets.all(20),
  onMapMoved: (place) {
    print('Map moved to: ${place?.name}');
  },
  addressResolver: (LatLng location) async {
    // Implement your address resolving logic here
    return Place(location, "Some Address", "Some Title");
  },
);
```
