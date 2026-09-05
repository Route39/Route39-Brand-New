import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:ridy/core/extensions/extensions.dart';

import 'vehicle_plate_view.dart';

class VehicleInfoCompact extends StatelessWidget {
  final String? imageUrl;
  final String? vehicleModel;
  final String? vehicleColor;
  final String? vehiclePlateNumber;

  const VehicleInfoCompact({
    super.key,
    required this.imageUrl,
    this.vehicleModel,
    this.vehicleColor,
    this.vehiclePlateNumber,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                [vehicleModel, vehicleColor].nonNulls.join(' - '),
                style: context.titleSmall,
              ),
              const SizedBox(height: 2),
              Row(
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
          ),
        ),
        if (imageUrl != null)
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: CachedNetworkImage(
              imageUrl: imageUrl!,
              width: 80,
              height: 80,
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(
                width: 80,
                height: 80,
                color: Colors.grey.shade100,
                child: const Icon(Icons.directions_car, color: Colors.grey, size: 32),
              ),
              errorWidget: (context, url, error) => Container(
                width: 80,
                height: 80,
                color: Colors.grey.shade100,
                child: const Icon(Icons.directions_car, color: Colors.grey, size: 32),
              ),
            ),
          )
      ],
    );
  }
}
