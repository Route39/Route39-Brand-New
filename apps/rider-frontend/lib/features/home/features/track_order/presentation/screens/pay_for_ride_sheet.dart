import 'package:api_response/api_response.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/enums/order_status.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:flutter_common/core/entities/payment_method_union.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/auth_bloc.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/enums/order_status.prod.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/core/graphql/fragments/active_order.extensions.dart';
import 'package:ridy/features/home/features/track_order/presentation/dialogs/pay_in_cash_dialog.dart';

import 'package:ridy/gen/assets.gen.dart' as rider_assets;
import 'package:ridy/core/razorpay_js_interop.dart';
import 'package:ridy/core/datasources/graphql_datasource.dart';
import 'package:ridy/core/graphql/documents/home.graphql.dart';

import 'package:url_launcher/url_launcher_string.dart';

import '../blocs/pay_for_ride.bloc.dart';
import '../dialogs/cancel_ride_reason.dart';

class PayForRideSheet extends StatefulWidget {
  const PayForRideSheet({super.key});

  @override
  createState() => _SelectPaymentMethodSheetState();
}

class _SelectPaymentMethodSheetState extends State<PayForRideSheet> {
  double tip = 0;
  final customTipController = TextEditingController();
  void _startRazorpayRidePayment(BuildContext context, String orderId, double amount, String currency) {
    locator<PayForRideCubit>().payWithRazorpay(
      currency: currency,
      amount: amount,
      orderId: orderId,
    );
  }

  @override
  void initState() {
    final order = locator<HomeBloc>().state.activeOrder;
    final profile = locator<AuthBloc>().state.profile;
    locator<PayForRideCubit>().load(
      selectedPaymentMethod: order?.paymentMethodUnion,
      walletCreditSufficient:
          (profile?.walletCredit ?? 0) > (order?.totalCost ?? 0) &&
          profile?.currency == order?.currency,
      cashEnabled: true,
    );
    super.initState();
  }

  @override
  void dispose() {
    customTipController.dispose();
    super.dispose();
  }

