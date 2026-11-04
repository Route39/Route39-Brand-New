import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:generic_map/interfaces/latlng_distance_to.dart';
import 'package:latlong2/latlong.dart';

class PolyLineLayer {
  final String? id;
  final List<LatLng> points;
  final Color? color;
  final double? width;
  final List<Color> gradientColors;
  final bool editable;

  PolyLineLayer({
    this.id,
    required this.points,
    this.color,
    this.width,
    required this.gradientColors,
    this.editable = false,
  });

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is PolyLineLayer &&
        other.id == id &&
        _listEqualsLatLng(other.points, points) &&
        other.color == color &&
        other.width == width &&
        other.editable == editable &&
        listEquals(other.gradientColors, gradientColors);
  }

  @override
  int get hashCode =>
      id.hashCode ^
      points.hashCode ^
      color.hashCode ^
      width.hashCode ^
      editable.hashCode ^
      gradientColors.hashCode;

  @override
  String toString() {
    return 'PolyLineLayer{points: $points, color: $color, width: $width, gradientColors: $gradientColors}';
  }

  bool _listEqualsLatLng(List<LatLng> a, List<LatLng> b) {
    if (a.length != b.length) return false;

    const double tolerance = 0.001;

    for (int i = 0; i < a.length; i++) {
      if (a[i].distanceTo(b[i]) >= tolerance) {
        return false;
      }
    }

    return true;
  }
}
