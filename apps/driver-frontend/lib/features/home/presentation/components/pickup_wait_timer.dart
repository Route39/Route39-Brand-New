import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';

class PickupWaitTimer extends StatefulWidget {
  final DateTime? arrivedAt;
  final int? freeWaitMinutes;

  const PickupWaitTimer({
    super.key,
    required this.arrivedAt,
    required this.freeWaitMinutes,
  });

  @override
  State<PickupWaitTimer> createState() => _PickupWaitTimerState();
}

class _PickupWaitTimerState extends State<PickupWaitTimer> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    if (widget.arrivedAt != null) {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) setState(() {});
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final arrivedAt = widget.arrivedAt;
    final freeWaitMinutes = widget.freeWaitMinutes;
    if (arrivedAt == null || freeWaitMinutes == null) {
      return const SizedBox.shrink();
    }

    final deadline = arrivedAt.add(Duration(minutes: freeWaitMinutes));
    final remaining = deadline.difference(DateTime.now());
    final overtime = remaining.isNegative;
    final displayDuration = overtime ? -remaining : remaining;
    final minutes = displayDuration.inMinutes.toString().padLeft(2, '0');
    final seconds = (displayDuration.inSeconds % 60).toString().padLeft(2, '0');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: overtime ? Colors.red.shade50 : Colors.white24,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        overtime
            ? 'Free wait over • +$minutes:$seconds'
            : 'Free pickup wait • $minutes:$seconds',
        style: TextStyle(
          color: overtime ? Colors.red.shade700 : ColorPalette.neutral99,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }
}