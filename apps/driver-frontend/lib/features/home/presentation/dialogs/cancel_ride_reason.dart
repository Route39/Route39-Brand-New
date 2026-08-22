import 'package:flutter/material.dart';
import 'package:api_response/api_response.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/graphql/fragments/cancel_reason.fragment.graphql.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/presentation/buttons/app_radio_button.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:flutter_common/core/theme/animation_duration.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/buttons/app_bordered_button.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
import 'package:flutter_common/core/presentation/buttons/app_text_button.dart';
import 'package:ridy_driver/gen/assets.gen.dart';

import '../blocs/cancel_reason.bloc.dart';
import '../blocs/home.bloc.dart';

class CancelRideReasonDialog extends StatefulWidget {
  final String orderId;

  const CancelRideReasonDialog({super.key, required this.orderId});

  @override
  State<CancelRideReasonDialog> createState() => _CancelRideReasonDialogState();
}

class _CancelRideReasonDialogState extends State<CancelRideReasonDialog> {
  Fragment$CancelReason? selectedReason;

  @override
  void initState() {
    super.initState();
    locator<CancelReasonCubit>().onStarted();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: locator<CancelReasonCubit>()),
        BlocProvider.value(value: locator<HomeBloc>()),
      ],
      child: BlocListener<HomeBloc, HomeState>(
        listener: (context, state) {
          switch (state.driverStatus) {
            case HomeStateDriverStatus.initial:
              Navigator.pop(context);
              context.showSnackBar(message: context.translate.cancelRideSuccess);
              break;
            case HomeStateDriverStatus.onTrip:
              break;
            default:
              break;
          }
        },
        child: AppResponsiveDialog(
          type: context.responsive(DialogType.bottomSheet, xl: DialogType.dialog),
          primaryButton: AppBorderedButton(
            isDisabled: selectedReason == null,
            onPressed: () {
              locator<HomeBloc>().add(
                HomeEvent.onCancelOrder(orderId: widget.orderId, reasonId: selectedReason!.id, reasonNote: null),
              );
              Navigator.of(context).pop();
            },
            title: context.translate.confirmAndCancelRide,
            textColor: ColorPalette.error40,
            isPrimary: true,
          ),
          header: (Icons.cancel, context.translate.rideCancellation, null),
          iconColor: ColorPalette.error40,
          secondaryButton: AppTextButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            text: context.translate.goBackToRide,
          ),
          child: BlocBuilder<CancelReasonCubit, CancelReasonState>(
            builder: (context, state) {
              return AnimatedSwitcher(
                duration: AnimationDuration.pageStateTransitionMobile,
                child: switch (state.cancelReasonsState) {
                  ApiResponseInitial() => const SizedBox.shrink(),
                  ApiResponseLoading() => Assets.lottie.loading.lottie(width: double.infinity, height: 300),
                  ApiResponseError(:final message) => Text(message),
                  ApiResponseLoaded(:final data) => Column(
                    children: data
                        .map(
                          (e) => CupertinoButton(
                            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                            child: Row(
                              children: [
                                Expanded(child: Text(e.title, style: context.labelLarge)),
                                AppRadioButton(
                                  groupValue: selectedReason,
                                  value: e,
                                  onChanged: (value) => setState(() => selectedReason = e),
                                ),
                              ],
                            ),
                            onPressed: () => setState(() => selectedReason = e),
                          ),
                        )
                        .toList(),
                  ),
                },
              );
            },
          ),
        ),
      ),
    );
  }
}
