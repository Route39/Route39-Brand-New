import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:ridy_driver/features/home/presentation/components/home_my_location_button.dart';
import 'package:ridy_driver/features/home/presentation/components/map_view.dart';
import 'package:ridy_driver/features/home/presentation/screens/desktop_layout_delegate.dart';
import 'package:ridy_driver/features/home/presentation/screens/sheets/chat_sheet.dart';
import 'package:ridy_driver/features/home/presentation/screens/sheets/order_reqeusts_list.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/theme/animation_duration.dart';

import '../blocs/home.bloc.dart';
import '../components/driver_search_radius_button.dart';
import '../components/top_nav_bar.dart';
import '../components/today_earnings_bar.dart';
import 'sheets/active_order_sheet.dart';
import 'sheets/online_offline_sheet.dart';
import 'sheets/order_summary.dart';
import 'sheets/order_reqeusts_list.dart';

class HomeScreenDesktop extends StatelessWidget {
  const HomeScreenDesktop({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: ColorPalette.neutralVariant99,
      child: CustomMultiChildLayout(
        delegate: DesktopLayoutDelegate(),
        children: [
          LayoutId(
            id: 'map',
            child: BlocBuilder<HomeBloc, HomeState>(
              buildWhen: (previous, current) =>
                  previous.driverStatus != current.driverStatus,
              builder: (context, state) {
                if (state.driverStatus == HomeStateDriverStatus.offline) {
                  return Container(color: Colors.white);
                }
                return const HomeMapView();
              },
            ),
          ),
          LayoutId(
            id: DesktopLayoutDelegate.navbarId,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const TopNavBar(
                  borderRadius: BorderRadius.vertical(
                    bottom: Radius.circular(12),
                  ),
                ),
                const TodayEarningsBar(),
              ],
            ),
          ),
          LayoutId(
            id: DesktopLayoutDelegate.sidebarLayoutId,
            child: SafeArea(
              bottom: false,
              child: Container(
                child: BlocBuilder<HomeBloc, HomeState>(
                  builder: (context, state) {
                    final order = state.currentOrder;
                    return AnimatedSwitcher(
                      duration: AnimationDuration.pageStateTransitionMobile,
                      child: switch (state.driverStatus) {
                        HomeStateDriverStatus.accessDenied => const Text(
                          'access denied',
                        ),
                        HomeStateDriverStatus.initial => const SizedBox(),
                        HomeStateDriverStatus.loading => const SizedBox(),
                        HomeStateDriverStatus.online =>
                          const SizedBox(),
                        HomeStateDriverStatus.offline => const SizedBox(),
                        HomeStateDriverStatus.onTrip => switch (order?.status) {
                          Enum$OrderStatus.WaitingForPostPay => OrderSummary(
                            order: order!,
                          ),
                          _ => switch (state.page) {
                            OnTripPage.overview => ActiveOrderSheet(),
                            OnTripPage.chat => ChatSheet(),
                          },
                        },
                      },
                    );
                  },
                ),
              ),
            ),
          ),
          LayoutId(
            id: DesktopLayoutDelegate.bottomSheetLayoutId,
            child: BlocBuilder<HomeBloc, HomeState>(
              builder: (context, state) {
                return AnimatedSwitcher(
                  duration: AnimationDuration.pageStateTransitionMobile,
                  child: switch (state.driverStatus) {
                    HomeStateDriverStatus.accessDenied => const Text(
                      'access denied',
                    ),
                    HomeStateDriverStatus.initial => const SizedBox(),
                    HomeStateDriverStatus.loading => const SizedBox(),
                    HomeStateDriverStatus.online =>
                      state.orderRequests.isEmpty
                          ? OnlineOfflineSheet(state: state)
                          : OrderRequestsList(requests: state.orderRequests),
                    HomeStateDriverStatus.offline => OnlineOfflineSheet(
                      state: state,
                    ),
                    HomeStateDriverStatus.onTrip => const SizedBox(),
                  },
                );
              },
            ),
          ),
          LayoutId(
            id: DesktopLayoutDelegate.searchRadiusButtonId,
            child: const DriverSearchRadiusButton(),
          ),
          LayoutId(
            id: DesktopLayoutDelegate.myLocationButtonId,
            child: const HomeMyLocationButton(),
          ),
        ],
      ),
    );
  }
}
