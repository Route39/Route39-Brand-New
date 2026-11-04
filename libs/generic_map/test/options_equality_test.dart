// Regression tests for the map-options value equality.
//
// These classes are built inline by consumers from a theme flag, e.g.
//
//     googleMapOptions: Env.googleMapOptions(context.isDark)
//
// which allocates a new instance on every rebuild. `GoogleMapView`'s
// `didUpdateWidget` compares options with `!=`; before these `==` overrides
// that was an identity check, so it read every rebuild as a style change and
// reloaded the style. In dark mode the reload rendered `SizedBox.shrink()`,
// unmounting the `GoogleMap` and remounting it at `initialCameraPosition` —
// the camera jumped back to wherever the host had pinned it, on any unrelated
// rebuild.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:generic_map/flutter_map/options.dart';
import 'package:generic_map/google_map/options.dart';
import 'package:generic_map/interfaces/circle_marker.dart';
import 'package:generic_map/interfaces/map_provider_enum.dart';
import 'package:generic_map/maplibre/options.dart';
import 'package:generic_map/platform_map_provider_settings.dart';
import 'package:latlong2/latlong.dart';

void main() {
  group('GoogleMapsOptions', () {
    test('two instances built from the same flag are equal', () {
      // Exactly what a consumer does twice across two builds.
      GoogleMapsOptions build(bool isDark) =>
          GoogleMapsOptions(preset: isDark ? GoogleMapStylePreset.dark : null);

      expect(build(true), equals(build(true)));
      expect(build(true).hashCode, equals(build(true).hashCode));
      expect(build(false), equals(build(false)));
    });

    test('a real style change is still detected', () {
      const dark = GoogleMapsOptions(preset: GoogleMapStylePreset.dark);
      const light = GoogleMapsOptions();
      expect(dark, isNot(equals(light)));
    });

    test('every styling field participates', () {
      const base = GoogleMapsOptions(
        preset: GoogleMapStylePreset.dark,
        customStyleJson: '{}',
        cloudMapId: 'a',
      );
      expect(
        base,
        isNot(equals(const GoogleMapsOptions(
          preset: GoogleMapStylePreset.night,
          customStyleJson: '{}',
          cloudMapId: 'a',
        ))),
      );
      expect(
        base,
        isNot(equals(const GoogleMapsOptions(
          preset: GoogleMapStylePreset.dark,
          customStyleJson: '{"a":1}',
          cloudMapId: 'a',
        ))),
      );
      expect(
        base,
        isNot(equals(const GoogleMapsOptions(
          preset: GoogleMapStylePreset.dark,
          customStyleJson: '{}',
          cloudMapId: 'b',
        ))),
      );
    });
  });

  group('MapLibreOptions', () {
    test('identical config compares equal', () {
      MapLibreOptions build() =>
          MapLibreOptions(apiKey: 'k', styleUrl: 'https://example/style.json');
      expect(build(), equals(build()));
      expect(build().hashCode, equals(build().hashCode));
    });

    test('a different style url is a change', () {
      expect(
        MapLibreOptions(apiKey: 'k', styleUrl: 'https://example/dark.json'),
        isNot(equals(
          MapLibreOptions(apiKey: 'k', styleUrl: 'https://example/light.json'),
        )),
      );
    });
  });

  group('MapboxOptions', () {
    test('identical config compares equal', () {
      const a = MapboxOptions(accessToken: 't', styleTileSetId: 'dark-v11');
      const b = MapboxOptions(accessToken: 't', styleTileSetId: 'dark-v11');
      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
    });

    test('a theme swap is a change', () {
      const dark = MapboxOptions(accessToken: 't', styleTileSetId: 'dark-v11');
      const light =
          MapboxOptions(accessToken: 't', styleTileSetId: 'streets-v12');
      expect(dark, isNot(equals(light)));
    });
  });

  group('OpenStreetMapsOptions', () {
    test('identical config compares equal', () {
      final a = OpenStreetMapsOptions(userAgentPackageName: 'com.example');
      final b = OpenStreetMapsOptions(userAgentPackageName: 'com.example');
      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
    });
  });

  group('PlatformMapProviderSettings', () {
    test('identical config compares equal', () {
      const a = PlatformMapProviderSettings(
        defaultProvider: MapProviderEnum.googleMaps,
        desktopProvider: MapProviderEnum.mapBox,
      );
      const b = PlatformMapProviderSettings(
        defaultProvider: MapProviderEnum.googleMaps,
        desktopProvider: MapProviderEnum.mapBox,
      );
      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
    });

    test('a different provider is a change', () {
      const a = PlatformMapProviderSettings(
        defaultProvider: MapProviderEnum.googleMaps,
      );
      const b = PlatformMapProviderSettings(
        defaultProvider: MapProviderEnum.mapBox,
      );
      expect(a, isNot(equals(b)));
    });
  });

  group('CircleMarker', () {
    // The driver's search-radius circle is rebuilt inline every frame. Without
    // equality the map re-parsed the circle set through `setState` from
    // `didUpdateWidget`, scheduling another frame each time.
    CircleMarker build({double radius = 5000}) => CircleMarker(
          id: 'search-radius',
          position: LatLng(51.5074, -0.1278),
          radius: radius,
          color: const Color(0x220000FF),
          borderColor: const Color(0xFF0000FF),
          borderWidth: 2,
        );

    test('an unchanged circle compares equal across rebuilds', () {
      expect(build(), equals(build()));
      expect(build().hashCode, equals(build().hashCode));
    });

    test('a radius change is still detected', () {
      expect(build(radius: 5000), isNot(equals(build(radius: 10000))));
    });
  });
}
