import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

enum MapboxSdkStyle {
  standard,
  standardSatellite,
  mapboxStreets,
  outdoors,
  light,
  dark,
  satellite,
  satelliteStreets,
  standardExperimental;

  String get styleId => switch (this) {
        MapboxSdkStyle.standard => MapboxStyles.STANDARD,
        MapboxSdkStyle.standardSatellite => MapboxStyles.STANDARD_SATELLITE,
        MapboxSdkStyle.mapboxStreets => MapboxStyles.MAPBOX_STREETS,
        MapboxSdkStyle.outdoors => MapboxStyles.OUTDOORS,
        MapboxSdkStyle.light => MapboxStyles.LIGHT,
        MapboxSdkStyle.dark => MapboxStyles.DARK,
        MapboxSdkStyle.satellite => MapboxStyles.SATELLITE,
        MapboxSdkStyle.satelliteStreets => MapboxStyles.SATELLITE_STREETS,
        MapboxSdkStyle.standardExperimental => MapboxStyles.STANDARD
      };
}

class MapboxSdkOptions {
  String accessToken;
  MapboxSdkStyle style;

  MapboxSdkOptions({
    required this.accessToken,
    this.style = MapboxSdkStyle.standard,
  });

  // Value equality is load-bearing, not a nicety. Consumers build these inline
  // from a theme flag (`isDark ? dark : light`), so a new-but-identical
  // instance arrives on every rebuild. The map widgets compare options with
  // `!=` in `didUpdateWidget`; without `==` that is identity, which reads as a
  // style change and reloads the style on every frame that rebuilds the map.
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MapboxSdkOptions &&
          runtimeType == other.runtimeType &&
          other.accessToken == accessToken &&
          other.style == style;

  @override
  int get hashCode => Object.hash(
        accessToken,
        style,
      );
}