  Future<void> _pickCustomTip(BuildContext context) async {
    final result = await showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Custom tip'),
        content: TextField(
          controller: customTipController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(hintText: 'Enter amount'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              final value = double.tryParse(customTipController.text) ?? 0;
              Navigator.of(context).pop(value);
            },
            child: const Text('Apply'),
          ),
        ],
      ),
    );
    if (result != null) {
      setState(() => tip = result);
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: locator<PayForRideCubit>(),
      child: MultiBlocListener(
        listeners: [
          BlocListener<PayForRideCubit, PayForRideState>(
            listenWhen: (previous, current) =>
                previous.razorpayOrderState != current.razorpayOrderState,
            listener: (context, state) {
              switch (state.razorpayOrderState) {
                case ApiResponseError(:final errorMessage):
                  context.showSnackBar(
                    message:
                        errorMessage ?? context.translate.somethingWentWrong,
                  );
                  break;

                case ApiResponseLoaded(:final data):
                  final razorpayOrder = data;

                  openRazorpayCheckout(
                    keyId: razorpayOrder.keyId,
                    orderId: razorpayOrder.orderId,
                    amountInPaise: razorpayOrder.amount * 100,
                    currency: razorpayOrder.currency,
                    name: 'Route39',
                    description: 'Ride payment',
                    onSuccess: (paymentId, razorpayOrderId, signature) {
                      locator<PayForRideCubit>().verifyRazorpayPayment(
                        orderId: razorpayOrder.orderId,
                        razorpayOrderId: razorpayOrderId,
                        razorpayPaymentId: paymentId,
                        razorpaySignature: signature,
                      );
                    },
                    onError: (reason) {
                      context.showSnackBar(message: reason);
                    },
                  );
                  break;

                default:
                  break;
              }
            },
          ),
          BlocListener<PayForRideCubit, PayForRideState>(
            listenWhen: (previous, current) =>
                previous.paymentStatus != current.paymentStatus,
            listener: (context, state) {
              switch (state.paymentStatus) {
                case ApiResponseError(:final errorMessage):
                  context.showSnackBar(
                    message:
                        errorMessage ?? context.translate.somethingWentWrong,
                  );
                  break;

                case ApiResponseLoaded(:final data):
                  if (data.url != null) {
                    launchUrlString(
                      data.url!,
                      mode: LaunchMode.externalApplication,
                    );
                    return;
                  }
                  locator<HomeBloc>().add(
                    HomeEvent.changeTrackOrderPage(
                      page: TrackOrderPage.overview,
                    ),
                  );
                  break;

                default:
                  break;
              }
            },
          ),
        ],
        child: BlocBuilder<HomeBloc, HomeState>(
          builder: (context, state) {
            final activeOrder = state.activeOrder;
            if (activeOrder == null) {
              return const SizedBox.shrink();
            }
            final total = activeOrder.totalCost + tip;
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(28),
                  bottom: Radius.circular(28),
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: SafeArea(
                bottom: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                      child: Text(
                        'Kindly verify the trip details',
                        textAlign: TextAlign.center,
                        style: context.titleMedium?.copyWith(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: ColorPalette.neutralVariant99,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: Colors.red.withOpacity(0.2),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Text(
                                'SINGLE RIDE',
                                style: TextStyle(
                                  color: Colors.red,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Total Amount',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  total.formatCurrency(activeOrder.currency),
                                  style: const TextStyle(
                                    color: Colors.red,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                      child: Text(
                        'SUPPORT YOUR DRIVER WITH A TIP',
                        style: context.bodySmall?.copyWith(
                          color: ColorPalette.neutralVariant50,
                          letterSpacing: 0.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _TipChip(
                              label: 'No Tip',
                              selected: tip == 0,
                              onTap: () => setState(() => tip = 0),
                            ),
                            const SizedBox(width: 8),
                            _TipChip(
                              label: '₹10',
                              selected: tip == 10,
                              onTap: () => setState(() => tip = 10),
                            ),
                            const SizedBox(width: 8),
                            _TipChip(
                              label: '₹20',
                              selected: tip == 20,
                              onTap: () => setState(() => tip = 20),
                            ),
                            const SizedBox(width: 8),
                            _TipChip(
                              label: '₹50',
                              selected: tip == 50,
                              onTap: () => setState(() => tip = 50),
                            ),
                            const SizedBox(width: 8),
                            _TipChip(
                              label: 'Custom',
                              selected: ![0, 10, 20, 50].contains(tip),
                              onTap: () => _pickCustomTip(context),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: BlocBuilder<PayForRideCubit, PayForRideState>(
                        builder: (context, state) {
                          return switch (state.savedPaymentMethodsState) {
                            ApiResponseInitial() => const SizedBox.shrink(),
                            ApiResponseLoading() => Center(
                              child: rider_assets.Assets.lottie.loading.lottie(
                                width: 60,
                                height: 60,
                              ),
                            ),
                            ApiResponseError(:final errorMessage) => Center(
                              child: Text(
                                errorMessage ??
                                    context.translate.somethingWentWrong,
                              ),
                            ),
                            ApiResponseLoaded() => Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.red,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(28),
                                      ),
                                    ),
                                    onPressed: () {
                                      showDialog(
                                        context: context,
                                        useSafeArea: false,
                                        builder: (context) =>
                                            const PayInCashDialog(),
                                      );
                                    },
                                    icon: const Icon(
                                      Icons.payments_outlined,
                                      size: 18,
                                    ),
                                    label: Text(
                                      'Cash (${total.formatCurrency(activeOrder.currency)})',
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.red,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(28),
                                      ),
                                    ),
                                    onPressed: () {
                                      _startRazorpayRidePayment(context, activeOrder.id, total, activeOrder.currency);
                                    },
                                    icon: const Icon(
                                      Icons.credit_card,
                                      size: 18,
                                    ),
                                    label: Text(
                                      'UPI (${total.formatCurrency(activeOrder.currency)})',
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          };
                        },
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 8, bottom: 16),
                      child: Text(
                        '* 2% GATEWAY FEE APPLIES TO ONLINE/UPI PAYMENTS',
                        textAlign: TextAlign.center,
                        style: context.bodySmall?.copyWith(
                          color: ColorPalette.neutralVariant50,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _TipChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _TipChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? Colors.red : ColorPalette.neutralVariant99,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? Colors.red : ColorPalette.neutralVariant80,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.black87,
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
