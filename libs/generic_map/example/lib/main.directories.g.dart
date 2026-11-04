// dart format width=80
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_import, prefer_relative_imports, directives_ordering

// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// AppGenerator
// **************************************************************************

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:generic_map_widgetbook/maps/google_map_view.dart' as _i3;
import 'package:generic_map_widgetbook/maps/map_box_view.dart' as _i4;
import 'package:generic_map_widgetbook/maps/open_street_map.dart' as _i2;
import 'package:widgetbook/widgetbook.dart' as _i1;

final directories = <_i1.WidgetbookNode>[
  _i1.WidgetbookFolder(
    name: 'flutter_map',
    children: [
      _i1.WidgetbookComponent(
        name: 'FlutterMapView',
        useCases: [
          _i1.WidgetbookUseCase(
            name: 'Default',
            builder: _i2.defaulOpenStreetMap,
          ),
          _i1.WidgetbookUseCase(
            name: 'centerMarker',
            builder: _i2.openStreetMapCenterMarker,
          ),
          _i1.WidgetbookUseCase(
            name: 'circleMarkers',
            builder: _i2.openStreetMapCircleMarkers,
          ),
          _i1.WidgetbookUseCase(
            name: 'heatMap',
            builder: _i2.flutterMapHeatMap,
          ),
          _i1.WidgetbookUseCase(
            name: 'markers',
            builder: _i2.openStreetMapMarkers,
          ),
        ],
      )
    ],
  ),
  _i1.WidgetbookFolder(
    name: 'google_map',
    children: [
      _i1.WidgetbookComponent(
        name: 'GoogleMapView',
        useCases: [
          _i1.WidgetbookUseCase(
            name: 'Default',
            builder: _i3.defaulGoogleMapView,
          ),
          _i1.WidgetbookUseCase(
            name: 'centerMarker',
            builder: _i3.googleMapViewCenterMarker,
          ),
          _i1.WidgetbookUseCase(
            name: 'circleMarkers',
            builder: _i3.openStreetMapCircleMarkers,
          ),
          _i1.WidgetbookUseCase(
            name: 'editMap',
            builder: _i3.googleMapEdit,
          ),
          _i1.WidgetbookUseCase(
            name: 'markers',
            builder: _i3.googleMapViewMarkers,
          ),
        ],
      )
    ],
  ),
  _i1.WidgetbookFolder(
    name: 'mapbox_sdk',
    children: [
      _i1.WidgetbookComponent(
        name: 'MapBoxView',
        useCases: [
          _i1.WidgetbookUseCase(
            name: 'Default',
            builder: _i4.defaulMapBoxView,
          ),
          _i1.WidgetbookUseCase(
            name: 'centerMarker',
            builder: _i4.mapBoxViewCenterMarker,
          ),
          _i1.WidgetbookUseCase(
            name: 'circleMarkers',
            builder: _i4.mapBoxViewCircleMarkers,
          ),
          _i1.WidgetbookUseCase(
            name: 'editMap',
            builder: _i4.mapBoxEdit,
          ),
          _i1.WidgetbookUseCase(
            name: 'heatMap',
            builder: _i4.mapBoxHeatMap,
          ),
          _i1.WidgetbookUseCase(
            name: 'markers',
            builder: _i4.mapBoxViewMarkers,
          ),
        ],
      )
    ],
  ),
];
