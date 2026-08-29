import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/core/extensions/extensions.dart';

class Route39ServiceCard extends StatelessWidget {
  final dynamic selectedService;
  final String? categoryName;

  const Route39ServiceCard({super.key, required this.selectedService, this.categoryName});

  @override
  Widget build(BuildContext context) {
    final String? imageUrl = selectedService.media?.address;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ColorPalette.neutralVariant99,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: (imageUrl == null || imageUrl.isEmpty)
                ? Image.asset(
                    'assets/images/route39_auto_photo.png',
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                  )
                : CachedNetworkImage(
                    imageUrl: imageUrl,
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                    fadeInDuration: Duration.zero,
                    fadeOutDuration: Duration.zero,
                    placeholder: (context, url) => Image.asset(
                      'assets/images/route39_auto_photo.png',
                      width: 56,
                      height: 56,
                      fit: BoxFit.cover,
                    ),
                    errorWidget: (context, url, error) => Image.asset(
                      'assets/images/route39_auto_photo.png',
                      width: 56,
                      height: 56,
                      fit: BoxFit.cover,
                    ),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  (categoryName ?? selectedService.name).toString().toUpperCase(),
                  style: context.bodySmall?.copyWith(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 10),
                ),
                const SizedBox(height: 6),
                Text(selectedService.name, style: context.titleMedium?.copyWith(fontWeight: FontWeight.bold, fontSize: 14)),
                if (selectedService.personCapacity != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Ionicons.people, size: 14, color: ColorPalette.neutralVariant50),
                      const SizedBox(width: 4),
                      Text('${selectedService.personCapacity} Seats', style: context.bodySmall?.copyWith(fontSize: 11)),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
