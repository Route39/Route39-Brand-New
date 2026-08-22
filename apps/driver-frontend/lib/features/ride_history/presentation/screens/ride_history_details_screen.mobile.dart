import 'package:ridy_driver/core/blocs/settings.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/past_order.fragment.graphql.dart';
import 'package:ridy_driver/core/presentation/app_generic_map.dart';
import 'package:ridy_driver/features/ride_history/presentation/dialogs/report_issue_form_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/entities/place.dart';
import 'package:flutter_common/core/presentation/buttons/app_bordered_button.dart';
import 'package:generic_map/generic_map.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_top_bar.dart';

import '../components/details_sheet.dart';

class RideHistoryDetailsScreenMobile extends StatelessWidget {
  final Fragment$PastOrder entity;

  const RideHistoryDetailsScreenMobile({
    super.key,
    required this.entity,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: context.theme.scaffoldBackgroundColor,
      padding: const EdgeInsets.all(16),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppTopBar(title: context.translate.rideDetails),
            const SizedBox(height: 24),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    SizedBox(
                      height: 250,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: BlocBuilder<SettingsCubit, SettingsState>(
                          buildWhen: (previous, current) => previous.mapProvider != current.mapProvider,
                          builder: (context, settingsState) {
                            return AppGenericMap(
                              mode: MapViewMode.static,
                              initialLocation: entity.waypoints.toPlaces.first,
                              polylines: [
                                entity.directions.toPolyLineLayer(context),
                              ],
                              padding: settingsState.mapProvider == MapProviderEnum.googleMaps
                                  ? EdgeInsets.zero
                                  : const EdgeInsets.symmetric(
                                      vertical: 80,
                                      horizontal: 150,
                                    ),
                              markers: entity.waypoints.toPlaces.markers,
                              onControllerReady: (controller) {
                                controller.fitBounds(
                                  entity.waypoints.toPlaces.latLngs,
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    RideHistoryDetailsSheet(entity: entity),
                  ],
                ),
              ),
            ),
            SizedBox(
              width: double.infinity,
              child: AppBorderedButton(
                onPressed: () {
                  showDialog(
                      context: context,
                      useSafeArea: false,
                      builder: (context) {
                        return ReportIssueFormDialog(
                          orderId: entity.id,
                        );
                      });
                },
                title: context.translate.reportAnIssue,
                isPrimary: true,
                textColor: ColorPalette.error40,
              ),
            )
          ],
        ),
      ),
    );
  }
}
