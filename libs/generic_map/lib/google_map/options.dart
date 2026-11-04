/// Predefined Google Maps style presets
enum GoogleMapStylePreset {
  /// Standard Google Maps style (default)
  standard,

  /// Dark mode style optimized for low-light environments
  dark,

  /// Silver style with muted colors
  silver,

  /// Retro style with vintage colors
  retro,

  /// Night mode with darker tones
  night,

  /// Aubergine style with purple tones
  aubergine;

  /// Returns the asset path for the preset style JSON
  String get assetPath => switch (this) {
        GoogleMapStylePreset.standard =>
          'packages/generic_map/assets/map_styles/standard.json',
        GoogleMapStylePreset.dark =>
          'packages/generic_map/assets/map_styles/dark.json',
        GoogleMapStylePreset.silver =>
          'packages/generic_map/assets/map_styles/silver.json',
        GoogleMapStylePreset.retro =>
          'packages/generic_map/assets/map_styles/retro.json',
        GoogleMapStylePreset.night =>
          'packages/generic_map/assets/map_styles/night.json',
        GoogleMapStylePreset.aubergine =>
          'packages/generic_map/assets/map_styles/aubergine.json',
      };
}

/// Options for configuring Google Maps appearance and behavior
class GoogleMapsOptions {
  /// Use a predefined style preset (standard, dark, silver, etc.)
  final GoogleMapStylePreset? preset;

  /// Provide custom JSON styling string
  /// Generate custom styles at: https://mapstyle.withgoogle.com/
  final String? customStyleJson;

  /// Use a cloud-based map style ID from Google Cloud Console
  /// Requires configuration in Google Cloud Platform
  final String? cloudMapId;

  const GoogleMapsOptions({
    this.preset,
    this.customStyleJson,
    this.cloudMapId,
  });

  /// Returns true if any style configuration is provided
  bool get hasStyle =>
      preset != null || customStyleJson != null || cloudMapId != null;

  // Value equality is load-bearing, not a nicety. Consumers build these inline
  // from a theme flag (`isDark ? dark : light`), so a new-but-identical
  // instance arrives on every rebuild. The map widgets compare options with
  // `!=` in `didUpdateWidget`; without `==` that is identity, which reads as a
  // style change and reloads the style on every frame that rebuilds the map.
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is GoogleMapsOptions &&
          runtimeType == other.runtimeType &&
          other.preset == preset &&
          other.customStyleJson == customStyleJson &&
          other.cloudMapId == cloudMapId;

  @override
  int get hashCode => Object.hash(
        preset,
        customStyleJson,
        cloudMapId,
      );
}
