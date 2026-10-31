import 'package:flutter/material.dart';

class CollapsibleRideSheet extends StatefulWidget {
  final Widget child;
  const CollapsibleRideSheet({super.key, required this.child});
  @override
  State<CollapsibleRideSheet> createState() => _CollapsibleRideSheetState();
}

class _CollapsibleRideSheetState extends State<CollapsibleRideSheet> {
  bool _expanded = false;
  final _scroll = ScrollController();

  void _set(bool v) {
    if (v == _expanded) return;
    if (!v && _scroll.hasClients) _scroll.jumpTo(0);
    setState(() => _expanded = v);
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final h = MediaQuery.of(context).size.height;
    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onVerticalDragEnd: (d) {
        final v = d.primaryVelocity ?? 0;
        if (v < -150) _set(true);
        if (v > 150) _set(false);
      },
      child: NotificationListener<OverscrollNotification>(
        onNotification: (n) {
          if (_expanded && n.overscroll < -4) _set(false);
          return false;
        },
        child: AnimatedSize(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxHeight: _expanded ? h * 0.85 : h * 0.34),
            child: SingleChildScrollView(
              controller: _scroll,
              physics: _expanded ? const ClampingScrollPhysics() : const NeverScrollableScrollPhysics(),
              child: widget.child,
            ),
          ),
        ),
      ),
    );
  }
}
