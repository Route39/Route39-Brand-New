class MapLibreOptions {
  final String? apiKey;
  final String? styleUrl;

  MapLibreOptions({
    this.apiKey,
    this.styleUrl,
  });

  String get styleString => apiKey != null && styleUrl != null
      ? '$styleUrl?key=$apiKey'
      : 'https://demotiles.maplibre.org/style.json';

  // Value equality is load-bearing, not a nicety. Consumers build these inline
  // from a theme flag (`isDark ? dark : light`), so a new-but-identical
  // instance arrives on every rebuild. The map widgets compare options with
  // `!=` in `didUpdateWidget`; without `==` that is identity, which reads as a
  // style change and reloads the style on every frame that rebuilds the map.
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MapLibreOptions &&
          runtimeType == other.runtimeType &&
          other.apiKey == apiKey &&
          other.styleUrl == styleUrl;

  @override
  int get hashCode => Object.hash(
        apiKey,
        styleUrl,
      );
}
