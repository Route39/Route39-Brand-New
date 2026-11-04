# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`generic_map` is a Flutter package that provides a unified API over multiple map providers: Google Maps, flutter_map (OpenStreetMap, Mapbox tiles), mapbox_maps_flutter (Mapbox SDK), and maplibre_gl. It solves cross-platform mapping needs by abstracting provider-specific APIs into a consistent interface.

**Key Features:**

- Single API for multiple map providers
- Widget markers for all providers (including Google Maps and Mapbox SDK via custom rendering)
- Declarative marker/polyline/polygon management
- Enhanced caching for flutter_map
- Debouncing for address resolution and map movement
- Animation support

## Development Commands

```bash
# Install dependencies
flutter pub get

# Analyze code
flutter analyze

# Run example app
cd example
flutter pub get
flutter run

# Check formatting
dart format --set-exit-if-changed .

# Format code
dart format .
```

**Note:** This package has no test suite currently (only example app for manual testing).

## Architecture

### Provider Abstraction Strategy

The library uses a factory pattern to switch between map providers at runtime based on platform:

1. **Main Entry Point:** `GenericMap` widget (lib/widget.dart)
   - Accepts platform-specific provider settings via `PlatformMapProviderSettings`
   - Routes to appropriate provider widget based on platform and configuration
   - Manages common state (address resolution, debouncing, center marker)

2. **Provider Implementations:** Each map provider has its own directory:
   - `google_map/` - Google Maps Flutter implementation
   - `flutter_map/` - OpenStreetMap and Mapbox tile layers
   - `mapbox_sdk/` - Mapbox Maps Flutter SDK
   - `maplibre/` - MapLibre GL (native rendering)

3. **Unified Interfaces:** (lib/interfaces/)
   - `MapViewController` - Abstract controller for camera movement, bounds fitting
   - `CustomMarker` - Provider-agnostic marker model
   - `PolyLineLayer` - Provider-agnostic polyline model
   - `CircleMarker` - Provider-agnostic circle model
   - `Place` - Location with address/title
   - `AddressResolver` - Callback for geocoding

### Provider Implementation Structure

Each provider follows this pattern:

``` shell
<provider>/
├── widget.dart       # Main provider widget (e.g., GoogleMapView, FlutterMapView)
├── controller.dart   # MapViewController implementation
├── parser.dart       # Converts generic models to provider-specific types
└── options.dart      # Provider-specific configuration
```

**Key Files:**

- `lib/widget.dart:205-437` - Core map movement handling with dual debouncing (idle + address)
- `lib/platform_map_provider_settings.dart` - Platform detection and provider selection logic
- `lib/google_map/marker_generator_v2.dart` - Converts Flutter widgets to bitmap markers for Google Maps

### Widget Marker Rendering

**Challenge:** Google Maps and Mapbox SDK only accept bitmap markers, not Flutter widgets.

**Solution:**

- `widget_to_marker` package dependency (pubspec.yaml:23)
- Google Maps: Custom bitmap generation via overlay rendering
- Mapbox SDK: Similar approach using snapshot rendering
- flutter_map: Native widget support via `flutter_map` ecosystem

### Map Movement & Address Resolution

The library implements a sophisticated debouncing strategy in `lib/widget.dart:374-436`:

1. **Start event** - Fired immediately when map begins moving
2. **Idle debounce** - Timer starts after movement stops (default 500ms)
3. **Address debounce** - Secondary timer after idle (default 300ms)
4. **Request ID tracking** - Prevents stale geocoding responses from updating UI

This prevents excessive API calls during drag gestures while ensuring responsive feedback.

## Platform & Provider Support Matrix

| Platform | Google Maps | flutter_map (OSM/Mapbox) | Mapbox SDK | MapLibre |
|----------|-------------|--------------------------|------------|----------|
| Android  | ✅          | ✅                       | ✅         | ✅       |
| iOS      | ✅          | ✅                       | ✅         | ✅       |
| Web      | ✅          | ✅                       | ❌         | ❌       |
| Desktop  | ❌          | ✅                       | ❌         | ❌       |

**Platform detection:** See `lib/platform_map_provider_settings.dart:43-53`

**Important:** The library asserts at runtime if an unsupported provider is selected for a platform (lib/widget.dart:225-259).

## Common Development Patterns

### Adding a New Feature to All Providers

1. Define interface in `lib/interfaces/` (e.g., new marker type)
2. Update parser in each provider's `parser.dart`
3. Implement in each provider's `widget.dart`
4. Update `GenericMap` to pass feature through to provider widgets
5. Test in example app with multiple providers

### Adding Provider-Specific Options

1. Create or update options class in `<provider>/options.dart`
2. Add field to `GenericMap` constructor in `lib/widget.dart`
3. Pass through to provider widget in switch statement (lib/widget.dart:274-351)
4. Document in README.md

