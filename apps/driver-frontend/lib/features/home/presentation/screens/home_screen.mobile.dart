// ignore_for_file: use_build_context_synchronously

import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy_driver/core/presentation/app_drawer.dart';
import 'package:ridy_driver/features/home/presentation/blocs/home.bloc.dart';
import 'package:ridy_driver/core/services/ride_overlay_service.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'dart:convert';
import 'dart:async';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';
import 'package:android_intent_plus/android_intent.dart';
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

  final List<int> _history = [];

  void select(int index) {
    if (index == value) return;
    _history.add(value);
    value = index;
  }

  void goBack() {
    value = _history.isNotEmpty ? _history.removeLast() : 0;
  }

  void goToHome() {
    _history.clear();
    value = 0;
  }
}

class HomeScreenMobile extends StatefulWidget {
  const HomeScreenMobile({super.key});

  @override
  State<HomeScreenMobile> createState() => _HomeScreenMobileState();
}

class _HomeScreenMobileState extends State<HomeScreenMobile> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();
  MapViewController? controller;

  StreamSubscription? _overlayActionSub;

  @override
  void initState() {
    super.initState();
    SelectedTabNotifier.instance.addListener(_onTabChanged);
    _initializeRideOverlay();
    _overlayActionSub = FlutterOverlayWindow.overlayListener.listen((event) {
      try {
        final data = jsonDecode(event.toString());
        if (data is Map && data["action"] == "open_app") {
          _bringAppToForeground();
        } else if (data is Map && data["action"] == "accept") {
          final requests = locator<HomeBloc>().state.orderRequests;
          if (requests.isNotEmpty) {
            locator<HomeBloc>().onAcceptOrder(requests.first);
          }
          _bringAppToForeground();
        }
      } catch (_) {}
    });
  }

  Future<void> _initializeRideOverlay() async {
    await RideOverlayService.requestPermission();

    if (!mounted) return;

    final state = locator<HomeBloc>().state;

    if (state.driverStatus != HomeStateDriverStatus.online) {
      return;
    }

    if (state.orderRequests.isNotEmpty) {
      final request = state.orderRequests.first;
      String? pickupAddress;
      String? dropoffAddress;
      for (final wp in request.waypoints) {
        if (wp.role == Enum$WaypointRole.Pickup) {
          pickupAddress = wp.address;
        } else if (wp.role == Enum$WaypointRole.Dropoff) {
          dropoffAddress = wp.address;
        }
      }

      await RideOverlayService.showOrderScreen(
        serviceName: request.serviceName,
        fare: request.fareEstimate.toStringAsFixed(0),
        distance: '${(request.distance / 1000).toStringAsFixed(1)} km',
        duration: '${(request.duration ~/ 60)} min',
        pickupAddress: pickupAddress,
        dropoffAddress: dropoffAddress,
      );
    } else {
      await RideOverlayService.showBubble();
    }
  }

  void _bringAppToForeground() {
    const intent = AndroidIntent(
      action: 'android.intent.action.MAIN',
      category: 'android.intent.category.LAUNCHER',
      package: 'com.route39.pilot',
      flags: [268435456, 131072],
    );
    intent.launch();
  }

  @override
  void dispose() {
    SelectedTabNotifier.instance.removeListener(_onTabChanged);
    _overlayActionSub?.cancel();
    super.dispose();
  }

  void _onTabChanged() {
    if (mounted) setState(() {});
  }

  int get _selectedTab => SelectedTabNotifier.instance.value;

  @override
  Widget build(BuildContext context) {
    return BlocListener<HomeBloc, HomeState>(
      listenWhen: (previous, current) =>
          previous.orderRequests.isEmpty != current.orderRequests.isEmpty ||
          previous.driverStatus != current.driverStatus,
      listener: (context, state) {
        if (state.driverStatus != HomeStateDriverStatus.online) {
          RideOverlayService.closeOverlay();
        } else if (state.orderRequests.isNotEmpty) {
          final request = state.orderRequests.first;
          RideOverlayService.showOrderScreen(
            serviceName: request.serviceName,
            fare: request.fareEstimate.toStringAsFixed(0),
            distance: '${(request.distance / 1000).toStringAsFixed(1)} km',
            duration: '${(request.duration ~/ 60)} min',
          );
        } else {
          RideOverlayService.showBubble();
        }
      },
      child: PopScope(
        canPop: _selectedTab == 0,
        onPopInvokedWithResult: (didPop, result) {
          if (!didPop) {
            SelectedTabNotifier.instance.goBack();
          }
        },
        child: Scaffold(
        key: scaffoldKey,
        drawer: AppDrawer(showHeader: false, scaffoldKey: scaffoldKey),
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
                  onTap: () => SelectedTabNotifier.instance.select(0),
                ),
                _navBarItem(
                  icon: Icons.bar_chart,
                  label: 'Earnings',
                  isSelected: _selectedTab == 1,
                  onTap: () => SelectedTabNotifier.instance.select(1),
                ),
                _navBarItem(
                  icon: Icons.receipt_long,
                  label: 'Orders',
                  isSelected: _selectedTab == 2,
                  onTap: () => SelectedTabNotifier.instance.select(2),
                ),
                _navBarItem(
                  icon: Icons.account_balance_wallet,
                  label: 'Wallet',
                  isSelected: _selectedTab == 3,
                  onTap: () => SelectedTabNotifier.instance.select(3),
                ),
                _navBarItem(
                  icon: Icons.person,
                  label: 'Profile',
                  isSelected: _selectedTab == 4,
                  onTap: () => SelectedTabNotifier.instance.select(4),
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
      ),
      ),
    );
  }

  Widget _buildHomeContent() {
    return BlocBuilder<HomeBloc, HomeState>(
      buildWhen: (previous, current) {
        final result =
            previous.orderRequests.length != current.orderRequests.length ||
            previous.activeOrders.length != current.activeOrders.length ||
            previous.currentOrderId != current.currentOrderId ||
            previous.currentOrder?.id != current.currentOrder?.id ||
            previous.currentOrder?.status != current.currentOrder?.status ||
            previous.driverStatus != current.driverStatus ||
            previous.page != current.page ||
            previous.acceptOrderReponse != current.acceptOrderReponse;

        debugPrint(
          '[ACCEPT-DEBUG] OUTER buildWhen at ${DateTime.now()}: '
          'prev.activeOrders=${previous.activeOrders.length}, '
          'cur.activeOrders=${current.activeOrders.length}, '
          'prev.currentOrderId=${previous.currentOrderId}, '
          'cur.currentOrderId=${current.currentOrderId}, '
          'prev.driverStatus=${previous.driverStatus}, '
          'cur.driverStatus=${current.driverStatus}, '
          'rebuild=$result',
        );

        return result;
      },
      builder: (context, state) {
        debugPrint(
          '[ACCEPT-DEBUG] OUTER builder RAN at ${DateTime.now()}, '
          'driverStatus=${state.driverStatus}, '
          'activeOrders=${state.activeOrders.length}, '
          'currentOrderId=${state.currentOrderId}, '
          'orderStatus=${state.currentOrder?.status}',
        );
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
                  debugPrint(
                    '[ACCEPT-DEBUG] INNER builder RAN at ${DateTime.now()}, driverStatus=${state.driverStatus}, order?.status=${order?.status}, page=${state.page}',
                  );
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
          Icon(icon, color: isSelected ? ColorPalette.primary40 : Colors.grey),
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
