import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:generic_map/interfaces/heat_map_config.dart';

import 'package:latlong2/latlong.dart';

import 'package:generic_map/flutter_map/widget.dart';
import 'package:generic_map/generic_map.dart';
import 'package:generic_map/google_map/widget.dart';
import 'package:generic_map/mapbox_sdk/widget.dart';
import 'package:generic_map/maplibre/maplibre_widget_stub.dart'
    if (dart.library.html) 'package:generic_map/maplibre/maplibre_widget_stub.dart';

// export LatLngBounds
export 'package:flutter_map/flutter_map.dart' show LatLngBounds;

enum MapMoveEventType {
  start,
  idle,
  addressResolved,
}

class MapMovedEvent {
  final LatLng latLng;
  final String? title;
  final String? address;
  final double zoom;
  final LatLngBounds bounds;
  MapMoveEventType type;

  MapMovedEvent({
    required this.latLng,
    this.title,
    this.address,
    required this.zoom,
    required this.bounds,
    required this.type,
  });

  Place get place => Place(
        latLng,
        address ?? '',
        title ?? '',
      );

  @Deprecated('Use type==MapMoveEventType.start instead')
  bool get isStart => type == MapMoveEventType.start;

  MapMovedEvent copyWith({
    MapMoveEventType? type,
    LatLng? latLng,
    String? title,
    String? address,
    double? zoom,
    LatLngBounds? bounds,
  }) {
    return MapMovedEvent(
      type: type ?? this.type,
      latLng: latLng ?? this.latLng,
      title: title ?? this.title,
      address: address ?? this.address,
      zoom: zoom ?? this.zoom,
      bounds: bounds ?? this.bounds,
    );
  }

  factory MapMovedEvent.start({
    required LatLng latLng,
    required double zoom,
    required LatLngBounds bounds,
  }) =>
      MapMovedEvent(
          latLng: latLng,
          zoom: zoom,
          bounds: bounds,
          type: MapMoveEventType.start);

  factory MapMovedEvent.idle({
    required LatLng latLng,
    required double zoom,
    required LatLngBounds bounds,
  }) =>
      MapMovedEvent(
          latLng: latLng,
          zoom: zoom,
          bounds: bounds,
          type: MapMoveEventType.idle);

  factory MapMovedEvent.addressResolved({
    required LatLng latLng,
    required double zoom,
    required LatLngBounds bounds,
    String? title,
    String? address,
  }) =>
      MapMovedEvent(
        latLng: latLng,
        zoom: zoom,
        bounds: bounds,
        title: title,
        address: address,
        type: MapMoveEventType.addressResolved,
      );

  @override
  String toString() {
    return 'MapMovedEvent(type: $type, latLng: $latLng, title: $title, address: $address, zoom: $zoom, bounds: $bounds)';
  }
}

class GenericMap extends StatefulWidget {
  final MapViewMode mode;
  final CenterMarker Function(
    BuildContext context,
    GlobalKey key,
    String? address,
  )? centerMarkerBuilder;
  final AddressResolver? addressResolver;
  final PlatformMapProviderSettings platformMapProviderSettings;
  final MapboxSdkOptions? mapboxSdkOptions;
  final MapboxOptions? mapboxOptions;
  final MapLibreOptions? mapLibreOptions;
  final OpenStreetMapsOptions? openStreetMapOptions;
  final GoogleMapsOptions? googleMapOptions;
  final bool interactive;
  final Function(MapViewController)? onControllerReady;
  final Function(MapMovedEvent)? onMapMoved;
  final Place initialLocation;
  final double initialZoom;
  final List<PolyLineLayer> polylines;
  final List<CustomMarker> markers;
  final List<CircleMarker> circleMarkers;
  final bool showMyLocation;
  final Duration addressResolveDebounce;
  final Duration? mapMoveDebounce;
  final bool enableAddressResolve;
  final List<HeatmapConfig> heatmapConfig;

  /// Padding for fitBounds
  final EdgeInsets padding;
  final EdgeInsets actionsPadding;
  final bool useCachedTiles;
  final bool isPolylineDrawEnabled;
  final PolyEditor? polyEditor;

  final Function(List<LatLng>)? onPolylineDrawn;
  final Function(String polylineId, List<LatLng> points)? onPolylineEdited;

