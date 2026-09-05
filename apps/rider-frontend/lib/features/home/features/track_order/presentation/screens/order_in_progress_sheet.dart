import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:flutter_common/core/enums/order_status.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/enums/order_status.prod.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/app_card_sheet.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/card_handle.dart';
import 'package:ridy/core/graphql/fragments/active_order.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/point.extensions.dart';
import 'package:ridy/core/graphql/documents/track_order.graphql.dart';
import 'package:ridy/core/datasources/graphql_datasource.dart';
import 'package:flutter_common/core/presentation/waypoints_view/waypoints_view.dart';
import 'package:ridy/features/home/features/track_order/presentation/components/notice_bar.dart';
import 'package:url_launcher/url_launcher_string.dart';

import '../dialogs/cancel_ride_reason.dart';

class OrderInProgressSheet extends StatelessWidget {
  final Fragment$ActiveOrder order;

  const OrderInProgressSheet({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final pickup = order.waypoints.toPlaces.firstOrNull;
    final dropoff = order.waypoints.toPlaces.length > 1 ? order.waypoints.toPlaces.last : null;
    final driverName = (order.driver?.fullName?.isNotEmpty ?? false) ? order.driver!.fullName! : 'Driver';
    final isArriving = order.status.toEntity == OrderStatus.arrived;
    final hasArrived = order.status.toEntity == OrderStatus.arrived;
    final isStarted = order.status.toEntity == OrderStatus.started;

    return Container(
      decoration: context.responsive(
        const BoxDecoration(
          color: ColorPalette.primary40,
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        xl: const BoxDecoration(),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          context.responsive(const NoticeBar(), xl: const SizedBox()),
          AppCardSheet(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CardHandle(),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      'RIDE ID  #${order.id}',
                      style: context.bodySmall?.copyWith(
                        color: ColorPalette.neutralVariant50,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Driver row
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                              border: Border.all(color: ColorPalette.primary40, width: 2),
                            ),
                            child: Text(
                              driverName[0].toUpperCase(),
                              style: context.titleMedium?.copyWith(color: Colors.black, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  driverName,
                                  style: context.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 3),
                                Row(
                                  children: [
                                    const Icon(Icons.star, color: Colors.amber, size: 14),
                                    const SizedBox(width: 3),
                                    Text(
                                      order.driver?.rating?.toStringAsFixed(1) ?? '-',
                                      style: context.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                                    ),
                                    Text(
                                      '  •  ${order.serviceName}',
                                      style: context.bodySmall?.copyWith(color: ColorPalette.neutralVariant50),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Badge(
                            isLabelVisible: order.unreadMessagesCount > 0,
                            child: _CircleIconButton(
                              icon: Ionicons.chatbubble,
                              onPressed: () {
                                locator<HomeBloc>().add(HomeEvent.changeTrackOrderPage(page: TrackOrderPage.chat));
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          _CircleIconButton(
                            icon: Ionicons.call,
                            backgroundColor: Colors.green,
                            onPressed: () async {
                              await locator<GraphqlDatasource>().mutate(
                                Options$Mutation$initiateCall(
                                  variables: Variables$Mutation$initiateCall(orderId: order.id),
                                ),
                              );
                            },
                          ),
                        ],
                      ),

                      const SizedBox(height: 10),

                      if (hasArrived || isStarted) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          decoration: BoxDecoration(
                            color: ColorPalette.primary40.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: ColorPalette.primary40, width: 1),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Share this OTP with your driver',
                                    style: context.bodySmall?.copyWith(color: ColorPalette.neutralVariant50),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    order.pickupOtp ?? '----',
                                    style: context.headlineSmall?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 4,
                                      color: ColorPalette.primary40,
                                    ),
                                  ),
                                ],
                              ),
                              Icon(Ionicons.keypad, color: ColorPalette.primary40, size: 28),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                      ],

                      // Vehicle card
                      if ((order.driver?.vehicleName != null) ||
                          (order.driver?.vehicleColor != null) ||
                          (order.driver?.vehiclePlate != null)) ...[
                        Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: ColorPalette.neutralVariant99,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                [order.driver?.vehicleName, order.driver?.vehicleColor].nonNulls.join(' - '),
                                style: context.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (order.driver?.vehiclePlate != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.green.shade100,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  order.driver!.vehiclePlate!,
                                  style: TextStyle(fontSize: 11, color: Colors.green.shade800, fontWeight: FontWeight.bold),
                                ),
                              ),
                          ],
                        ),
                      ),
                        const SizedBox(height: 8),
                      ],

                      if (order.status.toEntity != OrderStatus.driverAccepted) ...[
                      // Address card with connector
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        decoration: BoxDecoration(
                          color: ColorPalette.neutralVariant99,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.trip_origin, size: 14, color: ColorPalette.primary40),
                                Container(
                                  width: 1.5,
                                  height: 16,
                                  margin: const EdgeInsets.symmetric(vertical: 3),
                                  color: ColorPalette.neutral90,
                                ),
                                Icon(Icons.place, size: 14, color: ColorPalette.neutralVariant50),
                              ],
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    pickup?.address ?? '—',
                                    style: context.bodySmall,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    dropoff?.address ?? '—',
                                    style: context.bodySmall,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      ],
                      if (order.status.toEntity == OrderStatus.driverAccepted || order.status.toEntity == OrderStatus.waitingForPrePay) ...[
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 100,
                          child: SingleChildScrollView(
                            child: WayPointsView(waypoints: order.waypoints.toPlaces),
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
                      BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, -5)),
                    ],
                    color: ColorPalette.neutralVariant99,
                  ),
                ),
                SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (order.status.toEntity != OrderStatus.waitingForPrePay && order.status.toEntity != OrderStatus.waitingForPostPay) ...[
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.green.shade700,
                                side: BorderSide(color: Colors.green.shade400),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                              ),
                              onPressed: () {
                                final message = Uri.encodeComponent(
                                  'Track my Route39 ride (Ride ID #${order.id})',
                                );
                                launchUrlString('https://wa.me/?text=$message');
                              },
                              icon: const Icon(Icons.ios_share, size: 16),
                              label: const Text('Share via WhatsApp', style: TextStyle(fontWeight: FontWeight.w600)),
                            ),
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: ColorPalette.error40,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                              ),
                              onPressed: () {
                                showDialog(
                                  context: context,
                                  useSafeArea: false,
                                  builder: (context) => CancelRideReasonDialog(orderId: order.id),
                                );
                              },
                              icon: const Icon(Icons.close, size: 16),
                              label: Text(context.translate.cancelRide, style: const TextStyle(fontWeight: FontWeight.w600)),
                            ),
                          ),
                        ] else ...[
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Text(
                                order.totalCost.formatCurrency(order.currency),
                                style: context.titleLarge?.copyWith(color: Colors.black, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: ColorPalette.primary40,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                                  ),
                                  onPressed: () {
                                    locator<HomeBloc>().add(HomeEvent.changeTrackOrderPage(page: TrackOrderPage.payment));
                                  },
                                  child: const Text('Proceed to Payment', style: TextStyle(fontWeight: FontWeight.w600)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              TextButton.icon(
                                style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 0)),
                                onPressed: () {
                                  showModalBottomSheet(
                                    context: context,
                                    useSafeArea: true,
                                    builder: (context) => _WaitTimePicker(currentWaitTime: order.waitMinutes ?? 0),
                                  );
                                },
                                icon: Icon(Ionicons.time, size: 15, color: ColorPalette.error40),
                                label: Text('Wait time', style: context.bodySmall?.copyWith(color: ColorPalette.error40)),
                              ),
                              const Spacer(),
                              TextButton.icon(
                                style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 0)),
                                onPressed: () {
                                  showDialog(
                                    context: context,
                                    useSafeArea: false,
                                    builder: (context) => CancelRideReasonDialog(orderId: order.id),
                                  );
                                },
                                icon: Icon(Icons.cancel, size: 15, color: ColorPalette.error40),
                                label: Text(context.translate.cancelRide, style: context.bodySmall?.copyWith(color: ColorPalette.error40)),
                              ),
                            ],
                          ),
                        ],
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

