import 'package:auto_route/auto_route.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
class ReserveTimeDialog extends StatefulWidget {
  const ReserveTimeDialog({super.key});
  @override
  State<ReserveTimeDialog> createState() => _ReserveTimeDialogState();
}
class _ReserveTimeDialogState extends State<ReserveTimeDialog> {
  DateTime selectedDate = DateTime.now().add(const Duration(minutes: 10));
  @override
  Widget build(BuildContext context) {
    return AppResponsiveDialog(
      type: context.responsive(DialogType.bottomSheet, xl: DialogType.dialog),
      header: (
        Ionicons.calendar,
        context.translate.reserveRide,
        context.translate.reserveRideMessage,
      ),
      primaryButton: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          onPressed: () {
            context.router.maybePop(selectedDate);
          },
          child: Text(context.translate.confirmReservation, style: const TextStyle(color: Colors.white)),
        ),
      ),
      secondaryButton: CupertinoButton(
        onPressed: () => context.router.maybePop(),
        child: Text(context.translate.cancel, style: const TextStyle(color: Colors.red)),
      ),
      child: Column(
        children: [
          SizedBox(
            height: 300,
            child: Localizations.override(
              context: context,
              locale: const Locale('en', 'US'),
              child: CupertinoDatePicker(
                initialDateTime: selectedDate,
                minimumDate: DateTime.now().add(const Duration(minutes: 5)),
                onDateTimeChanged: (date) {
                  setState(
                    () {
                      selectedDate = date;
                    },
                  );
                },
              ),
            ),
          )
        ],
      ),
    );
  }
}