  GenericMap({
    super.key,
    this.platformMapProviderSettings = const PlatformMapProviderSettings(
        defaultProvider: MapProviderEnum.openStreetMaps),
    this.initialLocation = const Place(
      LatLng(37.7858, -122.4064),
      'San Francisco, CA',
      'San Francisco',
    ),
    this.initialZoom = 14,
    this.mode = MapViewMode.static,
    this.onControllerReady,
    this.polylines = const [],
    this.onMapMoved,
    this.useCachedTiles = false,
    this.interactive = false,
    this.padding = EdgeInsets.zero,
    this.actionsPadding = EdgeInsets.zero,
    this.markers = const <CustomMarker>[],
    this.centerMarkerBuilder,
    this.addressResolver,
    this.circleMarkers = const [],
    this.isPolylineDrawEnabled = false,
    this.polyEditor,
    this.onPolylineDrawn,
    this.onPolylineEdited,
    this.mapboxSdkOptions,
    this.mapboxOptions,
    this.mapLibreOptions,
    this.enableAddressResolve = false,
    this.openStreetMapOptions,
    this.googleMapOptions,
    this.heatmapConfig = const [],
    this.showMyLocation = true,
    this.addressResolveDebounce = const Duration(milliseconds: 300),
    this.mapMoveDebounce,
  }) {
    assert(
      mode == MapViewMode.picker && centerMarkerBuilder != null ||
          mode == MapViewMode.static,
      'centerMarkerBuilder must be provided when mode is MapViewMode.picker',
    );
    assert(
      mode == MapViewMode.picker && addressResolver != null ||
          mode == MapViewMode.static,
      'addressResolver must be provided when mode is MapViewMode.picker',
    );
    assert(
      mode == MapViewMode.picker && interactive || mode == MapViewMode.static,
      'interactive must be true when mode is MapViewMode.picker',
    );
  }

  @override
  State<GenericMap> createState() => _GenericMapState();
}

class _GenericMapState extends State<GenericMap> with TickerProviderStateMixin {
  String? currentAddress;
  final markerKey = GlobalKey();
  Timer? _addressResolveTimer;
  Timer? _mapMoveTimer;
  int _reqId = 0;
  bool _isDragging = false;
  MapMovedEvent? _latestMove;

  Duration get _idleDebounce =>
      widget.mapMoveDebounce ?? const Duration(milliseconds: 500);
  Duration get _addrDebounce => widget.addressResolveDebounce;

  MapProviderEnum get provider =>
      widget.platformMapProviderSettings.getProvider;

  @override
  void initState() {
    currentAddress ??= widget.initialLocation.address;
    final platform = currentPlatform();
    switch (platform) {
      case MapProviderPlatform.desktop:
        if (provider == MapProviderEnum.googleMaps ||
            provider == MapProviderEnum.mapBoxSDK ||
            provider == MapProviderEnum.mapLibre) {
          assert(false,
              'Desktop platform does not support ${provider.toString()}');
        }
        break;
      case MapProviderPlatform.android:
        break;
      case MapProviderPlatform.ios:
        break;
      case MapProviderPlatform.web:
        if (provider == MapProviderEnum.mapBoxSDK ||
            provider == MapProviderEnum.mapLibre) {
          assert(false, 'Web platform does not support ${provider.toString()}');
        }
        break;
    }
    switch (provider) {
      case MapProviderEnum.googleMaps:
        break;
      case MapProviderEnum.mapBoxSDK:
        assert(widget.mapboxSdkOptions != null, 'mapboxSdkOptions is required');
        break;
      case MapProviderEnum.mapLibre:
        assert(widget.mapLibreOptions != null, 'mapLibreOptions is required');
        break;
      case MapProviderEnum.openStreetMaps:
        break;
      case MapProviderEnum.mapBox:
        assert(widget.mapboxOptions != null, 'mapboxOptions is required');
        break;
    }
    super.initState();
  }

