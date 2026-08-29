import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/core/extensions/extensions.dart';

class Route39DateStrip extends StatefulWidget {
  const Route39DateStrip({super.key});

  @override
  State<Route39DateStrip> createState() => _Route39DateStripState();
}

class _Route39DateStripState extends State<Route39DateStrip> {
  late final DateTime _weekStart;
  int _selectedDayIndex = DateTime.now().weekday - 1;
  static const _dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _weekStart = now.subtract(Duration(days: now.weekday - 1));
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(7, (index) {
        final date = _weekStart.add(Duration(days: index));
        final isSelected = index == _selectedDayIndex;
        return GestureDetector(
          onTap: () => setState(() => _selectedDayIndex = index),
          child: Column(
            children: [
              Text(_dayLabels[index], style: context.bodySmall?.copyWith(color: ColorPalette.neutralVariant50, fontSize: 10)),
              const SizedBox(height: 6),
              Container(
                width: 28,
                height: 28,
                alignment: Alignment.center,
                decoration: isSelected
                    ? BoxDecoration(shape: BoxShape.circle, border: Border.all(color: ColorPalette.primary40, width: 2))
                    : null,
                child: Text(
                  date.day.toString(),
                  style: context.labelLarge?.copyWith(
                    color: isSelected ? ColorPalette.primary40 : ColorPalette.neutral20,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
