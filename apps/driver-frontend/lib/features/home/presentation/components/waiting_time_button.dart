import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/presentation/buttons/app_text_button.dart';
import 'package:ionicons/ionicons.dart';

class WaitingTimeService {
  static final WaitingTimeService _instance = WaitingTimeService._internal();
  factory WaitingTimeService() => _instance;
  WaitingTimeService._internal();

  DateTime? startTime;
  bool isWaiting = false;
  Duration frozenElapsed = Duration.zero;

  static const int freeMinutes = 3;
  static const double perMinuteCharge = 1.5;

  void toggle() {
    if (isWaiting) {
      isWaiting = false;
      startTime = null;
    } else {
      isWaiting = true;
      startTime = DateTime.now();
    }
  }

  void reset() {
    isWaiting = false;
    startTime = null;
    frozenElapsed = Duration.zero;
  }

  /// Stops the counter but preserves the elapsed time/charge instead of resetting to zero.
  void freeze() {
    if (startTime != null) {
      frozenElapsed = elapsed;
    }
    isWaiting = false;
    startTime = null;
  }

  Duration get elapsed {
    if (isWaiting && startTime != null) {
      return DateTime.now().difference(startTime!);
    }
    return frozenElapsed;
  }

  double get chargeAmount {
    final totalMinutes = elapsed.inSeconds / 60;
    if (totalMinutes <= freeMinutes) return 0;
    final billableMinutes = (totalMinutes - freeMinutes).ceil();
    return billableMinutes * perMinuteCharge;
  }
}

class WaitingTimeButton extends StatefulWidget {
  const WaitingTimeButton({super.key});

  @override
  State<WaitingTimeButton> createState() => _WaitingTimeButtonState();
}

class _WaitingTimeButtonState extends State<WaitingTimeButton> {
  Timer? _timer;
  final _service = WaitingTimeService();

  @override
  void initState() {
    super.initState();
    if (_service.isWaiting) {
      _startTicking();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTicking() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {});
      }
    });
  }

  void _toggleWaiting() {
    _service.toggle();
    if (_service.isWaiting) {
      _startTicking();
    } else {
      _timer?.cancel();
    }
    setState(() {});
  }

  String get _formattedTime {
    final elapsed = _service.elapsed;
    final minutes = elapsed.inMinutes.toString().padLeft(2, '0');
    final seconds = (elapsed.inSeconds % 60).toString().padLeft(2, '0');
    return "$minutes:$seconds";
  }

  @override
  Widget build(BuildContext context) {
    return AppTextButton(
      iconData: Ionicons.time,
      isDense: true,
      text: _service.isWaiting || _service.frozenElapsed > Duration.zero
          ? '$_formattedTime  •  ₹${_service.chargeAmount.toStringAsFixed(2)}'
          : 'Waiting time',
      onPressed: _toggleWaiting,
    );
  }
}
