import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

/// Defines the interpolation method used for heatmap color and weight.
enum HeatmapInterpolation {
  /// Linear interpolation.
  linear,

  /// Exponential interpolation.
  exponential,

  /// Cubic Bezier interpolation.
  cubicBezier,
}

/// Defines the available references for heatmap expressions.
enum HeatmapReference {
  /// Heatmap density reference.
  heatmapDensity,

  /// Zoom level reference.
  zoom,
}

/// Configuration class for heatmap properties, supporting multiple map platforms.
class HeatmapConfig {
  /// The radius of the heatmap points in pixels.
  final double heatmapRadius;

  /// The overall opacity of the heatmap layer.
  final double heatmapOpacity;

  /// The intensity of the heatmap, affecting the color density.
  final double heatmapIntensity;

  /// The interpolation method used for color and weight calculations.
  final HeatmapInterpolation interpolationMethod;

  /// List of colors used for the heatmap gradient.
  List<Color> colors;

  /// List of stop values for the color gradient (0.0 to 1.0).
  List<double> stops;

  /// List of zoom levels for controlling heatmap weight.
  List<double> zoomStops;

  /// List of weight values corresponding to zoom levels.
  List<double> zoomWeights;

  /// The reference property for interpolation.
  final HeatmapReference reference;

  /// List of LatLng points representing heatmap data.
  final List<LatLng> points;

  /// Creates a [HeatmapConfig] instance.
  HeatmapConfig({
    this.heatmapRadius = 20.0,
    this.heatmapOpacity = 0.3,
    this.heatmapIntensity = 1.0,
    this.interpolationMethod = HeatmapInterpolation.linear,
    this.colors = const [
      Colors.blue,
      Colors.green,
      Colors.yellow,
      Colors.orange,
      Colors.red,
    ],
    this.stops = const [0.2, 0.4, 0.6, 0.8, 1.0],
    this.zoomStops = const [0.0, 5.0, 10.0],
    this.zoomWeights = const [0.1, 0.5, 1.5],
    this.reference = HeatmapReference.heatmapDensity,
    this.points = const [],
  }) {
    _validate();
    if (reference == HeatmapReference.zoom) {
      setZoomStopsAndWeights(zoomStops, zoomWeights);
    } else {
      setColorsAndStops(colors, stops);
    }
  }

  /// Sets the zoom stop and weight values.
  void setZoomStopsAndWeights(
      List<double> zoomStops, List<double> zoomWeights) {
    this.zoomStops = zoomStops;
    this.zoomWeights = zoomWeights;
  }

  /// Sets the colors and stops for the heatmap gradient.
  void setColorsAndStops(List<Color> colors, List<double> stops) {
    this.colors = colors;
    this.stops = stops;
  }

  /// Generates a list of [MapEntry] for heatmap weight based on zoom levels.
  List<MapEntry<double, double>> getHeatmapWeightEntries() {
    List<MapEntry<double, double>> weightEntries = [];
    for (int i = 0; i < zoomStops.length; i++) {
      weightEntries.add(MapEntry(zoomStops[i], zoomWeights[i]));
    }
    return weightEntries;
  }

  /// Generates a list of [MapEntry] for heatmap color gradient.
  List<MapEntry<double, Color>> getHeatmapColorEntries() {
    List<MapEntry<double, Color>> colorEntries = [];
    for (int i = 0; i < colors.length; i++) {
      colorEntries.add(MapEntry(stops[i], colors[i]));
    }
    return colorEntries;
  }

  List<Object> getHeatmapWeightExpression() {
    List<Object> weightExpression = [
      "interpolate",
      interpolationMethod.toGenericExpression(),
      ['zoom'],
    ];

    List<MapEntry<double, double>> weightEntries = getHeatmapWeightEntries();

    if (weightEntries.isNotEmpty) {
      for (var entry in weightEntries) {
        weightExpression.add(entry.key);
        weightExpression.add(entry.value);
      }
    } else {
      weightExpression.addAll([0.0, 0.1, 5.0, 0.5, 10.0, 1.5]);
    }

    return weightExpression;
  }

  /// Converts the color gradient entries to a generic expression.
  List<Object> getHeatmapColorExpression() {
    List<Object> colorExpression = [
      "interpolate",
      interpolationMethod.toGenericExpression(),
      ['heatmap-density'],
    ];

    if (reference == HeatmapReference.heatmapDensity) {
      colorExpression.add(0.0);
      colorExpression.add("rgba(0, 0, 0, 0)");

      for (var entry in getHeatmapColorEntries()) {
        colorExpression.add(entry.key);
        colorExpression.add(_colorToRgba(entry.value));
      }
    }

    return colorExpression;
  }

  void _validate() {
    //Ensure `zoomStops` and `zoomWeights` have the same length
    if (zoomStops.length != zoomWeights.length) {
      throw ArgumentError(
          "zoomStops (${zoomStops.length}) and zoomWeights (${zoomWeights.length}) must have the same length!");
    }

    //Ensure `stops` and `colors` have the same length
    if (stops.length != colors.length) {
      throw ArgumentError(
          "stops (${stops.length}) and colors (${colors.length}) must have the same length!");
    }

    //Validate `heatmapOpacity` (should be between 0.0 and 1.0)
    if (heatmapOpacity < 0.0 || heatmapOpacity > 1.0) {
      throw ArgumentError("heatmapOpacity must be between 0.0 and 1.0!");
    }

    //Validate `heatmapRadius` (reasonable range)
    if (heatmapRadius <= 0.0 || heatmapRadius > 100.0) {
      throw ArgumentError("heatmapRadius must be between 1.0 and 100.0!");
    }

    //Validate `heatmapIntensity` (should be greater than 0)
    if (heatmapIntensity <= 0.0) {
      throw ArgumentError("heatmapIntensity must be greater than 0!");
    }
  }

  /// Converts a [Color] to an rgba string.
  String _colorToRgba(Color color) {
    return "rgba(${(color.r * 255).toInt()}, ${(color.g * 255).toInt()}, ${(color.b * 255).toInt()}, ${color.a})";
  }
}

/// Extension on [HeatmapInterpolation] to convert it to a generic expression format.
extension HeatmapInterpolationExt on HeatmapInterpolation {
  /// Converts the interpolation method to a generic expression.
  List<Object> toGenericExpression() {
    switch (this) {
      case HeatmapInterpolation.linear:
        return ["linear"];
      case HeatmapInterpolation.exponential:
        return ["exponential", 2];
      case HeatmapInterpolation.cubicBezier:
        return ["cubic-bezier", 0.25, 0.1, 0.25, 1.0];
    }
  }
}
