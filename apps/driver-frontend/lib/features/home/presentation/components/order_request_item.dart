import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/enums/ride_option_icon.prod.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/ride_offer.fragment.graphql.dart';
import 'package:ridy_driver/features/home/presentation/blocs/home.bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/enums/ride_option_icon.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/waypoints_view/waypoints_view.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/presentation/small_chip.dart';

class OrderRequestItem extends StatelessWidget {
  final Fragment$RideOffer request;

  const OrderRequestItem({super.key, required this.request});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 400,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        gradient: const LinearGradient(
          colors: [Color(0xFFB30000), Color(0xFFFF1A1A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1464748B),
            blurRadius: 8,
            offset: Offset(2, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: ColorPalette.neutralVariant99,
                  ),
                  padding: const EdgeInsets.all(8),
                  child: const Icon(
                    Icons.account_circle,
                    color: Color(0xFFB30000),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        request.serviceName,
                        style: context.labelLarge?.copyWith(
                          color: ColorPalette.neutral99,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  request.fareEstimate.formatCurrency(request.currency),
                  style: context.titleLarge?.copyWith(
                    color: ColorPalette.neutral99,
                  ),
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: ColorPalette.neutralVariant99,
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      SmallChip(
                        text: request.distance.toFormattedDistance(context),
                        icon: const Icon(
                          Ionicons.map,
                          color: Color(0xFFB71C1C),
                        ),
                      ),
                      SmallChip(
                        text: context.translate.durationInMinutes(
                          request.duration ~/ 60,
                        ),
                        icon: const Icon(
                          Ionicons.time,
                          color: Color(0xFFB71C1C),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 12),
                  SizedBox(
                    height: 150,
                    child: SingleChildScrollView(
                      child: WayPointsView(
                        waypoints: request.waypoints.toPlaces,
                      ),
                    ),
                  ),
                  if (request.options.isNotEmpty) ...[
                    const Divider(height: 12),
                    Row(
                      children: [
                        Text(
                          context.translate.preferences,
                          style: context.bodyMedium,
                        ),
                        Expanded(
                          child: Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            alignment: WrapAlignment.end,
                            children: [
                              for (final preference in request.options)
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: const Color(0xFFFFE5E5),
                                    ),
                                  ),
                                  child: Icon(
                                    preference.icon.toEntity.icon,
                                    color: Color(0xFFB30000),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: BlocBuilder<HomeBloc, HomeState>(
                      builder: (context, state) {
                        return AppPrimaryButton(
                          isDisabled: state.acceptOrderReponse.isLoading,
                          onPressed: () {
                            locator<HomeBloc>().onAcceptOrder(request);
                          },
                          child: Text(context.translate.acceptOrder),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