### Debugging Provider-Specific Issues

Each provider has different rendering behavior:

- **Google Maps/Mapbox SDK:** Native platform views (performance caveats on Android)
- **flutter_map:** Pure Flutter canvas rendering (better for desktop/web)
- **MapLibre:** Native OpenGL rendering

When debugging, check which provider is active via `widget.platformMapProviderSettings.getProvider`.

## Key Dependencies

- `gm_google_maps_flutter` (path) - Renamed fork of google_maps_flutter with editable polyline/polygon support (web). Bundles `gm_google_maps_flutter_platform_interface`, `gm_google_maps_flutter_web`, `gm_google_maps_flutter_android`, `gm_google_maps_flutter_ios` as path deps in `packages/packages/google_maps_flutter/`.
- `flutter_map: ^8.2.2` - OSM/Mapbox tile rendering
- `mapbox_maps_flutter: ^2.12.0` - Mapbox native SDK
- `flutter_map_tile_caching: ^10.1.1` - Disk caching for flutter_map
- `latlong2: ^0.9.1` - Geographic coordinate type (used throughout)

**Note:** `widget_to_marker` was inlined into `lib/utils/widget_to_image.dart` to avoid its transitive dependency on the original `google_maps_flutter`.

**Note:** `maplibre_gl` is commented out in pubspec.yaml due to WASM build issues on web (see CHANGELOG 0.9.9).

## Known Limitations

1. **No Test Coverage:** Library currently relies on example app for testing
2. **MapLibre Disabled:** Commented out due to web compatibility issues (pubspec.yaml:27)
3. **iOS Location Marker:** Disabled on flutter_map due to device-specific issues (CHANGELOG 0.8.9)
4. **Marker ID Stability:** Markers must maintain stable IDs across updates (added 0.10.0)

## Dark Mode & Theming

All providers now support dark mode and custom styling:

### Google Maps (lib/google_map/options.dart)

**Preset Styles:**

```dart
GoogleMapsOptions(
  preset: GoogleMapStylePreset.dark,  // or .standard, .silver, .retro, .night, .aubergine
)
```

**Custom JSON:**

```dart
GoogleMapsOptions(
  customStyleJson: yourJsonString,  // Generate at https://mapstyle.withgoogle.com/
)
```

**Cloud Map ID:**

```dart
GoogleMapsOptions(
  cloudMapId: 'your-cloud-map-id',  // Requires Google Cloud Console setup
)
```

**Priority:** customStyleJson > preset > cloudMapId

### flutter_map (lib/flutter_map/options.dart:28-56)

Uses `MapboxStyle` enum for tile layer styling:

```dart
MapboxOptions(
  styleTileSetId: 'dark-v11',  // or 'navigation-night-v1', 'traffic-night-v2', etc.
)
```

### Mapbox SDK (lib/mapbox_sdk/options.dart:3-25)

Uses `MapboxSdkStyle` enum:

```dart
MapboxSdkOptions(
  style: MapboxSdkStyle.dark,  // or .standard, .outdoors, .satellite, etc.
)
```

### MapLibre (lib/maplibre/options.dart:1-13)

Uses custom style URLs:

```dart
MapLibreOptions(
  styleUrl: 'https://your-dark-style-url',
)
```

**Note:** Currently commented out due to web compatibility (CHANGELOG 0.9.9)

### Adding New Style Presets to Google Maps

1. Generate JSON at <https://mapstyle.withgoogle.com/>
2. Add to `assets/map_styles/<style-name>.json`
3. Add enum value to `GoogleMapStylePreset` in `lib/google_map/options.dart`
4. Update `assetPath` getter with new case
5. Update pubspec.yaml assets if needed (directory pattern covers all files)

## Version Management

Current version: **0.11.1** (pubspec.yaml:3)

**Distribution:** Git-based (currently `publish_to: none` due to path dependencies on the forked `gm_google_maps_flutter` packages). The forked Google Maps packages are renamed under the `gm_` prefix and bundled in `packages/packages/google_maps_flutter/`. Consumers just add `generic_map` as a git dependency — no `dependency_overrides` needed. To publish to pub.dev, first publish the `gm_` packages with version constraints instead of path deps.

When incrementing version:

1. Update `version:` in pubspec.yaml
2. Add entry to CHANGELOG.md with date and changes
3. Commit with message like `feat: <description>` or `fix: <description>`
4. Tag the commit (e.g., `git tag v0.11.1`) so consumers can pin to it

Versioning follows semantic versioning (MAJOR.MINOR.PATCH).

## Example App

Located in `example/` directory. Structure:

``` shell
example/lib/
├── main.dart                  # App entry point
├── core/                      # Shared utilities
└── maps/                      # Map implementation examples
```

Run example: `cd example && flutter run`

The example demonstrates all supported providers with platform switching.
