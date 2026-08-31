import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/core/extensions/extensions.dart';

class Route39RouteSection extends StatelessWidget {
  final dynamic pickup;
  final dynamic dropoff;

  const Route39RouteSection({super.key, this.pickup, this.dropoff});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('ROUTE', style: context.bodySmall?.copyWith(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 10)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: ColorPalette.neutralVariant99, borderRadius: BorderRadius.circular(12)),
          child: Column(
            children: [
              _buildRouteRow(context, pickup?.address ?? '—'),
              const Divider(height: 20, color: ColorPalette.neutral95),
              _buildRouteRow(context, dropoff?.address ?? '—'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRouteRow(BuildContext context, String label) {
    return Row(
      children: [
        const Icon(Ionicons.location, size: 15, color: ColorPalette.neutralVariant50),
        const SizedBox(width: 8),
        Expanded(child: Text(label, style: context.bodyMedium?.copyWith(fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis)),
      ],
    );
  }
}
