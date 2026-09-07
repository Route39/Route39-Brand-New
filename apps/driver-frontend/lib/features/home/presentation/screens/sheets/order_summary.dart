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

  @override
  Widget build(BuildContext context) {
    return Container(
      color: ColorPalette.neutralVariant99,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            height: 150,
            decoration: const BoxDecoration(
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
            child: SafeArea(
              child: Align(
                alignment: Alignment.topLeft,
                child: order.status.toEntity == OrderStatus.finished
                    ? Padding(
                        padding: const EdgeInsets.all(16),
                        child: AppCloseButton(
                          onPressed: () {
                            locator<HomeBloc>().add(
                              HomeEvent.onSummaryConfirmed(orderId: order.id),
                            );
                          },
                        ),
                      )
                    : const SizedBox(),
              ),
            ),
          ),
          Transform.translate(
            offset: const Offset(0, -33),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AppAvatar(
                  url: order.rider?.profileImageUrl,
                  defaultAvatarPath: Assets.avatars.a1.path,
                ),
                const SizedBox(height: 8),
                Text(order.rider?.fullName ?? "-", style: context.titleMedium),
                const SizedBox(height: 4),
                Text(
                  order.serviceName,
                  style: context.bodyMedium?.copyWith(
                    color: ColorPalette.neutralVariant50,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Padding(
              // items: [
                //   ("Service fee", order.totalCost),
                //   ("Discount", -(order.couponDiscount ?? 0)),
                // ],
              padding: const EdgeInsets.all(16),
              child: Invoice(
                currency: order.currency,
                // order.totalCost already has providerShare subtracted on the
                // backend (costAfterCoupon − providerShare + fees). Adding it
                // back here gives costAfterCoupon + fees, without needing any
                // backend change.
                total: order.totalCost,
                items: [
                  ("Ride Amount", order.costBest),
                  ("GST ${order.gstPercent ?? 0}%", order.gstAmount),
                  ("Platform Fee ${order.platformFee ?? 0}", order.platformFeeAmount),
                  if (order.paymentMethod.mode == Enum$PaymentMode.PaymentGateway ||
                      order.paymentMethod.mode == Enum$PaymentMode.SavedPaymentMethod)
                    (
                      "Payment Gateway ${order.paymentGatewayFeePercent ?? 0}%",
                      order.paymentGatewayFeeAmount,
                    ),
                  ("Discount", -(order.couponDiscount ?? 0)),
                ],
              ),
            ),
          ),
          const Spacer(),
          Padding(
            padding: const EdgeInsets.all(16),
            child: AppPrimaryButton(
              isDisabled: order.status.toEntity == OrderStatus.finished,
              onPressed: () {
                showDialog(
                  context: context,
                  useSafeArea: false,
                  builder: (context) => ConfirmCashPayment(
                    orderId: order.id,
                    amount: order.totalCost,
                    currency: order.currency,
                  ),
                );
              },
              child: Text(context.translate.cashPaymentReceived),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    "The payment hasn't been settled yet",
                    textAlign: TextAlign.center,
                    style: context.bodyLarge,
                  ),
                  const SizedBox(height: 16),
                  AppBorderedButton(
                    onPressed: () {
                      launchUrlString("tel://+${order.rider?.mobileNumber}");
                    },
                    icon: Icons.call,
                    title: "Call the rider",
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
