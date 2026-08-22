import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:flutter_common/core/enums/order_status.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/enums/order_status.prod.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/app_card_sheet.dart';
import 'package:flutter_common/core/presentation/buttons/app_icon_button.dart';
import 'package:flutter_common/core/presentation/buttons/app_text_button.dart';
import 'package:flutter_common/core/presentation/card_handle.dart';
import 'package:ridy/core/graphql/fragments/active_order.extensions.dart';
import 'package:ridy/core/graphql/fragments/active_order.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/point.extensions.dart';
import 'package:ridy/core/presentation/driver_rating.dart';
import 'package:ridy/core/presentation/payment_method_select_field.dart';
import 'package:ridy/core/presentation/vehicle_info/vehicle_info.dart';
import 'package:flutter_common/core/presentation/waypoints_view/waypoints_view.dart';
import 'package:flutter_common/core/presentation/avatars/driver_avatar.dart';
import 'package:ridy/features/home/features/track_order/presentation/components/notice_bar.dart';
import 'package:url_launcher/url_launcher_string.dart';

import '../dialogs/ride_options_dialog.dart';
import '../dialogs/ride_safety_dialog.dart';

class OrderInProgressSheet extends StatelessWidget {
  final Fragment$ActiveOrder order;

  const OrderInProgressSheet({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: context.responsive(
        const BoxDecoration(
          color: ColorPalette.primary20,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(16),
          ),
        ),
        xl: const BoxDecoration(),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          context.responsive(
            const NoticeBar(),
            xl: const SizedBox(),
          ),
          AppCardSheet(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CardHandle(),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          DriverAvatar(imageUrl: order.driver?.profileImageUrl),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  order.driver?.fullName ?? '',
                                  style: context.labelLarge,
                                ),
                                DriverRating(
                                  rating: order.driver?.rating,
                                  textSuffix: "(${order.serviceName})",
                                ),
                              ],
                            ),
                          ),
                          Badge(
                            isLabelVisible: order.unreadMessagesCount > 0,
                            child: AppIconButton(
                              icon: Ionicons.chatbubble,
                              onPressed: () {
                                locator<HomeBloc>().add(HomeEvent.changeTrackOrderPage(page: TrackOrderPage.chat));
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          AppIconButton(
                            icon: Ionicons.call,
                            onPressed: () {
                              launchUrlString("tel://+${order.driver?.mobileNumber}");
                            },
                          ),
                        ],
                      ),
                      const Divider(
                        height: 16,
                      ),
                      VehicleInfo(
                        imageUrl: order.serviceImageAddress,
                        vehicleModel: order.driver?.vehicleName,
                        vehicleColor: order.driver?.vehicleColor,
                        vehiclePlateNumber: order.driver?.vehiclePlate,
                        sizeMode: context.responsive(
                          order.status.toEntity == OrderStatus.arrived
                              ? VehicleInfoSizeMode.large
                              : VehicleInfoSizeMode.compact,
                          xl: VehicleInfoSizeMode.extraLarge,
                        ),
                      ),
                      if (order.status.toEntity == OrderStatus.driverAccepted) ...[
                        const Divider(
                          height: 16,
                        ),
                        SizedBox(
                          height: 100,
                          child: SingleChildScrollView(
                            child: WayPointsView(
                              waypoints: order.waypoints.toPlaces,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  height: 16,
                  decoration: BoxDecoration(
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 10,
                        offset: const Offset(0, -5),
                      )
                    ],
                    color: ColorPalette.neutralVariant99,
                  ),
                ),
                SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Column(
                      children: [
                        PaymentMethodSelectField(
                          paymentMethod: order.paymentMethodUnion,
                          onPressed: () {
                            locator<HomeBloc>().add(HomeEvent.changeTrackOrderPage(page: TrackOrderPage.payment));
                          },
                        ),
                        const SizedBox(
                          height: 9,
                        ),
                        const Divider(
                          height: 16,
                        ),
                        Row(
                          children: [
                            AppTextButton(
                              iconData: Ionicons.cog,
                              isDense: true,
                              text: context.translate.rideOptions,
                              onPressed: () {
                                showDialog(
                                  context: context,
                                  useSafeArea: false,
                                  builder: (context) => RideOptionsSheet(
                                    waitTime: order.waitMinutes ?? 0,
                                  ),
                                );
                              },
                            ),
                            const Spacer(),
                            AppTextButton(
                              iconData: Ionicons.shield,
                              isDense: true,
                              text: context.translate.rideSafety,
                              onPressed: () {
                                showDialog(
                                  context: context,
                                  useSafeArea: false,
                                  builder: (context) => RideSafetyDialog(
                                    order: order,
                                  ),
                                );
                              },
                            ),
                          ],
                        )
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