class _CircleIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;
  final Color? backgroundColor;

  const _CircleIconButton({required this.icon, required this.onPressed, this.backgroundColor});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      customBorder: const CircleBorder(),
      child: Container(
        width: 38,
        height: 38,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: backgroundColor ?? ColorPalette.neutralVariant95,
        ),
        child: Icon(icon, size: 17, color: backgroundColor != null ? Colors.white : ColorPalette.primary40),
      ),
    );
  }
}

class _WaitTimePicker extends StatefulWidget {
  final int currentWaitTime;

  const _WaitTimePicker({required this.currentWaitTime});

  @override
  State<_WaitTimePicker> createState() => _WaitTimePickerState();
}

class _WaitTimePickerState extends State<_WaitTimePicker> {
  late int selected = widget.currentWaitTime;

  @override
  Widget build(BuildContext context) {
    final options = {
      context.translate.noWaitTime: 0,
      context.translate.minutesRange("0-5"): 5,
      context.translate.minutesRange("5-10"): 10,
      context.translate.minutesRange("10-15"): 15,
      context.translate.minutesRange("15-20"): 20,
      context.translate.minutesRange("20-25"): 25,
      context.translate.minutesRange("25-30"): 30,
    };
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(context.translate.waitTime, style: context.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...options.entries.map(
              (e) => RadioListTile<int>(
                value: e.value,
                groupValue: selected,
                title: Text(e.key),
                activeColor: ColorPalette.primary40,
                onChanged: (value) => setState(() => selected = value!),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: AppPrimaryButton(
                onPressed: () {
                  Navigator.of(context).pop(selected);
                },
                child: Text(context.translate.apply),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
