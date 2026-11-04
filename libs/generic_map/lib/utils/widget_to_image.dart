import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

/// Creates a PNG image from the given widget by spinning up an element and render tree.
///
/// The final image will be of size [imageSize] and the widget will be laid out
/// with the given [logicalSize]. By default both are calculated from [view].
///
/// Inlined from package:widget_to_marker to avoid depending on google_maps_flutter.
Future<Uint8List> createImageFromWidget(
  Widget widget, {
  Size? logicalSize,
  required Duration waitToRender,
  required ui.FlutterView view,
  Size? imageSize,
}) async {
  final RenderRepaintBoundary repaintBoundary = RenderRepaintBoundary();
  logicalSize ??= view.physicalSize / view.devicePixelRatio;
  imageSize ??= view.physicalSize;

  final RenderView renderView = RenderView(
    view: view,
    child: RenderPositionedBox(
        alignment: Alignment.center, child: repaintBoundary),
    configuration: ViewConfiguration(
      physicalConstraints:
          BoxConstraints.tight(logicalSize) * view.devicePixelRatio,
      logicalConstraints: BoxConstraints.tight(logicalSize),
      devicePixelRatio: view.devicePixelRatio,
    ),
  );

  final PipelineOwner pipelineOwner = PipelineOwner();
  final BuildOwner buildOwner = BuildOwner(focusManager: FocusManager());

  pipelineOwner.rootNode = renderView;
  renderView.prepareInitialFrame();

  final RenderObjectToWidgetElement<RenderBox> rootElement =
      RenderObjectToWidgetAdapter<RenderBox>(
    container: repaintBoundary,
    child: widget,
  ).attachToRenderTree(buildOwner);

  buildOwner.buildScope(rootElement);

  await Future.delayed(waitToRender);

  buildOwner.buildScope(rootElement);
  buildOwner.finalizeTree();

  pipelineOwner.flushLayout();
  pipelineOwner.flushCompositingBits();
  pipelineOwner.flushPaint();

  final ui.Image image = await repaintBoundary.toImage(
      pixelRatio: imageSize.width / logicalSize.width);
  final ByteData? byteData =
      await image.toByteData(format: ui.ImageByteFormat.png);

  return byteData!.buffer.asUint8List();
}
