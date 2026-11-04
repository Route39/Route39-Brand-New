import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:latlong2/latlong.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;
import 'package:generic_map/generic_map.dart';

import 'main.directories.g.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // await Geolocator.requestPermission();
  await dotenv.load();
  runApp(
    const WidgetbookApp(),
  );
  // runApp(const FullScreenMap());
}

@widgetbook.App()
class WidgetbookApp extends StatelessWidget {
  const WidgetbookApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Widgetbook.material(
      directories: [
        ...directories,
      ],
      themeMode: ThemeMode.system,
      addons: [
        InspectorAddon(),
        DeviceFrameAddon(
          devices: Devices.all,
        ),
        AlignmentAddon(
          initialAlignment: Alignment.center,
        ),
      ],
    );
  }
}

class FullScreenMap extends StatelessWidget {
  const FullScreenMap({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = true;
    return MaterialApp(
      title: 'Basic Material App',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      debugShowCheckedModeBanner: false,
      home: SizedBox(
        width: MediaQuery.sizeOf(context).width,
        height: MediaQuery.sizeOf(context).height,
        child: GenericMap(
          interactive: true,
          onMapMoved: (event) {
            if (kDebugMode) {
              print("Map moved to: $event");
            }
          },
          addressResolver: (p0, p1) async {
            return Place(
              p1,
              'San Francisco, CA',
              'San Francisco',
            );
          },
          platformMapProviderSettings: PlatformMapProviderSettings(
            defaultProvider: MapProviderEnum.mapBoxSDK,
          ),
          googleMapOptions: GoogleMapsOptions(
            preset: isDark
                ? GoogleMapStylePreset.dark
                : GoogleMapStylePreset.standard,
          ),
          mapLibreOptions: MapLibreOptions(
            apiKey: dotenv.maybeGet('MAPLIBRE_API_KEY') ?? "",
            styleUrl: isDark
                ? dotenv.maybeGet('MAPLIBRE_STYLE_DARK_URL')
                : dotenv.maybeGet('MAPLIBRE_STYLE_URL'),
          ),
          mapboxOptions: MapboxOptions(
            accessToken: dotenv.maybeGet('MAPBOX_ACCESS_TOKEN') ?? "",
            styleTileSetId: 'navigation-night-v1',
          ),
          mapboxSdkOptions: MapboxSdkOptions(
              accessToken: dotenv.maybeGet('MAPBOX_ACCESS_TOKEN') ?? "",
              style: isDark ? MapboxSdkStyle.dark : MapboxSdkStyle.standard),
          initialZoom: 19,
          initialLocation: const Place(
            LatLng(37.791714, -122.392249),
            'San Francisco, CA',
            'San Francisco',
          ),
        ),
      ),
    );
  }
}
