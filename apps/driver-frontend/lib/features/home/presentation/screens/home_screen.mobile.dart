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

import 'package:ridy_driver/features/earnings/presentation/screens/earnings_screen.dart';
import 'package:ridy_driver/features/profile/presentation/screens/profile_screen.dart';
import 'package:ridy_driver/features/ride_history/presentation/screens/ride_history_screen.dart';

import 'sheets/order_requests_pageview.dart';
import 'package:ridy_driver/features/wallet/presentation/screens/wallet_screen.dart';

class SelectedTabNotifier extends ValueNotifier<int> {
  static final SelectedTabNotifier instance = SelectedTabNotifier._();
  SelectedTabNotifier._() : super(0);

  void goToHome() => value = 0;
}

class HomeScreenMobile extends StatefulWidget {
  const HomeScreenMobile({super.key});

  @override
  State<HomeScreenMobile> createState() => _HomeScreenMobileState();
}

class _HomeScreenMobileState extends State<HomeScreenMobile> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();
  MapViewController? controller;

  @override
  void initState() {
    super.initState();
    SelectedTabNotifier.instance.addListener(_onTabChanged);
  }

  @override
  void dispose() {
    SelectedTabNotifier.instance.removeListener(_onTabChanged);
    super.dispose();
  }

  void _onTabChanged() {
    if (mounted) setState(() {});
  }

  int get _selectedTab => SelectedTabNotifier.instance.value;

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
              _navBarItem(
                icon: Icons.home,
                label: 'Home',
                isSelected: _selectedTab == 0,
                onTap: () => SelectedTabNotifier.instance.value = 0,
              ),
              _navBarItem(
                icon: Icons.bar_chart,
                label: 'Earnings',
                isSelected: _selectedTab == 1,
                onTap: () => SelectedTabNotifier.instance.value = 1,
              ),
              _navBarItem(
                icon: Icons.receipt_long,
                label: 'Orders',
                isSelected: _selectedTab == 2,
                onTap: () => SelectedTabNotifier.instance.value = 2,
              ),
              _navBarItem(
                icon: Icons.account_balance_wallet,
                label: 'Wallet',
                isSelected: _selectedTab == 3,
                onTap: () => SelectedTabNotifier.instance.value = 3,
              ),
              _navBarItem(
                icon: Icons.person,
                label: 'Profile',
                isSelected: _selectedTab == 4,
                onTap: () => SelectedTabNotifier.instance.value = 4,
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
              const TopNavBar(),
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
              children: [
                _buildHomeContent(),
                const EarningsScreen(),
                const RideHistoryScreen(),
                const WalletScreen(),
                const ProfileScreen(),
              ],
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
                        OnlineOfflineSheet(state: state),
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

  Widget _navBarItem({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            color: isSelected ? ColorPalette.primary40 : Colors.grey,
          ),
          Text(
            label,
            style: TextStyle(
              color: isSelected ? ColorPalette.primary40 : Colors.grey,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
