import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/presentation/waypoints_view/waypoints_view.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/core/graphql/fragments/active_order.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/point.extensions.dart';
import 'package:ridy/features/scheduled_rides/presentation/dialogs/cancel_scheduled_ride_dialog.dart';

class RideScheduledSheet extends StatelessWidget {
  final Fragment$ActiveOrder order;

  const RideScheduledSheet({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: Colors.white,
      child: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        alignment: Alignment.center,
                        decoration: const BoxDecoration(color: Color(0xFFF2F2F2), shape: BoxShape.circle),
                        child: const Icon(Ionicons.calendar, color: Color(0xFFE53935), size: 28),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Ride scheduled',
                        style: context.titleMedium?.copyWith(color: Colors.black, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        order.pickupEta?.formatDateTime ?? '-',
                        style: context.labelLarge?.copyWith(color: Colors.black54),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: ColorPalette.primary99),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      CachedNetworkImage(
                        imageUrl: order.serviceImageAddress,
                        width: 40,
                        height: 40,
                        errorWidget: (context, url, error) => const Icon(Icons.image_outlined, size: 40),
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: Text(order.serviceName, style: context.labelLarge)),
                      Text(
                        order.totalCost.formatCurrency(order.currency),
                        style: context.titleSmall?.copyWith(color: ColorPalette.primary40),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                WayPointsView(
                  waypoints: order.waypoints.toPlaces,
                  startedAt: order.pickupEta,
                  finishedAt: order.dropoffEta,
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: TextButton.icon(
                    style: TextButton.styleFrom(
                      backgroundColor: const Color(0xFFF2F2F2),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                    ),
                    onPressed: () {
                      showDialog(
                        context: context,
                        useSafeArea: false,
                        builder: (context) => CancelScheduledRideDialog(orderId: order.id),
                      );
                    },
                    icon: const Icon(Icons.close, color: Color(0xFFE53935), size: 18),
                    label: Text(
                      context.translate.cancelReservation,
                      style: const TextStyle(color: Color(0xFFE53935), fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
