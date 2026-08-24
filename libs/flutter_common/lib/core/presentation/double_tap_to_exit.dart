import 'package:flutter/material.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';

class DoubleTapToExit extends StatefulWidget {
  final Widget child;
  final int exitDuration; // milliseconds
  final bool Function()? canExit;
  final VoidCallback? onBackPress;

  const DoubleTapToExit({
    super.key,
    required this.child,
    this.exitDuration = 2000,
    this.canExit,
    this.onBackPress,
  });

  @override
  State<DoubleTapToExit> createState() => _DoubleTapToExitState();
}

class _DoubleTapToExitState extends State<DoubleTapToExit> {
  DateTime? _lastBackPressed;

  void _handlePopInvoked<T>(bool didPop, T? result) {
    if (didPop) return; // Navigator already popped → nothing to do

    if (widget.canExit != null && !widget.canExit!()) {
      if (widget.onBackPress != null) {
        widget.onBackPress!();
      }
      return;
    }

    final now = DateTime.now();
    if (_lastBackPressed == null || now.difference(_lastBackPressed!) > Duration(milliseconds: widget.exitDuration)) {
      _lastBackPressed = now;
      context.showSnackBar(message: 'Press back again to exit');
    } else {
      // Exit app explicitly
      Navigator.of(context).maybePop(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false, // block default back unless we say so
      onPopInvokedWithResult: _handlePopInvoked,
      child: widget.child,
    );
  }
}
