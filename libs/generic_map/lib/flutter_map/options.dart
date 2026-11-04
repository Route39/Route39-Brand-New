import 'package:flutter/foundation.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_tile_caching/flutter_map_tile_caching.dart';

class OpenStreetMapsOptions {
  final String? userAgentPackageName;

  OpenStreetMapsOptions({
    this.userAgentPackageName,
  });

  TileLayer tileLayer({
    required bool isCacheEnabled,
  }) =>
      TileLayer(
        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        maxNativeZoom: 18,
        maxZoom: 19,
        userAgentPackageName: userAgentPackageName ?? 'unknown',
        tileProvider: (isCacheEnabled && !kIsWeb)
            ? FMTCTileProvider.allStores(
                allStoresStrategy: BrowseStoreStrategy.readUpdateCreate,
              )
            : NetworkTileProvider(silenceExceptions: true),
      );

  // Value equality is load-bearing, not a nicety. Consumers build these inline
  // from a theme flag (`isDark ? dark : light`), so a new-but-identical
  // instance arrives on every rebuild. The map widgets compare options with
  // `!=` in `didUpdateWidget`; without `==` that is identity, which reads as a
  // style change and reloads the style on every frame that rebuilds the map.
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OpenStreetMapsOptions &&
          runtimeType == other.runtimeType &&
          other.userAgentPackageName == userAgentPackageName;

  @override
  int get hashCode => userAgentPackageName.hashCode;
}

enum MapboxStyle {
  streets,
  light,
  dark,
  outdoors,
  satellite,
  satelliteStreets,
  trafficDay,
  trafficNight,
  navigationDay,
  navigationNight,
  navigationGuidanceDay,
  navigationGuidanceNight;

  String get styleId => switch (this) {
        MapboxStyle.streets => 'streets-v12',
        MapboxStyle.light => 'light-v11',
        MapboxStyle.dark => 'dark-v11',
        MapboxStyle.outdoors => 'outdoors-v12',
        MapboxStyle.satellite => 'satellite-v9',
        MapboxStyle.satelliteStreets => 'satellite-streets-v12',
        MapboxStyle.trafficDay => 'traffic-day-v2',
        MapboxStyle.trafficNight => 'traffic-night-v2',
        MapboxStyle.navigationDay => 'navigation-day-v1',
        MapboxStyle.navigationNight => 'navigation-night-v1',
        MapboxStyle.navigationGuidanceDay => 'navigation-guidance-day-v4',
        MapboxStyle.navigationGuidanceNight => 'navigation-guidance-night-v4'
      };
}

class MapboxOptions {
  final String accessToken;
  final String styleUserId;
  final String styleTileSetId;

  const MapboxOptions({
    required this.accessToken,
    this.styleUserId = 'mapbox',
    this.styleTileSetId = 'streets-v12',
  });

  TileLayer tileLayer({
    required bool isCacheEnabled,
  }) =>
      TileLayer(
        urlTemplate:
            "https://api.mapbox.com/styles/v1/$styleUserId/$styleTileSetId/tiles/256/{z}/{x}/{y}@2x?access_token=$accessToken",
        additionalOptions: {"access_token": accessToken},
        maxNativeZoom: 18,
        maxZoom: 19,
        tileProvider: (isCacheEnabled && !kIsWeb)
            ? FMTCTileProvider.allStores(
                allStoresStrategy: BrowseStoreStrategy.readUpdateCreate,
              )
            : NetworkTileProvider(silenceExceptions: true),
      );

  // Value equality is load-bearing, not a nicety. Consumers build these inline
  // from a theme flag (`isDark ? dark : light`), so a new-but-identical
  // instance arrives on every rebuild. The map widgets compare options with
  // `!=` in `didUpdateWidget`; without `==` that is identity, which reads as a
  // style change and reloads the style on every frame that rebuilds the map.
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MapboxOptions &&
          runtimeType == other.runtimeType &&
          other.accessToken == accessToken &&
          other.styleUserId == styleUserId &&
          other.styleTileSetId == styleTileSetId;

  @override
  int get hashCode => Object.hash(
        accessToken,
        styleUserId,
        styleTileSetId,
      );
}
