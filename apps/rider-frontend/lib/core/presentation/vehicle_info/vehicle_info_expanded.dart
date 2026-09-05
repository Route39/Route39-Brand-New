import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:ridy/core/extensions/extensions.dart';

import 'vehicle_plate_view.dart';

class VehicleInfoExpanded extends StatelessWidget {
  final String imageUrl;
  final String? vehicleModel;
  final String? vehicleColor;
  final String? vehiclePlateNumber;
  final bool extraLarge;

  const VehicleInfoExpanded({
    super.key,
    required this.imageUrl,
    this.vehicleModel,
    this.vehicleColor,
    this.vehiclePlateNumber,
    required this.extraLarge,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: CachedNetworkImage(
            imageUrl: imageUrl,
            width: extraLarge ? 190 : 120,
            height: extraLarge ? 190 : 120,
            fit: BoxFit.cover,
            placeholder: (context, url) => Container(
              width: extraLarge ? 190 : 120,
              height: extraLarge ? 190 : 120,
              color: Colors.grey.shade100,
              child: const Icon(Icons.directions_car, color: Colors.grey, size: 48),
            ),
            errorWidget: (context, url, error) => Container(
              width: extraLarge ? 190 : 120,
              height: extraLarge ? 190 : 120,
              color: Colors.grey.shade100,
              child: const Icon(Icons.directions_car, color: Colors.grey, size: 48),
            ),
          ),
        ),
        Text(
          [vehicleModel, vehicleColor].nonNulls.join(' - '),
          style: context.titleSmall,
        ),
        const SizedBox(height: 2),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (vehiclePlateNumber != null) ...[
              VehiclePlateView(carPlate: vehiclePlateNumber!),
              const SizedBox(
                width: 4,
              )
            ],
          ],
        )
      ],
    );
  }
}
