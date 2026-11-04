enum MapProviderEnum {
  googleMaps,
  openStreetMaps,
  mapBox,
  mapBoxSDK,
  mapLibre;

  String get name {
    switch (this) {
      case MapProviderEnum.googleMaps:
        return 'Google Maps';
      case MapProviderEnum.openStreetMaps:
        return 'Open Street Maps';
      case MapProviderEnum.mapBox:
        return 'Map Box';
      case MapProviderEnum.mapBoxSDK:
        return 'Map Box SDK';
      case MapProviderEnum.mapLibre:
        return 'Map Libre';
    }
  }

  static MapProviderEnum fromString(String value) =>
      switch (value.toLowerCase()) {
        'google' => MapProviderEnum.googleMaps,
        'openstreet' => MapProviderEnum.openStreetMaps,
        'mapbox' => MapProviderEnum.mapBox,
        'mapboxsdk' => MapProviderEnum.mapBoxSDK,
        'maplibre' => MapProviderEnum.mapLibre,
        _ => MapProviderEnum.openStreetMaps
      };
}
