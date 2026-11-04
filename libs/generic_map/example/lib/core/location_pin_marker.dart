import 'package:flutter/material.dart';
import 'package:generic_map/generic_map.dart';
// ignore: depend_on_referenced_packages
import 'package:latlong2/latlong.dart';

import 'triangle_clipper.dart';

class LocationPinMarker extends StatelessWidget {
  final String? content;

  const LocationPinMarker({
    super.key,
    this.content,
  });

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            constraints: BoxConstraints(
              maxWidth: 240,
            ),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: const [
                BoxShadow(
                  color: Color(0x1464748B),
                  offset: Offset(2, 4),
                  blurRadius: 8,
                ),
              ],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.location_on,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 8),
                if (content == null)
                  Text(
                    'Set location',
                  ),
                if (content != null) ...[
                  Text(
                    content!,
                    style: TextStyle(
                      color: Colors.black,
                    ),
                  ),
                ],
              ],
            ),
          ),
          ClipPath(
            clipper: TriangleClipper(),
            child: Container(
              color: Colors.white,
              height: 11,
              width: 16,
            ),
          )
        ],
      ),
    );
  }

  CenterMarker get centerMarker => CenterMarker(
        widget: this,
        size: const Size(240, 67),
        alignment: Alignment.topCenter,
      );

  static CustomMarker marker({
    required LatLng position,
    required String imageUrl,
    // final SemanticColor color = SemanticColor.primary,
  }) =>
      CustomMarker(
        id: position.toString(),
        position: position,
        widget: LocationPinMarker(),
        alignment: Alignment(0, 0),
      );
}
