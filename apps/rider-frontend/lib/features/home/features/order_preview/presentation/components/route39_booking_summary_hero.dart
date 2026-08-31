import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/core/extensions/extensions.dart';

class Route39BookingSummaryHero extends StatelessWidget {
  const Route39BookingSummaryHero({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ColorPalette.primary40,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: 4,
            right: 70,
            child: Icon(Icons.location_on, color: Colors.white.withValues(alpha: 0.25), size: 14),
          ),
          Positioned(
            top: 0,
            right: 34,
            child: Icon(Icons.location_on, color: Colors.white.withValues(alpha: 0.35), size: 18),
          ),
          Positioned(
            top: 28,
            right: 8,
            child: Icon(Icons.location_on, color: Colors.white.withValues(alpha: 0.55), size: 20),
          ),
          Positioned(
            top: 34,
            right: 46,
            child: Icon(Icons.location_on, color: Colors.white.withValues(alpha: 0.3), size: 13),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Booking\nSummary',
                style: context.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Safe & Comfortable',
                style: context.bodyMedium?.copyWith(color: Colors.white.withValues(alpha: 0.85), fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
