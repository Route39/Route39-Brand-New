import 'package:flutter/material.dart';
import 'package:flutter_common/core/presentation/buttons/app_list_button.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/presentation/buttons/app_bordered_button.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/features/redeem_gift_card/presentation/dialogs/redeem_gift_card_dialog.dart';

class RideOptionsSheet extends StatelessWidget {
  final int waitTime;

  const RideOptionsSheet({super.key, required this.waitTime});

  @override
  Widget build(BuildContext context) {
    return AppResponsiveDialog(
      type: context.responsive(DialogType.bottomSheet, xl: DialogType.dialog),
      header: (Ionicons.cog, context.translate.rideOptions, null),
      onBackPressed: () => Navigator.of(context).pop(null),
      secondaryButton: AppBorderedButton(
        onPressed: () {
          Navigator.of(context).pop();
        },
        title: context.translate.goBackToRide,
      ),
      child: Column(
        children: [
          AppListButton(
            icon: Ionicons.gift,
            title: context.translate.giftCardCode,
            onPressed: () {
              showDialog(context: context, useSafeArea: false, builder: (context) => const RedeemGiftCardDialog());
            },
          ),
        ],
      ),
    );
  }
}
