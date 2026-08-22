import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_dialog_header.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/app_card_sheet.dart';
import 'package:ridy/gen/assets.gen.dart';

class LookingForDriverSheet extends StatelessWidget {
  const LookingForDriverSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return AppCardSheet(
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            AppDialogHeader(
              icon: Icons.directions_car,
              title: context.translate.rideRequested,
              subtitle: context.translate.searchingForAnOnlineDriver,
            ),
            Assets.lottie.looking.lottie(
              height: 350,
              width: 350,
            ),
            const SizedBox(
              height: 16,
            ),
            SizedBox(
              width: double.infinity,
              child: CupertinoButton(
                onPressed: () {
                  locator<HomeBloc>().cancelRide(
                      orderId: locator<HomeBloc>().state.activeOrder!.id, cancelReasonId: null, cancelReasonNote: null);
                },
                child: Text(context.translate.cancelRide),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
