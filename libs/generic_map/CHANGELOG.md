# Changelog

## 0.12.0 (2026-08-12)

- fix: the map no longer resets its camera on unrelated rebuilds. None of the
  options classes carried value equality, but consumers build them inline from
  a theme flag (`isDark ? dark : light`), so a new-but-identical instance
  arrived on every rebuild. `GoogleMapView` compares options with `!=` in
  `didUpdateWidget`, which without `==` was an identity check, so every rebuild
  read as a style change and reloaded the style. In dark mode that path
  rendered `SizedBox.shrink()`, unmounting the `GoogleMap` and remounting it at
  `initialCameraPosition`. Added `==`/`hashCode` to `GoogleMapsOptions`,
  `MapLibreOptions`, `MapboxOptions`, `MapboxSdkOptions`,
  `OpenStreetMapsOptions` and `PlatformMapProviderSettings`.
- fix: a style *re*load keeps the map mounted. Only the first load may blank,
  since only then is there nothing to preserve — `GoogleMap` takes `style` as a
  parameter, so a swap needs no remount. This also fixes the camera reset on a
  genuine light/dark toggle.
- fix: circle and polyline lists are compared element-wise rather than by
  identity, and `CircleMarker` gained the value equality `CustomMarker` and
  `PolyLineLayer` already had. Both update paths previously called `setState`
  from `didUpdateWidget` on every rebuild.

## 0.11.4 (2026-07-12)

- fix: OpenStreetMap/Mapbox raster map no longer turns into a black screen when zoomed in past level 19. The camera `maxZoom` was 20 while the tile layers only render up to `maxZoom: 19`, so flutter_map hid the whole tile layer past that point. Capped the camera at 19 to match the tile coverage.

## 0.11.1 (2026-04-12)

- fix: Google Maps style presets now apply correctly (was rendering unstyled due to async race)
- fix: `cloudMapId` and `preset`/`customStyleJson` no longer conflict when both are set
- fix: Replaced deprecated `cloudMapId` with `mapId` for `google_maps_flutter` compatibility

## 0.11.0 (2026-04-12)

- feat: Editable polylines and polygons for Google Maps (web) via native JS `editable` API
- feat: `PolyLineLayer` now supports `id` and `editable` fields
- feat: `onPolylineEdited` callback on `GenericMap` for receiving edit events with polyline ID and updated points
- feat: `isPolylineDrawEnabled` and `onPolylineDrawn` now work with Google Maps provider (marks polylines as editable on web)
- dependency: Uses forked `google_maps_flutter` with editable shape support (PR flutter/packages#11492)

## 0.10.3 (2025-11-13)

- feat: Added dark mode support for Google Maps with predefined style presets (dark, silver, retro, night, aubergine)
- feat: Added `GoogleMapStylePreset` enum for easy theme switching
- feat: Support for custom JSON styles and cloud-based map IDs in GoogleMapsOptions
- improved: Google Maps now has feature parity with other providers for styling/theming
- updated: Example app demonstrates dark mode toggle for all providers

## 0.10.0 (2025-09-18)

- feat: Added stable marker ids to ensure markers maintain their identity across updates.

## 0.9.18 (2025-09-02)

- feat: Added more robust map movement handling for various cases (Debounce supported now)
- fix: Race condition in address resolution
- deprecated: isStart property in MapMovedEvent

## 0.9.17 (2025-09-01)

- feat: Added debounce timer on address resolution

## 0.9.14 (2025-08-31)

- feat: Added getViewportBounds to the controller.

## 0.9.13 (2025-08-31)

- set max zoom level on fit bounds to prevent over-zooming

## 0.9.10 (2025-07-31)

- fix: Consider MapEventFlingAnimation & zoom events in the map event handling to ensure proper map interaction tracking.

## 0.9.9 (2025-07-23)

- fix: Disabled MapLibre integration to resolve WASM build compatibility issues affecting applications that depend on generic_map.

## 0.9.7 (2025-07-22)

- upgraded flutter_map to 8.2.2 again, fixing web issues with the previous version.
- fixed: Web platform now allowed with Google Maps.

## 0.9.4 (2025-07-21)

- rolled back flutter_map to 8.1.1 due to web issues with the latest version.

## 0.9.0 (2025-07-20)

- New: Introduced more robust `MapMovedEvent` class with additional `bounds` field for enhanced map interaction tracking.

## 0.8.10 (2025-07-17)

- deps: Updated flutter_map to 8.2.1
- improved: Removed flutter_map_cancellable_tile_provider as it is no longer needed with the latest flutter_map version. HTTP package now supports cancellation natively.
- fix: Updated mapbox_maps_flutter to 2.9.1.

## 0.8.9 (2025-06-27)

- fix: Limit open street maps & mapbox static tile layer to zoom level 19
- fix: Disabled showing my location on the flutter_map for now as it interferes with location retrieval on iOS real devices.

## 0.8.7 (2025-06-24)

- fix: fix race condition in Google Maps provider that caused some markers to not to be displayed correctly.
- updated: mapbox_maps_flutter to 2.9.0

## 0.8.5 (2025-06-09)

- fix: Some google Maps drawing issues

## 0.8.4 (2025-06-05)

- chore: Updated maplibre_gl to 0.22.0 which brings Flutter 3.32.0 compatibility.

## 0.8.3 (2025-06-05)

- fixed: Google Maps and Maplibre now correctly handle movement gestures.

## 0.8.0 (2025-05-22)

- Added heatmap support to Google Maps.
- Fixed some marker drawing accuracy issues.
- Added actionsPadding parameter for Mapbox and Google Maps logos.

## 0.7.3 (2025-05-18)

- Added heatmap support to Mapbox SDK, OSM, Mapbox Static and MapLibre providers. (Google Maps provider does not support heatmaps)
- Extensive styling options for heatmaps, including color gradients and radius.

## 0.6.7 (2025-05-16)

- For providers that lack widget support, it prefers drawing using fallbackImagePath to achieve better performance. If fallbackImagePath is not set, it draws the widget on a canvas and then converts it to an image.
- Image resizing correctly respects the device pixel ratio.
- Mapbox SDK styles are more accessible now through an enum.

## 0.6.6 (2025-05-14)

- Added initial zoom level to the map provider settings
- Various bug fixes and improvements

## 0.6.3 (2025-03-24)

- Add copyWith, fromJson, toJson, toString, equality, and hashCode methods to Place class

## 0.6.2 (2025-03-01)

- Some fixes to widget as marker

## 0.6.1 (2025-03-01)

- Add assertions to ensure that the map provider is supported on the platform

## 0.6.0 (2025-03-01)

- Refactor the map provider settings to be more flexible
- Per-platform map provider settings are now available
- Provider specific options are now available
- Updated code to use newer Dart syntax for improved readability

## 0.5.0 (2025-02-27)

- Add support for MapLibre
- Update flutter_map to 8.1.0

## 0.4.1 (2025-02-16)

- Update flutter_map and it's dependencies to 8.0.0

## 0.4.0 (2025-02-08)

- Add support for Official MapBox Maps

## 0.3.5 (2025-01-13)

- Bump flutter_map_tile_caching to 10.0.0
- Bump google_maps_flutter to 2.10.0
- Bump flutter_map_animations to 0.8.0

## 0.3.3 (2024-11-27)

- Adjust polyline color to the theme's primary color

## 0.3.2 (2024-11-27)

- Revert latlng export to generic_map.dart due to conflicted export with Path
- Polyline color is retrieved from the theme's primary color

## 0.3.1 (2024-11-27)

- Add latlng export to generic_map.dart
