import 'package:flutter/material.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/core/graphql/fragments/active_order.fragment.graphql.dart';
import 'package:ridy/features/scheduled_rides/presentation/components/details_sheet.dart';

class ScheduledRideDetailsScreenMobile extends StatelessWidget {
  final Fragment$ActiveOrder entity;

  const ScheduledRideDetailsScreenMobile({
    super.key,
    required this.entity,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: context.theme.scaffoldBackgroundColor,
      padding: const EdgeInsets.all(16),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 24),
            Expanded(child: ScheduledRidesDetailsSheet(entity: entity)),
          ],
        ),
      ),
    );
  }
}