  @override
  void dispose() {
    _addressResolveTimer?.cancel();
    _mapMoveTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        switch (provider) {
          MapProviderEnum.googleMaps => GoogleMapView(
              mode: widget.mode,
              options: widget.googleMapOptions,
              padding: widget.padding,
              buttonsPadding: widget.actionsPadding,
              onControllerReady: widget.onControllerReady,
              initialLocation: widget.initialLocation,
              initialZoom: widget.initialZoom,
              markers: widget.markers,
              circleMarkers: widget.circleMarkers,
              polylines: widget.polylines,
              interactive: widget.interactive,
              onMapMoved: _onMapMove,
              viewportSize: viewPortSize,
              heatmapConfig: widget.heatmapConfig,
              showMyLocation: widget.showMyLocation,
              onPolylineEdited: widget.onPolylineEdited,
              isPolylineDrawEnabled: widget.isPolylineDrawEnabled,
              onPolylineDrawn: widget.onPolylineDrawn,
              polyEditor: widget.polyEditor,
            ),
          MapProviderEnum.mapBoxSDK => MapBoxView(
              padding: widget.padding,
              buttonsPadding: widget.actionsPadding,
              markers: widget.markers,
              polylines: widget.polylines,
              circleMarkers: widget.circleMarkers,
              options: widget.mapboxSdkOptions!,
              initialLocation: widget.initialLocation,
              initialZoom: widget.initialZoom,
              interactive: widget.interactive,
              onMapMoved: _onMapMove,
              heatmapConfig: widget.heatmapConfig,
              onControllerReady: widget.onControllerReady,
              showMyLocation: widget.showMyLocation,
            ),
          MapProviderEnum.mapLibre => !kIsWeb
              ? MapLibreView(
                  padding: widget.padding,
                  buttonsPadding: widget.actionsPadding,
                  markers: widget.markers,
                  polylines: widget.polylines,
                  circleMarkers: widget.circleMarkers,
                  options: widget.mapLibreOptions!,
                  initialLocation: widget.initialLocation,
                  initialZoom: widget.initialZoom,
                  interactive: widget.interactive,
                  onMapMoved: _onMapMove,
                  heatmapConfig: widget.heatmapConfig,
                  onControllerReady: widget.onControllerReady,
                  showMyLocation: widget.showMyLocation,
                )
              : Text("MapLibre is not supported on web platform"),
          MapProviderEnum.openStreetMaps ||
          MapProviderEnum.mapBox =>
            FlutterMapView(
              mode: widget.mode,
              provider: provider,
              onControllerReady: widget.onControllerReady,
              initialLocation: widget.initialLocation,
              initialZoom: widget.initialZoom,
              padding: widget.padding,
              polylines: widget.polylines,
              interactive: widget.interactive,
              useCachedTiles: widget.useCachedTiles,
              markerKey: markerKey,
              circleMarkers: widget.circleMarkers,
              mapboxOptions: widget.mapboxOptions,
              openStreetMapOptions:
                  widget.openStreetMapOptions ?? OpenStreetMapsOptions(),
              centerMarker: widget.centerMarkerBuilder
                  ?.call(context, markerKey, currentAddress),
              onMapMoved: _onMapMove,
              markers: widget.markers,
              polyEditor: widget.polyEditor,
              isPolylineDrawEnabled: widget.isPolylineDrawEnabled,
              onPolylineDrawn: widget.onPolylineDrawn,
              heatmapConfig: widget.heatmapConfig,
              showMyLocation: widget.showMyLocation,
            ),
        },
        if (widget.mode == MapViewMode.picker)
          Center(
            child: _buildCenterMarker(context, markerKey),
          )
      ],
    );
  }

  Widget _buildCenterMarker(BuildContext context, GlobalKey key) {
    final builder =
        widget.centerMarkerBuilder!.call(context, key, currentAddress);
    final aligment = builder.alignment;
    final offset = Offset(
      aligment.x * builder.size.width / 2,
      aligment.y * builder.size.height / 2,
    );
    return Transform.translate(
      offset: offset,
      child: builder.widget,
    );
  }

  Future<void> _onMapMove(
    LatLng latLng,
    double zoom,
    LatLngBounds bounds,
    MapMoveEventType eventType,
  ) async {
    // Snapshot latest
    _latestMove = MapMovedEvent(
        latLng: latLng, zoom: zoom, bounds: bounds, type: eventType);
    if (eventType == MapMoveEventType.start) {
      // Emit START immediately
      widget.onMapMoved?.call(_latestMove!);
      return;
    }

    // Any new movement cancels pending idle/address work
    _mapMoveTimer?.cancel();
    _addressResolveTimer?.cancel();
    _isDragging = true;

    // Arm idle debounce (only thing scheduled from move)
    _mapMoveTimer = Timer(_idleDebounce, () {
      if (!mounted || _latestMove == null) return;

      _isDragging = false;
      final move = _latestMove!;

      // Emit IDLE
      widget.onMapMoved?.call(MapMovedEvent.idle(
        latLng: move.latLng,
        zoom: move.zoom,
        bounds: move.bounds,
      ));

      if (!widget.enableAddressResolve) return;
      // Now (and only now) arm the address debounce
      _addressResolveTimer = Timer(_addrDebounce, () async {
        if (!mounted || _latestMove == null || _isDragging) return;

        final myId = ++_reqId;
        final fresh = _latestMove!;

        Place? full;
        try {
          full = await widget.addressResolver?.call(provider, fresh.latLng);
        } catch (_) {
          // log if you want
        }
        // Ignore stale responses
        if (!mounted || myId != _reqId || _isDragging) return;

        final event = MapMovedEvent.addressResolved(
          latLng: fresh.latLng,
          zoom: fresh.zoom,
          bounds: fresh.bounds,
          title: full?.title,
          address: full?.address,
        );
        widget.onMapMoved?.call(event);
        if (mounted) setState(() => currentAddress = full?.address);
      });
    });
  }

  Size get viewPortSize => MediaQuery.sizeOf(context);
}
