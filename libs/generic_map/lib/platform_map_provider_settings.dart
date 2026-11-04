import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:generic_map/interfaces/interfaces.dart';

class PlatformMapProviderSettings {
  final MapProviderEnum defaultProvider;
  final MapProviderEnum? desktopProvider;
  final MapProviderEnum? androidProvider;
  final MapProviderEnum? iosProvider;
  final MapProviderEnum? webProvider;

  const PlatformMapProviderSettings({
    required this.defaultProvider,
    this.desktopProvider,
    this.androidProvider,
    this.iosProvider,
    this.webProvider,
  });

  MapProviderEnum get getProvider {
    final platform = currentPlatform();
    switch (platform) {
      case MapProviderPlatform.desktop:
        return desktopProvider ?? defaultProvider;
      case MapProviderPlatform.android:
        return androidProvider ?? defaultProvider;
      case MapProviderPlatform.ios:
        return iosProvider ?? defaultProvider;
      case MapProviderPlatform.web:
        return webProvider ?? defaultProvider;
    }
  }

  // Value equality is load-bearing, not a nicety. Consumers build these inline
  // from a theme flag (`isDark ? dark : light`), so a new-but-identical
  // instance arrives on every rebuild. The map widgets compare options with
  // `!=` in `didUpdateWidget`; without `==` that is identity, which reads as a
  // style change and reloads the style on every frame that rebuilds the map.
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PlatformMapProviderSettings &&
          runtimeType == other.runtimeType &&
          other.defaultProvider == defaultProvider &&
          other.desktopProvider == desktopProvider &&
          other.androidProvider == androidProvider &&
          other.iosProvider == iosProvider &&
          other.webProvider == webProvider;

  @override
  int get hashCode => Object.hash(
        defaultProvider,
        desktopProvider,
        androidProvider,
        iosProvider,
        webProvider,
      );
}

enum MapProviderPlatform {
  desktop,
  android,
  ios,
  web,
}

MapProviderPlatform currentPlatform() {
  if (kIsWeb) {
    return MapProviderPlatform.web;
  } else if (Platform.isAndroid) {
    return MapProviderPlatform.android;
  } else if (Platform.isIOS) {
    return MapProviderPlatform.ios;
  } else {
    return MapProviderPlatform.desktop;
  }
}
