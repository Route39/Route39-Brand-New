import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/enums/order_status.prod.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.extensions.dart';
import 'package:ridy_driver/core/presentation/slider_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/enums/order_status.dart';
import 'package:flutter_common/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/buttons/app_text_button.dart';
import 'package:flutter_common/core/presentation/waypoints_view/waypoints_view.dart';
import 'package:flutter_common/core/theme/animation_duration.dart';
import 'package:flutter_common/core/presentation/card_handle.dart';
import 'package:flutter_common/core/presentation/buttons/app_icon_button.dart';

import 'package:ionicons/ionicons.dart';
import 'package:url_launcher/url_launcher_string.dart';

import '../../blocs/home.bloc.dart';
import '../../components/notice_bar_content.dart';
import '../../components/payment_method_select_field.dart';
import '../../components/waiting_time_button.dart';
import '../../dialogs/cancel_ride_reason.dart';
import '../../dialogs/pickup_otp_dialog.dart';

class ActiveOrderSheet extends StatelessWidget {
  const ActiveOrderSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: context.responsive(
        BoxDecoration(
          color: const Color(0xFF8F0000),
          borderRadius: BorderRadius.circular(30),
        ),
        xl: const BoxDecoration(),
      ),
      child: BlocBuilder<HomeBloc, HomeState>(
        builder: (context, state) {
          final order = state.currentOrder;
          if (order == null) {
            return const SizedBox.shrink();
          }
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              context.responsive(
                AnimatedSwitcher(
                  duration: AnimationDuration.pageStateTransitionMobile,
                  child:
                      (order.status.toEntity == OrderStatus.driverAccepted &&
                          order.pickupEta != null)
                      ? NoticeBarContent(
                          icon: Ionicons.time,
                          text: context.translate.noticePickingUpRiderIn,
                          trailingText: order.pickupEta?.minutesFromNow(
                            context,
                          ),
                        )
                      : order.status.toEntity == OrderStatus.arrived
                      ? NoticeBarContent(
                          icon: Icons.info,
                          text: context.translate.headingToDestination,
                        )
                      : order.status.toEntity == OrderStatus.started
                      ? NoticeBarContent(
                          icon: Ionicons.time,
                          text: context.translate.headingToDestination,
                          trailingText: order.dropoffEta?.minutesFromNow(
                            context,
                          ),
                        )
                      : const SizedBox.shrink(),
                ),
                xl: const SizedBox(),
              ),
              Container(
                decoration: const BoxDecoration(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                  color: ColorPalette.neutralVariant99,
                ),
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: SafeArea(
                  top: false,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const CardHandle(),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: ColorPalette.neutral90,
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.account_circle,
                                color: Color(0xFFB30000),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    "${order.rider?.fullName}",
                                    style: context.labelMedium,
                                  ),
                                  Text(
                                    order.serviceName,
                                    style: context.bodyMedium?.copyWith(
                                      color: ColorPalette.neutralVariant50,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Badge(
                              isLabelVisible: order.unreadMessagesCount > 0,
                              child: AppIconButton(
                                icon: Ionicons.chatbubble,
                                onPressed: () {
                                  locator<HomeBloc>().add(
                                    const HomeEvent.onShowChat(),
                                  );
                                },
                              ),
                            ),
                            const SizedBox(width: 8),
                            AppIconButton(
                              icon: Ionicons.call,
                              onPressed: () {
                                launchUrlString(
                                  "tel://+${order.rider?.mobileNumber}",
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                      const Divider(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: WayPointsView(
                          waypoints: order.waypoints.toPlaces,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        height: 8,
                        decoration: BoxDecoration(
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.02),
                              blurRadius: 10,
                              offset: const Offset(0, -5),
                            ),
                          ],
                          color: ColorPalette.neutralVariant99,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            PaymentMethodSelectField(
                              order: order,
                              onPressed: null,
                            ),
                            const SizedBox(height: 4),
                            const Divider(height: 8),
                            Row(
                              children: [
                                const WaitingTimeButton(),
                                const Spacer(),
                                AppTextButton(
                                  iconData: Ionicons.closeCircle,
                                  isDense: true,
                                  text: context.translate.cancelRide,
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      useSafeArea: false,
                                      builder: (context) =>
                                          CancelRideReasonDialog(
                                            orderId: order.id,
                                          ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      AnimatedSwitcher(
                        duration: AnimationDuration.pageStateTransitionMobile,
                        child: Padding(
                          padding: const EdgeInsets.all(10).copyWith(bottom: 6),
                          child:
                              order.status.toEntity ==
                                  OrderStatus.driverAccepted
                              ? SliderButton(
                                  text: context.translate.slideToConfirmArrival,
                                  onSlided: () {
                                    locator<HomeBloc>().add(
                                      HomeEvent.onArrivedToPickupPoint(
                                        orderId: order.id,
                                      ),
                                    );
                                  },
                                )
                              : order.status.toEntity == OrderStatus.arrived
                              ? SliderButton(
                                  text: context.translate.slideToConfirmPickup,
                                  onSlided: () {
                                    showDialog(
                                      context: context,
                                      useSafeArea: false,
                                      builder: (context) =>
                                          PickupOtpDialog(orderId: order.id),
                                    );
                                  },
                                )
                              : order.status.toEntity == OrderStatus.started
                              ? SliderButton(
                                  text: context.translate.slideToConfirmDropoff,
                                  onSlided: () {
                                    locator<HomeBloc>().add(
                                      HomeEvent.onArrivedToDestination(
                                        order: order,
                                      ),
                                    );
                                  },
                                )
                              : const SizedBox.shrink(),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
