// ignore_for_file: use_build_context_synchronously

import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy_driver/core/presentation/app_drawer.dart';
import 'package:ridy_driver/features/home/presentation/blocs/home.bloc.dart';
import 'package:ridy_driver/features/home/presentation/components/driver_search_radius_button_new.dart';
import 'package:ridy_driver/features/home/presentation/components/home_my_location_button.dart';
import 'package:ridy_driver/features/home/presentation/components/map_view.dart';
import 'package:ridy_driver/features/home/presentation/components/top_nav_bar.dart';
import 'package:ridy_driver/features/home/presentation/components/today_earnings_bar.dart';
import 'package:ridy_driver/features/home/presentation/screens/mobile_layout_delegate.dart';
import 'package:ridy_driver/features/home/presentation/screens/sheets/active_order_sheet.dart';
import 'package:ridy_driver/features/home/presentation/screens/sheets/chat_sheet.dart';
import 'package:ridy_driver/features/home/presentation/screens/sheets/online_offline_sheet.dart';
import 'package:ridy_driver/features/home/presentation/screens/sheets/order_summary.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/theme/animation_duration.dart';
import 'package:generic_map/generic_map.dart';

import 'package:ridy_driver/features/ride_history/presentation/screens/ride_history_screen.dart';

import 'sheets/order_requests_pageview.dart';

class HomeScreenMobile extends StatefulWidget {
  const HomeScreenMobile({super.key});

  @override
  State<HomeScreenMobile> createState() => _HomeScreenMobileState();
}

class _HomeScreenMobileState extends State<HomeScreenMobile> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();
  MapViewController? controller;
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      drawer: AppDrawer(scaffoldKey: scaffoldKey),
      extendBody: true,
      bottomNavigationBar: SafeArea(
        child: Container(
          height: 60,
          decoration: const BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Color(0x1A000000),
                blurRadius: 8,
                offset: Offset(0, -2),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              InkWell(
                onTap: () {
                  setState(() {
                    _selectedTab = 0;
                  });
                },
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.home,
                      color: _selectedTab == 0
                          ? ColorPalette.primary40
                          : Colors.grey,
                    ),
                    Text(
                      'Home',
                      style: TextStyle(
                        color: _selectedTab == 0
                            ? ColorPalette.primary40
                            : Colors.grey,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: () {
                  setState(() {
                    _selectedTab = 1;
                  });
                },
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.receipt_long,
                      color: _selectedTab == 1
                          ? ColorPalette.primary40
                          : Colors.grey,
                    ),
                    Text(
                      'Orders',
                      style: TextStyle(
                        color: _selectedTab == 1
                            ? ColorPalette.primary40
                            : Colors.grey,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TopNavBar(
                onMenuButtonPressed: () =>
                    scaffoldKey.currentState?.openDrawer(),
              ),
              BlocBuilder<HomeBloc, HomeState>(
                buildWhen: (previous, current) =>
                    previous.driverStatus != current.driverStatus,
                builder: (context, state) {
                  if (_selectedTab != 0 ||
                      state.driverStatus == HomeStateDriverStatus.onTrip) {
                    return const SizedBox.shrink();
                  }
                  return const TodayEarningsBar();
                },
              ),
            ],
          ),
          Expanded(
            child: IndexedStack(
              index: _selectedTab,
              children: [_buildHomeContent(), const RideHistoryScreen()],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHomeContent() {
    return BlocBuilder<HomeBloc, HomeState>(
      buildWhen: (previous, current) {
        return current.orderRequests.isEmpty != previous.orderRequests.isEmpty;
      },
      builder: (context, state) {
        return CustomMultiChildLayout(
          delegate: MobileLayoutDelegate(
            isMapFull: state.orderRequests.isNotEmpty,
          ),
          children: [
            LayoutId(
              id: MobileLayoutDelegate.mapLayoutId,
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
              id: MobileLayoutDelegate.navbarId,
              child: const SizedBox.shrink(),
            ),
            LayoutId(
              id: MobileLayoutDelegate.cardLayoutId,
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
                        state.orderRequests.isEmpty
                            ? OnlineOfflineSheet(state: state)
                            : OrderRequestsPageView(
                                requests: state.orderRequests,
                              ),
                      HomeStateDriverStatus.offline => OnlineOfflineSheet(
                        state: state,
                      ),
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
            LayoutId(
              id: MobileLayoutDelegate.navigateButtonId,
              child: const SizedBox.shrink(),
            ),
            LayoutId(
              id: MobileLayoutDelegate.searchRadiusButtonId,
              child: const DriverSearchRadiusButtonNew(),
            ),
            LayoutId(
              id: MobileLayoutDelegate.myLocationButtonId,
              child: const HomeMyLocationButton(),
            ),
          ],
        );
      },
    );
  }
}
