import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/presentation/buttons/app_bordered_button.dart';
import 'package:flutter_common/core/presentation/double_tap_to_exit.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/auth_bloc.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/blocs/location.bloc.dart';
import 'package:ridy/core/blocs/settings.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:ridy/features/home/features/rate_order/presentation/screens/rate_your_ride_sheet.dart';

import '../blocs/destination_suggestions.bloc.dart';
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

  final locationCubit = locator<LocationCubit>();
  final homeCubit = locator<HomeBloc>();
  final authBloc = locator<AuthBloc>();
  final settingsCubit = locator<SettingsCubit>();

  @override
  void initState() {
    super.initState();
    _listener = AppLifecycleListener(onStateChange: _onStateChanged);
    locationCubit.fetchCurrentLocation(
      language: settingsCubit.state.locale,
      mapProvider: settingsCubit.state.mapProvider,
    );

    switch (locationCubit.state) {
      case LocationState$Determined(:final place):
        homeCubit.add(HomeEvent.initializeWelcome(pickupPoint: place));
      case _:
    }
    homeCubit.add(
      HomeEvent.onStarted(
        authenticated: authBloc.state.isAuthenticated,
        currentLocationPlace: locationCubit.state.place,
      ),
    );

    switch (authBloc.state) {
      case AuthState$Authenticated():
        authBloc.requestUserInfo();
        locator<DestinationSuggestionsCubit>().onStarted();
      case _:
    }
  }

  @override
  void dispose() {
    _listener.dispose();
    super.dispose();
  }

  void _onStateChanged(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        homeCubit.add(
          HomeEvent.onStarted(
            authenticated: authBloc.state.isAuthenticated,
            currentLocationPlace: locationCubit.state.place,
          ),
        );
        break;

      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: locator<LocationCubit>()),
        BlocProvider.value(value: locator<HomeBloc>()),
      ],
      child: DoubleTapToExit(
        canExit: () {
          final state = locator<HomeBloc>().state;
          if (state.mode == HomeMode.rideInProgress) return false;
          if (state.mode == HomeMode.ridePreview) return false;
          if (state.mode == HomeMode.preSubmission && state.orderSubmissionPage == OrderSubmissionPage.confirmLocation) return false;
          return true;
        },
        onBackPress: () {
          final state = locator<HomeBloc>().state;
          if (state.mode == HomeMode.ridePreview) {
            locator<HomeBloc>().add(HomeEvent.initializeWelcome(pickupPoint: locator<LocationCubit>().state.place));
          } else if (state.mode == HomeMode.preSubmission && state.orderSubmissionPage == OrderSubmissionPage.confirmLocation) {
            locator<HomeBloc>().add(
              HomeEvent.changeOrderSubmissionPage(orderSubmissionPage: OrderSubmissionPage.rideWaypointsInput),
            );
          }
        },
        child: MultiBlocListener(
          listeners: [
            BlocListener<HomeBloc, HomeState>(
              listenWhen: (previous, current) => previous.ephemeralMessages.length < current.ephemeralMessages.length,
              listener: (context, state) async {
                for (var message in state.ephemeralMessages) {
                  switch (message.type) {
                    case Enum$EphemeralMessageType.RateDriver:
                      await showDialog(
                        context: context,
                        useSafeArea: false,
                        builder: (context) {
                          return RateYourRideSheet(
                            driverAvatarUrl: message.driverProfileUrl,
                            driverFullName: message.driverFullName ?? '',
                            orderId: message.orderId,
                            vehicleName: message.vehicleName ?? '',
                            serviceName: message.serviceName ?? '',
                          );
                        },
                      );
                      homeCubit.add(
                        HomeEvent.markEphemeralMessageAsSeen(
                          ephemeralMessageId: message.messageId,
                        ),
                      );
                    case Enum$EphemeralMessageType.RiderCanceled:
                    case Enum$EphemeralMessageType.DriverCanceled:
                      await showDialog(
                        context: context,
                        useSafeArea: false,
                        builder: (context) {
                          return AppResponsiveDialog(
                            type: context.responsive(DialogType.bottomSheet, lg: DialogType.dialog),
                            header: (
                              Icons.cancel_outlined,
                              context.translate.canceled,
                              "Your ride was canceled. You can try ordering again.",
                            ),
                            primaryButton: AppBorderedButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                              },
                              title: context.translate.ok,
                            ),
                            child: SizedBox(),
                          );
                        },
                      );
                      homeCubit.add(
                        HomeEvent.markEphemeralMessageAsSeen(
                          ephemeralMessageId: message.messageId,
                        ),
                      );
                    case Enum$EphemeralMessageType.$unknown:
                      throw UnsupportedError('Unknown ephemeral message type');
                    case Enum$EphemeralMessageType.RideExpired:
                      await showDialog(
                        context: context,
                        useSafeArea: false,
                        builder: (context) {
                          return AppResponsiveDialog(
                            type: context.responsive(DialogType.bottomSheet, lg: DialogType.dialog),
                            header: (
                              Icons.cancel_outlined,
                              context.translate.expired,
                              "Your ride has expired. You can try ordering again.",
                            ),
                            primaryButton: AppBorderedButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                              },
                              title: context.translate.ok,
                            ),
                            child: SizedBox(),
                          );
                        },
                      );
                      homeCubit.add(
                        HomeEvent.markEphemeralMessageAsSeen(
                          ephemeralMessageId: message.messageId,
                        ),
                      );
                  }
                }
              },
            ),
            BlocListener<AuthBloc, AuthState>(
              listener: (context, state) {
                homeCubit.add(
                  HomeEvent.onStarted(
                    authenticated: state.isAuthenticated,
                    currentLocationPlace: locationCubit.state.place,
                  ),
                );
                if (state.isAuthenticated) {
                  locator<DestinationSuggestionsCubit>().onStarted();
                }
              },
            ),
            BlocListener<LocationCubit, LocationState>(
              listenWhen: (previous, current) => previous.place == null && current.place != null,
              listener: (context, state) {
                if (homeCubit.state.mode == HomeMode.preSubmission || homeCubit.state.mode == HomeMode.loading) {
                  homeCubit.add(HomeEvent.initializeWelcome(pickupPoint: state.place));
                  return;
                }
              },
            ),
            BlocListener<HomeBloc, HomeState>(
              listenWhen: (previous, current) =>
                  previous.ridePreviewFareResponse.isError != current.ridePreviewFareResponse.isError ||
                  previous.cancelOrderResponse.isError != current.cancelOrderResponse.isError,
              listener: (context, state) {
                if (state.ridePreviewFareResponse.isError) {
                  context.showSnackBar(
                    message: state.ridePreviewFareResponse.errorMessage ?? context.translate.somethingWentWrong,
                  );
                }
                if (state.cancelOrderResponse.isError) {
                  context.showSnackBar(
                    message: state.cancelOrderResponse.errorMessage ?? context.translate.somethingWentWrong,
                  );
                }
              },
            ),
          ],
          child: context.responsive(const HomeScreenMobile(), xl: const HomeScreenDesktop()),
        ),
      ),
    );
  }
}
