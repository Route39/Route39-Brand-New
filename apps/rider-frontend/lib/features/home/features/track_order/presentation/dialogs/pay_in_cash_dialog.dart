import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy/core/extensions/extensions.dart';
class PayInCashDialog extends StatelessWidget {
  const PayInCashDialog({super.key});
  @override
  Widget build(BuildContext context) {
    return AppResponsiveDialog(
      header: (
        Ionicons.cash,
        context.translate.payInCash,
        context.translate.payInCashDescription,
      ),
      iconColor: ColorPalette.primary40,
      primaryButton: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: Text(context.translate.confirm, style: const TextStyle(color: Colors.white)),
        ),
      ),
      type: context.responsive(
        DialogType.bottomSheet,
        xl: DialogType.dialog,
      ),
      child: Container(),
    );
  }
}
