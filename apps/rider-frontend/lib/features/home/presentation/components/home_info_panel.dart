import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/theme/animation_duration.dart';
import 'package:flutter_common/core/presentation/app_card_sheet.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/features/home/features/waypoints/presentation/screens/waypoints_input_sheet.dart';
import 'package:ridy/features/home/features/welcome/presentation/screens/where_are_you_going_sheet.dart';
import 'package:ridy/features/home/presentation/components/collapsible_welcome_sheet.dart';
import 'package:ridy/gen/assets.gen.dart';

import '../../features/order_preview/presentation/screens/order_preview_sheet.dart';
import '../../features/place_confirm/presentation/screens/place_confirm_sheet.dart';
import '../../features/track_order/presentation/screens/track_order_sheet.dart';

class HomeInfoPanel extends StatelessWidget {
  final bool collapsible;
  const HomeInfoPanel({super.key, this.collapsible = false});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<HomeBloc, HomeState>(
      builder: (context, state) {
        return AnimatedSwitcher(
          duration: AnimationDuration.pageStateTransitionMobile,
          child: switch (state.mode) {
            HomeMode.loading => AppCardSheet(
                child: Assets.lottie.loading.lottie(
                  height: 100,
                  width: double.infinity,
                ),
              ),
            HomeMode.preSubmission => switch (state.orderSubmissionPage) {
                OrderSubmissionPage.welcome => collapsible
                    ? CollapsibleWelcomeSheet(
                        child: WhereAreYouGoingSheet(
                          waypoints: state.waypoints,
                        ),
                      )
                    : WhereAreYouGoingSheet(
                        waypoints: state.waypoints,
                      ),
                OrderSubmissionPage.rideWaypointsInput => WaypointsInputSheet(
                    waypoints: state.waypoints,
                  ),
                OrderSubmissionPage.confirmLocation => PlaceConfirmSheet(
                    waypoints: state.waypoints,
                    index: state.selectedWaypointIndex!,
                    selectedLocation: state.selectedLocationResponse.data!,
                  ),
                OrderSubmissionPage.deliverySearchPlaceInput =>
                  const Text("Unsupported feature"),
                OrderSubmissionPage.deliveryContactInfoInput =>
                  const Text("Unsupported feature"),
              },
            HomeMode.ridePreview => OrderPreviewSheet(
                wayPoints: state.waypoints.nonNulls.toList(),
              ),
            HomeMode.rideInProgress => TrackOrderSheet(
                order: state.activeOrder!,
              ),
          },
        );
      },
    );
  }
}
