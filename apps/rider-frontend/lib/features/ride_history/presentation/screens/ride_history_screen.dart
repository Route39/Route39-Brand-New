import 'package:api_response/api_response.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/config/router/app_router.dart';
import 'package:flutter_common/core/theme/animation_duration.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/features/home/presentation/components/route39_nav_bar.dart';
import 'package:ridy/features/home/features/order_preview/presentation/components/route39_header.dart';
import 'package:ridy/features/ride_history/presentation/components/ride_history_empty_state.dart';
import 'package:ridy/features/ride_history/presentation/components/ride_history_item.dart';
import 'package:ridy/gen/assets.gen.dart';

import '../blocs/ride_history.bloc.dart';

@RoutePage()
class RideHistoryScreen extends StatefulWidget {
  const RideHistoryScreen({super.key});

  @override
  State<RideHistoryScreen> createState() => _RideHistoryScreenState();
}

class _RideHistoryScreenState extends State<RideHistoryScreen> {
  @override
  void initState() {
    locator<RideHistoryBloc>().fetchRideHistory();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: locator<RideHistoryBloc>(),
      child: Scaffold(
        backgroundColor: context.theme.scaffoldBackgroundColor,
        bottomNavigationBar: const Route39NavBar(currentIndex: 1),
        body: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SafeArea(
            bottom: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                context.responsive(
                  Route39Header(onBackPressed: () {
                    context.router.maybePop();
                  }),
                  xl: const SizedBox.shrink(),
                ),
                SizedBox(height: context.responsive(16, xl: 116)),
                Text(
                  context.translate.rideHistory,
                  style: context.headlineSmall,
                ),
                const SizedBox(height: 24),
              Expanded(
                child: BlocBuilder<RideHistoryBloc, RideHistoryState>(
                  builder: (context, state) {
                    return AnimatedSwitcher(
                      duration: AnimationDuration.pageStateTransitionDesktop,
                      child: switch (state.rideHistoryState) {
                        ApiResponseInitial() => const SizedBox.shrink(),
                        ApiResponseLoading() => Assets.lottie.loading.lottie(
                            width: double.infinity,
                            height: double.infinity,
                          ),
                        ApiResponseLoaded(:final data) => data.pastOrders.isEmpty
                            ? RideHistoryEmptyState()
                            : ListView.separated(
                                padding: EdgeInsets.only(bottom: MediaQuery.paddingOf(context).bottom + 16),
                                itemBuilder: (context, index) {
                                  return RideHistoryItem(
                                    entity: data.pastOrders[index],
                                    onPressed: () => context.router.push(
                                      RideHistoryDetailsRoute(entity: data.pastOrders[index]),
                                    ),
                                  );
                                },
                                separatorBuilder: (context, index) {
                                  return const SizedBox(height: 16);
                                },
                                itemCount: data.pastOrders.length,
                              ),
                        ApiResponseError(:final message) => Center(
                            child: Text(message),
                          ),
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}
