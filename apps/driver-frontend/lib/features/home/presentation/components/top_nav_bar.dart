// ignore_for_file: use_build_context_synchronously

import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/datasources/location_datasource.dart';
import 'package:ridy_driver/core/enums/location_permission.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:geolocator/geolocator.dart' as geolocator;
import 'package:ionicons/ionicons.dart';

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
    this.borderRadius = const BorderRadius.all(
      Radius.circular(12),
    ),
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Container(
        padding: const EdgeInsets.all(8),
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
                if (onMenuButtonPressed != null)
                  Align(
                    alignment: Alignment.centerLeft,
                    child: CupertinoButton(
                      onPressed: onMenuButtonPressed,
                      padding: const EdgeInsets.all(8),
                      minimumSize: Size(0, 0),
                      child: const Icon(
                        Ionicons.menu,
                        color: ColorPalette.neutral50,
                      ),
                    ),
                  ),
                Positioned.fill(
                  child: Center(
                    child: switch (state.driverStatus) {
                      HomeStateDriverStatus.initial => const SizedBox(),
                      HomeStateDriverStatus.loading => const CupertinoActivityIndicator(),
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

                                final locationDatasource = locator<LocationDatasource>();
                                final locationPermissionGranted =
                                    await locationDatasource.getLocationPermissionStatus();

                                switch (locationPermissionGranted) {
                                  case LocationPermission.denied:
                                    final permissionResult = await showDialog<bool>(
                                      context: context,
                                      useSafeArea: false,
                                      builder: (context) => const LocationPermissionRequestDialog(),
                                    );
                                    if (permissionResult == true) {
                                      final permissionStatus =
                                          await locationDatasource.requestLocationPermission();
                                      if (permissionStatus == LocationPermission.deniedForever) {
                                        return;
                                      }
                                    }
                                    break;

                                  case LocationPermission.deniedForever:
                                    final permissionResult = await showDialog<bool>(
                                      context: context,
                                      useSafeArea: false,
                                      builder: (context) => const LocationPermissionDeniedForeverDialog(),
                                    );
                                    if (permissionResult == true) {
                                      final couldBeOpened =
                                          await geolocator.Geolocator.openLocationSettings();
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
                                    await locationDatasource.isLocationServiceEnabled();
                                if (!locationServiceEnabled) {
                                  final serviceEnabled =
                                      await locationDatasource.requestLocationService();
                                  if (!serviceEnabled) {
                                    return;
                                  }
                                }
                                homeBloc.onStatusChanged(Enum$DriverStatus.Online);
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
                              builder: (context) => RideSafetyDialog(
                                order: state.currentOrder!,
                              ),
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
                        showModalBottomSheet(
                          context: context,
                          backgroundColor: Colors.white,
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                          ),
                          builder: (sheetContext) {
                            return SafeArea(
                              child: Container(
                                constraints: const BoxConstraints(maxHeight: 480),
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Notifications',
                                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                                    ),
                                    const SizedBox(height: 12),
                                    Flexible(
                                      child: state.ephemeralMessages.isEmpty
                                          ? const Padding(
                                              padding: EdgeInsets.symmetric(vertical: 32),
                                              child: Center(child: Text('No notifications yet')),
                                            )
                                          : ListView.separated(
                                              shrinkWrap: true,
                                              itemCount: state.ephemeralMessages.length,
                                              separatorBuilder: (_, __) => const Divider(height: 16),
                                              itemBuilder: (context, index) {
                                                final msg = state.ephemeralMessages[index];
                                                final title = switch (msg.type) {
                                                  Enum$EphemeralMessageType.RiderCanceled => 'Ride cancelled',
                                                  Enum$EphemeralMessageType.RateRider => 'Rate your rider',
                                                  Enum$EphemeralMessageType.AddPayoutMethod => 'Add a payout method',
                                                  _ => 'Notification',
                                                };
                                                final subtitle = msg.riderFullName != null
                                                    ? 'With ${msg.riderFullName}'
                                                    : (msg.serviceName ?? '');
                                                return ListTile(
                                                  contentPadding: EdgeInsets.zero,
                                                  leading: CircleAvatar(
                                                    backgroundColor: ColorPalette.primary95,
                                                    backgroundImage: msg.riderProfileUrl != null
                                                        ? NetworkImage(msg.riderProfileUrl!)
                                                        : null,
                                                    child: msg.riderProfileUrl == null
                                                        ? const Icon(Ionicons.notifications, color: ColorPalette.primary40)
                                                        : null,
                                                  ),
                                                  title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                                                  subtitle: subtitle.isNotEmpty ? Text(subtitle) : null,
                                                  trailing: Text(
                                                    '${msg.createdAt.hour.toString().padLeft(2, '0')}:${msg.createdAt.minute.toString().padLeft(2, '0')}',
                                                    style: const TextStyle(fontSize: 12, color: ColorPalette.neutral60),
                                                  ),
                                                );
                                              },
                                            ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        );
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
