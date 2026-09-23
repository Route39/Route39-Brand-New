// ignore_for_file: use_build_context_synchronously

import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/datasources/location_datasource.dart';
import 'package:ridy_driver/core/enums/location_permission.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:ridy_driver/core/router/app_router.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:geolocator/geolocator.dart' as geolocator;
import 'package:ionicons/ionicons.dart';
import 'package:ridy_driver/features/home/presentation/screens/home_screen.mobile.dart';

import '../blocs/home.bloc.dart';
import '../dialogs/location_permission_denied_forever_dialog.dart';
import '../dialogs/location_permission_request_dialog.dart';
import '../dialogs/ride_safety_dialog.dart';

class TopNavBar extends StatelessWidget {
  final Function()? onMenuButtonPressed;
  final BorderRadiusGeometry borderRadius;

  const TopNavBar({
    super.key,
    this.onMenuButtonPressed,
    this.borderRadius = const BorderRadius.all(Radius.circular(12)),
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(8, 12, 8, 8),
        decoration: BoxDecoration(
          color: ColorPalette.neutralVariant99,
          borderRadius: borderRadius,
          boxShadow: [
            BoxShadow(
              color: const Color(0xff64748B).withValues(alpha: 0.08),
              blurRadius: 8,
              offset: const Offset(2, 4),
            ),
          ],
        ),
        child: BlocBuilder<HomeBloc, HomeState>(
          builder: (context, state) {
            return Stack(
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: ValueListenableBuilder<int>(
                    valueListenable: SelectedTabNotifier.instance,
                    builder: (context, selectedTab, _) {
                      if (selectedTab != 0) {
                        return CupertinoButton(
                          onPressed: () =>
                              SelectedTabNotifier.instance.goBack(),
                          padding: const EdgeInsets.all(8),
                          minimumSize: Size(0, 0),
                          child: const Icon(
                            Icons.arrow_back,
                            color: ColorPalette.neutral50,
                          ),
                        );
                      }
                      if (onMenuButtonPressed != null) {
                        return CupertinoButton(
                          onPressed: onMenuButtonPressed,
                          padding: const EdgeInsets.all(8),
                          minimumSize: Size(0, 0),
                          child: const Icon(
                            Ionicons.menu,
                            color: ColorPalette.neutral50,
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                ),
                Positioned.fill(
                  child: Center(
                    child: switch (state.driverStatus) {
                      HomeStateDriverStatus.initial => const SizedBox(),
                      HomeStateDriverStatus.loading =>
                        const CupertinoActivityIndicator(),
                      HomeStateDriverStatus.accessDenied => Text(
                        context.translate.accessDenied,
                        style: context.titleSmall,
                        textAlign: TextAlign.center,
                      ),
                      HomeStateDriverStatus.onTrip => Text(
                        context.translate.onTrip,
                        style: context.titleSmall,
                        textAlign: TextAlign.center,
                      ),
                      HomeStateDriverStatus.online => Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            context.translate.online,
                            style: context.titleSmall,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(width: 8),
                          CupertinoSwitch(
                            value: true,
                            onChanged: (_) async {
                              locator<HomeBloc>().onStatusChanged(
                                Enum$DriverStatus.Offline,
                              );
                            },
                            activeTrackColor: ColorPalette.primary40,
                          ),
                        ],
                      ),
                      HomeStateDriverStatus.offline => Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            context.translate.offline,
                            style: context.titleSmall,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(width: 8),
                          CupertinoSwitch(
                            value: false,
                            onChanged: (_) async {
                              final homeBloc = locator<HomeBloc>();

                              final locationDatasource =
                                  locator<LocationDatasource>();
                              final locationPermissionGranted =
                                  await locationDatasource
                                      .getLocationPermissionStatus();

                              switch (locationPermissionGranted) {
                                case LocationPermission.denied:
                                  final permissionResult = await showDialog<bool>(
                                    context: context,
                                    useSafeArea: false,
                                    builder: (context) =>
                                        const LocationPermissionRequestDialog(),
                                  );
                                  if (permissionResult == true) {
                                    final permissionStatus =
                                        await locationDatasource
                                            .requestLocationPermission();
                                    if (permissionStatus ==
                                        LocationPermission.deniedForever) {
                                      return;
                                    }
                                  }
                                  break;

                                case LocationPermission.deniedForever:
                                  final permissionResult = await showDialog<bool>(
                                    context: context,
                                    useSafeArea: false,
                                    builder: (context) =>
                                        const LocationPermissionDeniedForeverDialog(),
                                  );
                                  if (permissionResult == true) {
                                    final couldBeOpened = await geolocator
                                        .Geolocator.openLocationSettings();
                                    if (!couldBeOpened) {
                                      context.showSnackBar(
                                        message:
                                            "Could not open location settings, please enable location permissions manually.",
                                      );
                                    }
                                  }
                                  return;

                                case LocationPermission.whileInUse:
                                  context.showSnackBar(
                                    message:
                                        "Background location updates are not allowed, Please allow this permission in your phone settings for optimal experience.",
                                  );
                                  break;

                                case LocationPermission.always:
                                  break;
                              }

                              final locationServiceEnabled =
                                  await locationDatasource
                                      .isLocationServiceEnabled();
                              if (!locationServiceEnabled) {
                                final serviceEnabled = await locationDatasource
                                    .requestLocationService();
                                if (!serviceEnabled) {
                                  return;
                                }
                              }
                              homeBloc.onStatusChanged(
                                Enum$DriverStatus.Online,
                              );
                            },
                            activeTrackColor: ColorPalette.primary40,
                          ),
                        ],
                      ),
                    },
                  ),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (state.currentOrder != null)
                        CupertinoButton(
                          minimumSize: Size(0, 0),
                          padding: const EdgeInsets.all(8),
                          onPressed: () {
                            showDialog(
                              context: context,
                              useSafeArea: false,
                              builder: (context) =>
                                  RideSafetyDialog(order: state.currentOrder!),
                            );
                          },
                          child: const Icon(
                            Ionicons.shield,
                            color: ColorPalette.neutral50,
                          ),
                        ),
                      Badge(
                        isLabelVisible: state.ephemeralMessages.isNotEmpty,
                        label: Text("${state.ephemeralMessages.length}"),
                        child: CupertinoButton(
                          minimumSize: Size(0, 0),
                          padding: const EdgeInsets.all(8),
                          onPressed: () {
                            context.router.push(const NotificationsRoute());
                          },
                          child: const Icon(
                            Ionicons.notifications,
                            color: ColorPalette.neutral50,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
