import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/buttons/app_bordered_button.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
import 'package:ridy/features/home/features/track_order/presentation/dialogs/cancel_ride_reason.dart';

class CancelScheduledRideDialog extends StatelessWidget {
  final String orderId;

  const CancelScheduledRideDialog({super.key, required this.orderId});

  @override
  Widget build(BuildContext context) {
    return AppResponsiveDialog(
      type: context.responsive(DialogType.bottomSheet, xl: DialogType.dialog),
      header: (Ionicons.trash, context.translate.cancelRide, context.translate.cancelRideMessage),
      iconColor: ColorPalette.error40,
      primaryButton: AppPrimaryButton(
        child: Text(context.translate.keepTheOrder),
        onPressed: () => context.router.maybePop(),
      ),
      secondaryButton: AppBorderedButton(
        onPressed: () async {
          final result = await showDialog(
            context: context,
            useSafeArea: false,
            builder: (_) => CancelRideReasonDialog(orderId: orderId),
          );
          if (result != true) return;
          Navigator.of(context).pop(true);
        },
        title: context.translate.cancelTheRide,
        textColor: ColorPalette.error40,
      ),
      child: const SizedBox(),
    );
  }
}
