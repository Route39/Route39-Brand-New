import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:gm_google_maps_flutter/google_maps_flutter.dart' as gmaps;
import 'package:latlong2/latlong.dart';
import 'package:generic_map/utils/widget_to_image.dart';
import 'package:image/image.dart' as img;

class CustomMarker {
  final String id;
  final LatLng position;
  final Widget widget;
  final String? fallbackAssetPath;
  final String? fallbackAssetPackage;
  final double width;
  final double height;

  final Alignment alignment;
  final int rotation;

  CustomMarker({
    required this.id,
    required this.position,
    required this.widget,
    this.width = 50,
    this.height = 50,
    this.alignment = Alignment.center,
    this.rotation = 0,
    this.fallbackAssetPath,
    this.fallbackAssetPackage,
  });

  @override
  String toString() {
    return 'WidgetMarker(position: $position, widget: $widget, rotation: $rotation, width: $width, height: $height, alignment: $alignment, fallbackAssetPath: $fallbackAssetPath, fallbackAssetPackage: $fallbackAssetPackage)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is CustomMarker &&
            other.id == id &&
            other.position == position &&
            other.widget == widget &&
            other.rotation == rotation &&
            other.width == width &&
            other.height == height &&
            other.alignment == alignment &&
            other.fallbackAssetPath == fallbackAssetPath &&
            other.fallbackAssetPackage == fallbackAssetPackage;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        position.hashCode ^
        widget.hashCode ^
        rotation.hashCode ^
        width.hashCode ^
        height.hashCode ^
        alignment.hashCode ^
        fallbackAssetPath.hashCode ^
        fallbackAssetPackage.hashCode;
  }

  Future<Uint8List> getUint8List() async {
    if (fallbackAssetPackage != null) {
      final byteData = await rootBundle.load(fallbackAssetPackage != null
          ? 'packages/$fallbackAssetPackage/$fallbackAssetPath'
          : fallbackAssetPath!);
      final resizedImage = await _resizeImage(
        byteData.buffer.asUint8List(),
        width.toInt(),
        height.toInt(),
      );
      return resizedImage;
    } else {
      final Uint8List markerImage = await createImageFromWidget(
        Directionality(
          textDirection: TextDirection.ltr,
          child: SizedBox(
            width: width,
            height: height,
            child: widget,
          ),
        ),
        waitToRender: Duration(milliseconds: 500),
        view: WidgetsBinding.instance.platformDispatcher.views.first,
      );
      final resizedImage =
          await _resizeImage(markerImage, width.toInt(), height.toInt());
      return resizedImage;
    }
  }

  Future<Uint8List> _resizeImage(
      Uint8List imageBytes, int width, int height) async {
    img.Image? originalImage = img.decodeImage(imageBytes);
    if (originalImage == null) {
      throw Exception('Failed to decode image');
    }
    final pixelRatio =
        WidgetsBinding.instance.platformDispatcher.views.first.devicePixelRatio;

    // Resize
    img.Image resizedImage = img.copyResize(
      originalImage,
      width: width * pixelRatio.toInt(),
      height: height * pixelRatio.toInt(),
    );

    // Encode back to Uint8List (e.g., as PNG)
    return Uint8List.fromList(img.encodePng(resizedImage));
  }

  Future<gmaps.BitmapDescriptor> getBitmapDescriptor() async {
    final Uint8List markerImage = await getUint8List();
    return gmaps.BitmapDescriptor.bytes(
      markerImage,
      imagePixelRatio: WidgetsBinding
          .instance.platformDispatcher.views.first.devicePixelRatio,
    );
  }

  Offset getAnchor() => Offset(
        (1 - alignment.x) / 2,
        (1 - alignment.y) / 2,
      );
}
