import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:pointer_interceptor/pointer_interceptor.dart';
import 'package:pointer_interceptor/pointer_interceptor.dart';

/// Wraps the rider home "welcome" card (mobile only) so the user can drag it
/// down to reveal the map and drag it up to bring it back.
class CollapsibleWelcomeSheet extends StatefulWidget {
  final Widget child;

  /// Visible height of the card when collapsed (drag handle + top of card).
  final double collapsedHeight;

  const CollapsibleWelcomeSheet({
    super.key,
    required this.child,
    this.collapsedHeight = 130,
  });

  @override
  State<CollapsibleWelcomeSheet> createState() =>
      _CollapsibleWelcomeSheetState();
}

class _CollapsibleWelcomeSheetState extends State<CollapsibleWelcomeSheet>
    with SingleTickerProviderStateMixin {
  static const double _dragSlop = 8; // ignore tiny finger movement (taps)
  static const double _snapDistance = 40; // px needed to switch state
  static const double _maxHeightFraction = 0.8; // card max height (rest = map)

  final GlobalKey _contentKey = GlobalKey();

  /// 1.0 = fully expanded, 0.0 = collapsed.
  late final AnimationController _anim;

  bool _locked = false; // true while collapsed: inner lists don't scroll
  bool _outerAtTop = true;
  int? _pointer;
  bool _dragging = false;
  double _accum = 0;
  double _startValue = 1;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
      vsync: this,
      value: 1,
      duration: const Duration(milliseconds: 250),
    );
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  double get _contentHeight {
    final box = _contentKey.currentContext?.findRenderObject();
    if (box is RenderBox && box.hasSize) return box.size.height;
    return 0;
  }

  double get _range => math.max(0, _contentHeight - widget.collapsedHeight);

  bool _onScroll(ScrollNotification n) {
    if (n.depth == 0 && n.metrics.axis == Axis.vertical) {
      _outerAtTop = n.metrics.pixels <= n.metrics.minScrollExtent + 0.5;
    }
    return false;
  }

  void _onDown(PointerDownEvent e) {
    if (_pointer != null) return;
    _pointer = e.pointer;
    _accum = 0;
    _dragging = false;
  }

  void _onMove(PointerMoveEvent e) {
    if (e.pointer != _pointer) return;
    final dy = e.delta.dy;

    if (!_dragging) {
      _accum += dy;
      if (_accum.abs() < _dragSlop) return;
      _dragging = true;
      _anim.stop();
      _startValue = _anim.value;
    }

    final range = _range;
    if (range <= 0) return;
    // Swipe down: only collapse once the card's content is scrolled to top.
    if (dy > 0 && !_outerAtTop) return;
    // Swipe up: only expand if currently collapsed (else content scrolls).
    if (dy < 0 && _anim.value >= 1) return;

    _anim.value = (_anim.value - dy / range).clamp(0.0, 1.0);
  }

  void _onUp(PointerEvent e) {
    if (e.pointer != _pointer) return;
    _pointer = null;
    if (!_dragging) return;
    _dragging = false;

    final movedDown = (_startValue - _anim.value) * _range;
    double target;
    if (movedDown > _snapDistance) {
      target = 0;
    } else if (movedDown < -_snapDistance) {
      target = 1;
    } else {
      target = _startValue >= 0.5 ? 1 : 0;
    }
    setState(() => _locked = target < 1);
    _anim.animateTo(target, curve: Curves.easeOut);
  }

  @override
  Widget build(BuildContext context) =>
      PointerInterceptor(child: _buildSheet(context));

  Widget _buildSheet(BuildContext context) {
    final behavior = ScrollConfiguration.of(context).copyWith(
      physics: _locked ? const NeverScrollableScrollPhysics() : null,
    );

    return ScrollConfiguration(
      behavior: behavior,
      child: NotificationListener<ScrollNotification>(
        onNotification: _onScroll,
        child: Listener(
          behavior: HitTestBehavior.translucent,
          onPointerDown: _onDown,
          onPointerMove: _onMove,
          onPointerUp: _onUp,
          onPointerCancel: _onUp,
          child: AnimatedBuilder(
            animation: _anim,
            builder: (context, _) {
              final h = _contentHeight;
              final range = _range;
              double factor = 1;
              if (h > 0 && range > 0) {
                final visible = widget.collapsedHeight + range * _anim.value;
                factor = (visible / h).clamp(0.0, 1.0);
              }
              return ClipRect(
                clipper: _BottomOnlyClipper(),
                child: Align(
                  alignment: Alignment.topCenter,
                  widthFactor: 1,
                  heightFactor: factor,
                  child: Stack(
                    key: _contentKey,
                    fit: StackFit.passthrough,
                    children: [
                      LayoutBuilder(
                        builder: (context, c) => ConstrainedBox(
                          constraints: BoxConstraints(
                            maxHeight: c.hasBoundedHeight
                                ? c.maxHeight * _maxHeightFraction
                                : double.infinity,
                          ),
                          child: widget.child,
                        ),
                      ),
                      Positioned(
                        top: 8,
                        left: 0,
                        right: 0,
                        child: IgnorePointer(
                          child: Center(
                            child: Container(
                              width: 40,
                              height: 4,
                              decoration: BoxDecoration(
                                color: Colors.grey.shade300,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

/// Clips only what hangs below the (shrunk) card; keeps the top shadow/edges.
class _BottomOnlyClipper extends CustomClipper<Rect> {
  @override
  Rect getClip(Size size) =>
      Rect.fromLTRB(-24, -24, size.width + 24, size.height);

  @override
  bool shouldReclip(covariant CustomClipper<Rect> oldClipper) => false;
}