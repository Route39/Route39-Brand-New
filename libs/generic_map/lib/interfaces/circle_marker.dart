import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

class CircleMarker {
  final String id;
  final LatLng position;
  final double radius;
  final Color? color;
  final Color? borderColor;
  final double? borderWidth;

  CircleMarker({
    required this.id,
    required this.position,
    required this.radius,
    this.color,
    this.borderColor,
    this.borderWidth,
  });

  // `CustomMarker` and `PolyLineLayer` already carry value equality; this was
  // the odd one out. Without it the map's `didUpdateWidget` saw a fresh circle
  // list on every rebuild and re-parsed the circles through `setState`, which
  // schedules another frame.
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CircleMarker &&
          runtimeType == other.runtimeType &&
          other.id == id &&
          other.position == position &&
          other.radius == radius &&
          other.color == color &&
          other.borderColor == borderColor &&
          other.borderWidth == borderWidth;

  @override
  int get hashCode => Object.hash(
        id,
        position,
        radius,
        color,
        borderColor,
        borderWidth,
      );
}
