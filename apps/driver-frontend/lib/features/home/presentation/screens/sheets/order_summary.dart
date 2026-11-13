import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/enums/order_status.prod.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/current_order.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:ridy_driver/features/home/presentation/blocs/home.bloc.dart';
import 'package:ridy_driver/features/home/presentation/dialogs/confirm_cash_payment.dart';
import 'package:ridy_driver/gen/assets.gen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/enums/order_status.dart';
import 'package:flutter_common/core/presentation/avatars/app_avatar.dart';
import 'package:flutter_common/core/presentation/buttons/app_bordered_button.dart';
import 'package:flutter_common/core/presentation/buttons/app_close_button.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/invoice/invoice.dart';
import 'package:url_launcher/url_launcher_string.dart';

class OrderSummary extends StatelessWidget {
  final Fragment$ActiveOrder order;

  const OrderSummary({super.key, required this.order});

  num _n(num? v) => v ?? 0;

  bool get _isOnline =>
      order.paymentMethod.mode == Enum$PaymentMode.PaymentGateway ||
      order.paymentMethod.mode == Enum$PaymentMode.SavedPaymentMethod;

  num get _total =>
      order.costBest +
      order.gstAmount +
      order.platformFeeAmount +
      _n(order.waitingChargeAmount) +
      (_isOnline ? order.paymentGatewayFeeAmount : 0) -
      _n(order.couponDiscount) +
      _n(order.tipAmount);

  String get _paymentLabel =>
      order.paymentMethod.mode == Enum$PaymentMode.Cash ? "Cash" : "Online";

  List get _wps => (order.waypoints as List?) ?? [];

  String _addr(dynamic wp) => wp?.address?.toString() ?? "-";

  @override
  Widget build(BuildContext context) {
    final isFinished = order.status.toEntity == OrderStatus.finished;
    final wps = _wps;
    final pickup = wps.isNotEmpty ? _addr(wps.first) : "-";
    final drop = wps.length > 1 ? _addr(wps.last) : "-";
    final km = (_n(order.estimatedDistance) / 1000).toStringAsFixed(1);
    final mins = (_n(order.estimatedDuration) / 60).round();

    return Container(
      color: ColorPalette.neutralVariant99,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        height: 80,
                        margin: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: const BoxDecoration(
                          borderRadius: BorderRadius.all(Radius.circular(16)),
                          gradient: LinearGradient(
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                            colors: [
                              Color(0xFFB30000),
                              Color(0xFFE00000),
                              Color(0xFFFF4B4B),
                            ],
                          ),
                        ),
                        alignment: Alignment.topLeft,
                        child: isFinished
                            ? Padding(
                                padding: const EdgeInsets.all(12),
                                child: AppCloseButton(
                                  onPressed: () {
                                    locator<HomeBloc>().add(
                                      HomeEvent.onSummaryConfirmed(
                                          orderId: order.id),
                                    );
                                  },
                                ),
                              )
                            : const SizedBox(),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(top: 47),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              AppAvatar(
                                url: order.rider?.profileImageUrl,
                                defaultAvatarPath: Assets.avatars.a1.path,
                              ),
                              const SizedBox(height: 8),
                              Text(order.rider?.fullName ?? "-",
                                  style: context.titleMedium),
                              const SizedBox(height: 2),
                              Text(
                                order.serviceName,
                                style: context.bodyMedium?.copyWith(
                                  color: ColorPalette.neutralVariant50,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _tripDetails(context, pickup, drop, km, mins),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
                    child: Invoice(
                      currency: order.currency,
                      total: _total.toDouble(),
                      items: [
                        ("Ride Amount", order.costBest),
                        ("GST ${order.gstPercent ?? 0}%", order.gstAmount),
                        (
                          "Platform Fee ${order.platformFee ?? 0}",
                          order.platformFeeAmount,
                        ),
                        if (_n(order.waitingChargeAmount) > 0)
                          ("Waiting Charges", order.waitingChargeAmount ?? 0),
                        if (_isOnline)
                          (
                            "Payment Gateway ${order.paymentGatewayFeePercent ?? 0}%",
                            order.paymentGatewayFeeAmount,
                          ),
                        if (_n(order.tipAmount) > 0)
                          ("Tip", order.tipAmount ?? 0),
                        ("Discount", -(order.couponDiscount ?? 0)),
                      ],
                    ),
                  ),
                  if (!isFinished)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        "The payment hasn't been settled yet",
                        textAlign: TextAlign.center,
                        style: context.bodyMedium?.copyWith(
                          color: ColorPalette.neutralVariant50,
                        ),
                      ),
                    ),
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: AppBorderedButton(
                      onPressed: () {
                        launchUrlString("tel:+${order.rider?.mobileNumber}");
                      },
                      icon: Icons.call,
                      title: "Call the rider",
                    ),
                  ),
                ],
              ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: AppPrimaryButton(
                isDisabled: isFinished,
                onPressed: () {
                  showDialog(
                    context: context,
                    useSafeArea: false,
                    builder: (context) => ConfirmCashPayment(
                      orderId: order.id,
                      amount: _total.toDouble(),
                      currency: order.currency,
                    ),
                  );
                },
                child: Text(context.translate.cashPaymentReceived),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _tripDetails(BuildContext context, String pickup, String drop,
      String km, int mins) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ColorPalette.neutralVariant90),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text("Trip Details", style: context.titleSmall),
          const SizedBox(height: 12),
          _place(context, Icons.my_location, Colors.green, "Pickup", pickup),
          const SizedBox(height: 10),
          _place(context, Icons.location_on, const Color(0xFFB30000), "Drop",
              drop),
          const Divider(height: 24),
          Row(
            children: [
              _stat(context, "Distance", "$km km"),
              _stat(context, "Duration", "$mins min"),
              _stat(context, "Payment", _paymentLabel),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            "Trip ID: #${order.id}",
            style: context.bodySmall
                ?.copyWith(color: ColorPalette.neutralVariant50),
          ),
        ],
      ),
    );
  }

  Widget _place(BuildContext context, IconData icon, Color color, String label,
      String address) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: context.bodySmall
                      ?.copyWith(color: ColorPalette.neutralVariant50)),
              Text(address, style: context.bodyMedium),
            ],
          ),
        ),
      ],
    );
  }

  Widget _stat(BuildContext context, String label, String value) {
    return Expanded(
      child: Column(
        children: [
          Text(label,
              style: context.bodySmall
                  ?.copyWith(color: ColorPalette.neutralVariant50)),
          const SizedBox(height: 2),
          Text(value, style: context.titleSmall),
        ],
      ),
    );
  }
}
