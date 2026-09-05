import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/blocs/location.bloc.dart';
import 'package:ridy/core/presentation/app_drawer.dart';
import 'package:flutter_common/core/enums/order_status.dart';
import 'package:ridy/core/enums/order_status.prod.dart';
import 'package:ridy/features/home/presentation/components/home_info_panel.dart';
import 'package:ridy/features/home/presentation/components/home_map.dart';
import 'package:ridy/features/home/presentation/components/my_location_button.dart';
import 'package:ridy/features/home/presentation/screens/mobile_layout_delegate.dart';
import 'package:ridy/features/home/features/order_preview/presentation/components/route39_header.dart';
import 'package:ridy/features/home/presentation/components/route39_nav_bar.dart';
import 'package:ridy/features/home/features/track_order/presentation/dialogs/ride_safety_dialog.dart';
import 'package:ridy/features/home/features/welcome/presentation/popular_search_notifier.dart';

class HomeScreenMobile extends StatefulWidget {
  const HomeScreenMobile({super.key});

  @override
  State<HomeScreenMobile> createState() => _HomeScreenMobileState();
}

class _HomeScreenMobileState extends State<HomeScreenMobile> with SingleTickerProviderStateMixin {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  final _homeBloc = locator<HomeBloc>();
  late final AnimationController _glowController;

  @override
  void initState() {
    super.initState();
    _glowController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: AppDrawer(scaffoldKey: _scaffoldKey),
      bottomNavigationBar: const Route39NavBar(currentIndex: 0),
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: BlocBuilder<HomeBloc, HomeState>(
              builder: (context, state) {
                final hideHeader = state.mode == HomeMode.preSubmission &&
                    state.orderSubmissionPage == OrderSubmissionPage.welcome;
                if (hideHeader) return const SizedBox.shrink();
                final needsBack = state.mode == HomeMode.ridePreview ||
                    state.mode == HomeMode.rideInProgress ||
                    (state.mode == HomeMode.preSubmission &&
                        (state.orderSubmissionPage == OrderSubmissionPage.confirmLocation ||
                            state.orderSubmissionPage == OrderSubmissionPage.welcome));
                final activeOrder = state.activeOrder;
                return Route39Header(
                  onBackPressed: needsBack
                      ? (state.mode == HomeMode.rideInProgress ? () {} : backButtonAction)
                      : null,
                  trailingAction: (state.mode == HomeMode.rideInProgress && activeOrder != null)
 ? IconButton(
                          icon: const Icon(Ionicons.shield, color: Colors.black, size: 20),
                          onPressed: () {
                            showDialog(
                              context: context,
                              useSafeArea: false,
                              builder: (context) => RideSafetyDialog(order: activeOrder),
                            );
                          },
                        )
                      : null,
                );
              },
            ),
          ),
          Expanded(
            child: CustomMultiChildLayout(
              delegate: MobileLayoutDelegate(),
              children: [
                LayoutId(id: MobileLayoutDelegate.mapLayoutId, child: const HomeMap()),
                LayoutId(
                  id: MobileLayoutDelegate.actionButtonId,
                  child: ValueListenableBuilder<String?>(
                    valueListenable: activePopularSearchNotifier,
                    builder: (context, popularSearch, _) {
                      return BlocBuilder<HomeBloc, HomeState>(
                        builder: (context, state) {
                          final needsBack = popularSearch != null ||
                              (state.mode == HomeMode.preSubmission &&
                                  (state.orderSubmissionPage == OrderSubmissionPage.confirmLocation ||
                                      state.orderSubmissionPage == OrderSubmissionPage.rideWaypointsInput));
                          if (!needsBack) return const SizedBox.shrink();
                          return backButton;
                        },
                      );
                    },
                  ),
                ),
                LayoutId(id: MobileLayoutDelegate.cardLayoutId, child: const HomeInfoPanel()),
                LayoutId(id: MobileLayoutDelegate.myLocationButtonId, child: const AppMyLocationButton()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void backButtonAction() {
    final state = locator<HomeBloc>().state;
    switch (state.mode) {
      case HomeMode.ridePreview:
        _homeBloc.add(HomeEvent.initializeWelcome(pickupPoint: locator<LocationCubit>().state.place));
      case HomeMode.preSubmission:
        if (state.orderSubmissionPage == OrderSubmissionPage.welcome) {
          _scaffoldKey.currentState?.openDrawer();
        } else {
          _homeBloc.add(
            HomeEvent.changeOrderSubmissionPage(orderSubmissionPage: OrderSubmissionPage.rideWaypointsInput),
          );
        }
      default:
        break;
    }
  }

  Widget get menuButton => BlocBuilder<HomeBloc, HomeState>(
    builder: (context, state) {
      return Badge(
        isLabelVisible: (state.scheduledRidesResponse.data?.length ?? 0) > 0,
        label: Text(state.scheduledRidesResponse.data?.length.toString() ?? '0'),
        child: FloatingActionButton.small(
          onPressed: () {
            _scaffoldKey.currentState?.openDrawer();
          },
          child: const Icon(Ionicons.menu),
        ),
      );
    },
  );

  Widget get backButton => FloatingActionButton.small(
    onPressed: () {
      if (activePopularSearchNotifier.value != null) {
        activePopularSearchNotifier.value = null;
        return;
      }
      final state = locator<HomeBloc>().state;
      switch (state.mode) {
        case HomeMode.ridePreview:
          _homeBloc.add(HomeEvent.initializeWelcome(pickupPoint: locator<LocationCubit>().state.place));
        case HomeMode.preSubmission:
          if (state.orderSubmissionPage == OrderSubmissionPage.confirmLocation) {
            _homeBloc.add(
              HomeEvent.changeOrderSubmissionPage(orderSubmissionPage: OrderSubmissionPage.rideWaypointsInput),
            );
          } else {
            _homeBloc.add(
              HomeEvent.changeOrderSubmissionPage(orderSubmissionPage: OrderSubmissionPage.welcome),
            );
          }
        default:
          throw Exception('This action can only be called from ride preview or confirm location state');
      }
    },
    child: const Icon(Icons.arrow_back),
  );
}
