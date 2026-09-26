import 'package:ridy_driver/core/graphql/fragments/coordinate.extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/past_order.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:ridy_driver/gen/assets.gen.dart';
import 'package:flutter/cupertino.dart';
import 'package:ionicons/ionicons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/waypoints_view/waypoints_view.dart';

class RideHistoryItem extends StatelessWidget {
  final Fragment$PastOrder entity;
  final VoidCallback onPressed;

  const RideHistoryItem({
    super.key,
    required this.entity,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return CupertinoButton(
      padding: EdgeInsets.zero,
      onPressed: onPressed,
      minimumSize: Size(0, 0),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          image: DecorationImage(
            image: Assets.images.historyRidesHeaderBackground.provider(),
            fit: BoxFit.cover,
          ),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: ColorPalette.neutralVariant99,
                      border: Border.all(
                        width: 2,
                        color: ColorPalette.neutral90,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    clipBehavior: Clip.antiAlias,
                    padding: const EdgeInsets.all(6),
                    child: entity.serviceImageAddress.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: entity.serviceImageAddress,
                            fit: BoxFit.contain,
                            placeholder: (context, url) => const Icon(
                              Ionicons.car,
                              color: ColorPalette.primary30,
                              size: 28,
                            ),
                            errorWidget: (context, url, error) => const Icon(
                              Ionicons.car,
                              color: ColorPalette.primary30,
                              size: 28,
                            ),
                          )
                        : const Icon(
                            Ionicons.car,
                            color: ColorPalette.primary30,
                            size: 28,
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                entity.serviceName,
                                style: context.labelLarge?.copyWith(
                                  color: ColorPalette.neutral99,
                                ),
                              ),
                            ),
                            Text(
                              entity.totalCost.formatCurrency(entity.currency),
                              style: context.labelLarge?.copyWith(
                                color: ColorPalette.neutral99,
                              ),
                            )
                          ],
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                entity.createdAt.formatDateTime,
                                style: context.bodyMedium?.copyWith(
                                  color: ColorPalette.neutralVariant90,
                                ),
                              ),
                            ),
                            if (entity.status == Enum$OrderStatus.DriverCanceled ||
                                entity.status == Enum$OrderStatus.RiderCanceled)
                              Text(
                                context.translate.canceled,
                                style: context.bodyMedium?.copyWith(
                                  color: ColorPalette.error80,
                                ),
                              ),
                            if (entity.status != Enum$OrderStatus.DriverCanceled &&
                                entity.status != Enum$OrderStatus.RiderCanceled)
                              Text(
                                entity.paymentMode == Enum$PaymentMode.Cash
                                    ? context.translate.cash
                                    : context.translate.online,
                                style: context.bodyMedium?.copyWith(
                                  color: ColorPalette.neutralVariant90,
                                ),
                              ),
                          ],
                        )
                      ],
                    ),
                  )
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: ColorPalette.neutral99,
                border: Border.all(
                  color: ColorPalette.primary95,
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x1464748B),
                    blurRadius: 8,
                    offset: Offset(2, 4),
                  )
                ],
              ),
              child: WayPointsView(
                waypoints: entity.waypoints.toPlaces,
                startedAt: entity.createdAt,
                finishedAt: entity.dropoffEta,
              ),
            )
          ],
        ),
      ),
    );
  }
}
