import 'package:auto_route/auto_route.dart';
import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/blocs/location.bloc.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:flutter_common/core/presentation/buttons/app_bordered_button.dart';
import 'package:flutter_common/core/presentation/double_tap_to_exit.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:ridy_driver/core/router/app_router.dart';
import 'package:ridy_driver/features/home/presentation/blocs/home.bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:flutter_ringtone_player/flutter_ringtone_player.dart';

import 'home_screen.desktop.dart';
import 'home_screen.mobile.dart';

@RoutePage()
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final AppLifecycleListener _listener;

  @override
  void initState() {
    _listener = AppLifecycleListener(onStateChange: _onStateChanged);
    locator<AuthBloc>().requestUserInfo();
    locator<HomeBloc>().onStarted();
    super.initState();
  }

  @override
  void dispose() {
    _listener.dispose();
    super.dispose();
  }

  void _onStateChanged(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        locator<HomeBloc>().onStarted();

        locator<AuthBloc>().requestUserInfo();

        break;

      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final locationBloc = locator<LocationBloc>();
    final homeBloc = locator<HomeBloc>();
    return DoubleTapToExit(
      canExit: () {
        final status = locator<HomeBloc>().state.driverStatus;
        return status != HomeStateDriverStatus.onTrip;
      },
      child: Scaffold(
        body: MultiBlocProvider(
          providers: [
            BlocProvider.value(value: locator<HomeBloc>()),
            BlocProvider.value(value: locator<LocationBloc>()),
          ],
          child: MultiBlocListener(
            listeners: [
              BlocListener<LocationBloc, LocationState>(
                listener: (context, state) {
                  switch (state) {
                    case LocationState$Error():
                      switch (locator<HomeBloc>().state.driverStatus) {
                        case HomeStateDriverStatus.online:
                        default:
                          break;
                      }
                      break;

                    default:
                      break;
                  }
                },
              ),
              BlocListener<HomeBloc, HomeState>(
                listenWhen: (previous, current) {
                  return previous.driverStatus != current.driverStatus;
                },
                listener: (context, state) {
                  switch (state.driverStatus) {
                    case HomeStateDriverStatus.initial:
                      homeBloc.onStarted();
                      locator<AuthBloc>().requestUserInfo();
                      break;

                    case HomeStateDriverStatus.online:
                    case HomeStateDriverStatus.onTrip:
                      locationBloc.startGettingLocationUpdates();
                      break;

                    case HomeStateDriverStatus.offline:
                      locationBloc.stopGettingLocationUpdates();
                      break;

                    case HomeStateDriverStatus.accessDenied:
                      locator<AuthBloc>().onLoggedOut();
                      context.router.replace(const AuthRoute());
                      break;

                    default:
                      break;
                  }
                },
              ),
              BlocListener<HomeBloc, HomeState>(
                listenWhen: (previous, current) =>
                    previous.updateStatusResponse !=
                    current.updateStatusResponse,
                listener: (context, state) {
                  if (state.updateStatusResponse is ApiResponseError) {
                    final errorResponse =
                        state.updateStatusResponse as ApiResponseError;
                    context.showSnackBar(message: errorResponse.message);
                  }
                },
              ),
              // if new request added play sound
              BlocListener<HomeBloc, HomeState>(
                listenWhen: (previous, current) {
                  switch (current.driverStatus) {
                    case HomeStateDriverStatus.online:
                      switch (previous.driverStatus) {
                        case HomeStateDriverStatus.online:
                          return current.orderRequests.length >
                              previous.orderRequests.length;
                        default:
                          return current.orderRequests.isNotEmpty;
                      }
                    default:
                      return false;
                  }
                },
                listener: (context, state) {
                  FlutterRingtonePlayer().play(
                    fromAsset: "assets/notification.mp3",
                    looping: false,
                    volume: 1.0,
                    asAlarm: true,
                  );
                },
              ),
              BlocListener<HomeBloc, HomeState>(
                listenWhen: (previous, current) =>
                    previous.ephemeralMessages.length <
                    current.ephemeralMessages.length,
                listener: (context, state) async {
                  final homeBloc = locator<HomeBloc>();
                  for (var message in state.ephemeralMessages) {
                    switch (message.type) {
                      case Enum$EphemeralMessageType.RateRider:
                        await showDialog(
                          context: context,
                          useSafeArea: false,
                          builder: (context) {
                            return AppResponsiveDialog(
                              type: DialogType.bottomSheet,
                              header: (
                                Icons.star_outline,
                                context.translate.howWasYourTrip,
                                context.translate.submitFeedback,
                              ),
                              primaryButton: AppBorderedButton(
                                onPressed: () => Navigator.of(context).pop(),
                                title: context.translate.ok,
                              ),
                              child: const SizedBox(),
                            );
                          },
                        );
                        homeBloc.add(
                          HomeEvent.markEphemeralMessageAsSeen(
                            messageId: message.messageId,
                          ),
                        );
                        break;
                      case Enum$EphemeralMessageType.RiderCanceled:
                        await showDialog(
                          context: context,
                          useSafeArea: false,
                          builder: (context) {
                            return AppResponsiveDialog(
                              type: DialogType.bottomSheet,
                              header: (
                                Icons.cancel_outlined,
                                context.translate.canceled,
                                "The rider has canceled the ride.",
                              ),
                              primaryButton: AppBorderedButton(
                                onPressed: () => Navigator.of(context).pop(),
                                title: context.translate.ok,
                              ),
                              child: const SizedBox(),
                            );
                          },
                        );
                        homeBloc.add(
                          HomeEvent.markEphemeralMessageAsSeen(
                            messageId: message.messageId,
                          ),
                        );
                        break;
                      case Enum$EphemeralMessageType.AddPayoutMethod:
                        await showDialog(
                          context: context,
                          useSafeArea: false,
                          builder: (context) {
                            return AppResponsiveDialog(
                              type: DialogType.bottomSheet,
                              header: (
                                Icons.account_balance_wallet_outlined,
                                context.translate.payoutMethods,
                                "Please add a payout method to receive your earnings.",
                              ),
                              primaryButton: AppBorderedButton(
                                onPressed: () => Navigator.of(context).pop(),
                                title: context.translate.ok,
                              ),
                              child: const SizedBox(),
                            );
                          },
                        );
                        homeBloc.add(
                          HomeEvent.markEphemeralMessageAsSeen(
                            messageId: message.messageId,
                          ),
                        );
                        break;
                      case Enum$EphemeralMessageType.$unknown:
                        break;
                    }
                  }
                },
              ),
            ],
            child: context.responsive(
              const HomeScreenMobile(),
              xl: const HomeScreenDesktop(),
            ),
          ),
        ),
      ),
    );
  }
}
