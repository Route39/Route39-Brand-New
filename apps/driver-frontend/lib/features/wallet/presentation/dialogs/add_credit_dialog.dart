import 'package:api_response/api_response.dart';
import 'package:auto_route/auto_route.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:ridy_driver/core/graphql/documents/home.graphql.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/entities/payment_method_union.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
import 'package:flutter_common/core/presentation/app_segmented_amount_field.dart';
import 'package:flutter_common/core/presentation/payment_method_list_view.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'package:ridy_driver/core/datasources/graphql_datasource.dart';
import '../../data/razorpay_js_interop.dart';

import '../blocs/top_up_wallet.bloc.dart';
import '../blocs/wallet.bloc.dart';

class AddCreditDialog extends StatefulWidget {
  final List<PaymentMethodUnion> paymentMethods;
  final String currency;

  const AddCreditDialog({
    super.key,
    required this.paymentMethods,
    required this.currency,
  });

  @override
  State<AddCreditDialog> createState() => _AddCreditDialogState();
}

class _AddCreditDialogState extends State<AddCreditDialog> {
  final GlobalKey<FormState> formKey = GlobalKey<FormState>();
  double? amount;
  PaymentMethodUnion? paymentMethodUnion;
  bool _isProcessingPayment = false;

  Future<void> _startRazorpayPayment(BuildContext context) async {
    if (_isProcessingPayment) return;
    _isProcessingPayment = true;
    final datasource = locator<GraphqlDatasource>();

    final orderResponse = await datasource.mutate(
      Options$Mutation$CreateRazorpayTopUpOrder(
        variables: Variables$Mutation$CreateRazorpayTopUpOrder(amount: amount!),
      ),
    );

    // ignore: avoid_print
    print('[PAY-DEBUG] orderResponse: \${orderResponse.data}, error: \${orderResponse is ApiResponseError ? (orderResponse as ApiResponseError).error : null}');
    final order = orderResponse.data?.createRazorpayTopUpOrder;
    if (order == null) {
      if (context.mounted) {
        context.showSnackBar(message: 'Could not start payment');
      }
      return;
    }

    openRazorpayCheckout(
      keyId: order.keyId,
      orderId: order.orderId,
      amountInPaise: amount! * 100,
      name: 'Route39 Wallet Top-up',
      description: 'Wallet recharge',
      onSuccess: (paymentId, respOrderId, signature) async {
        final verifyResponse = await datasource.mutate(
          Options$Mutation$VerifyRazorpayTopUp(
            variables: Variables$Mutation$VerifyRazorpayTopUp(
              razorpayOrderId: respOrderId,
              razorpayPaymentId: paymentId,
              razorpaySignature: signature,
              amount: amount!,
            ),
          ),
        );
        if (verifyResponse.data?.verifyRazorpayTopUp == true) {
          if (context.mounted) {
            context.router.maybePop();
            locator<WalletBloc>().fetchWalletData();
            context.showSnackBar(message: context.translate.topUpSuccess);
          }
        } else {
          if (context.mounted) {
            context.showSnackBar(message: 'Payment verification failed');
          }
        }
      },
      onError: (reason) {
        if (context.mounted) {
          context.showSnackBar(message: 'Payment failed: \$reason');
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: locator<TopUpWalletBloc>(),
      child: AppResponsiveDialog(
        type: context.responsive(
          DialogType.bottomSheet,
          xl: DialogType.dialog,
        ),
        onBackPressed: () => context.router.maybePop(),
        header: (Ionicons.wallet, context.translate.addCreditToWallet, null),
        primaryButton: BlocConsumer<TopUpWalletBloc, TopUpWalletState>(
          listener: (context, state) {
            switch (state.topUpWalletState) {
              case ApiResponseLoaded(:final data):
                if (data.topUpWallet.status ==
                    Enum$TopUpWalletStatus.Redirect) {
                  launchUrlString(
                    data.topUpWallet.url!,
                    mode: LaunchMode.externalApplication,
                  );
                }
                context.router.maybePop();
                locator<WalletBloc>().fetchWalletData();
                context.showSnackBar(
                  message: context.translate.topUpSuccess,
                );
                break;
              case ApiResponseError():
                context.showSnackBar(
                  message: 'top up failed',
                );
                break;

              default:
                // Do nothing for other states
                break;
            }
          },
          builder: (context, state) {
            return AppPrimaryButton(
              isDisabled: switch (state.topUpWalletState) {
                ApiResponseLoading() => true,
                _ => false,
              },
              onPressed: () {
                // ignore: avoid_print
                print('[PAY-DEBUG] Button pressed, amount=\$amount, formValid=\${formKey.currentState?.validate()}');
                if (formKey.currentState?.validate() == true) {
                  formKey.currentState?.save();
                  _startRazorpayPayment(context);
                }
              },
              child: Text(
                context.translate.payNow,
              ),
            );
          },
        ),
        child: Form(
          key: formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.translate.selectAmount,
                style: context.titleSmall,
              ),
              const SizedBox(height: 16),
              Center(
                child: SegmentedAmountField(
                  amounts: Constants.walletPresets,
                  currency: widget.currency,
                  onAmountChanged: (value) => amount = value,
                  onSaved: (value) => amount = value,
                ),
              ),
              const SizedBox(height: 16),
              FormField<PaymentMethodUnion>(
                onSaved: (newValue) => paymentMethodUnion = newValue,
                builder: (state) {
                  return PaymentMethodListView(
                    paymentMethods: widget.paymentMethods,
                    selectedPaymentMethod: state.value,
                    onSelected: (method) {
                      state.didChange(method);
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
