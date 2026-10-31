import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

class CollapsibleCard extends StatefulWidget {
  final Widget child;
  final double collapsedHeight;
  const CollapsibleCard({super.key, required this.child, this.collapsedHeight = 260});
  @override
  State<CollapsibleCard> createState() => _CollapsibleCardState();
}

class _CollapsibleCardState extends State<CollapsibleCard> {
  bool _expanded = true;
  void _set(bool v) { if (_expanded != v) setState(() => _expanded = v); }

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: (n) {
        if (_expanded && n is OverscrollNotification && n.overscroll < 0 && n.dragDetails != null) _set(false);
        if (!_expanded && n is UserScrollNotification && n.direction == ScrollDirection.reverse) _set(true);
        return false;
      },
      child: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onTap: _expanded ? null : () => _set(true),
        onVerticalDragEnd: (d) {
          final v = d.primaryVelocity ?? 0;
          if (v > 150) _set(false);
          if (v < -150) _set(true);
        },
        child: AnimatedSize(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
          alignment: Alignment.topCenter,
          child: _expanded
              ? widget.child
              : SizedBox(height: widget.collapsedHeight, child: ClipRect(child: SingleChildScrollView(physics: const NeverScrollableScrollPhysics(), child: widget.child))),
        ),
      ),
    );
  }
}
