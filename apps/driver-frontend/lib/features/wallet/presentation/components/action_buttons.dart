import 'package:api_response/api_response.dart';
import 'package:ridy_driver/config/env.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/graphql/fragments/payment_method.extensions.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/features/redeem_gift_card/presentation/dialogs/redeem_gift_card_dialog.dart';
import 'package:ridy_driver/features/wallet/presentation/blocs/wallet.bloc.dart';
import 'package:ridy_driver/features/wallet/presentation/dialogs/add_credit_dialog.dart';

class ActionButtons extends StatelessWidget {
  const ActionButtons({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: ColorPalette.neutralVariant99,
        border: Border.all(
          color: ColorPalette.primary95,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1464748B),
            blurRadius: 8,
            offset: Offset(2, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(
            color: ColorPalette.primary95,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CupertinoButton(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
              onPressed: () {
                showDialog(
                  context: context,
                  useSafeArea: false,
                  builder: (context) {
                    return const RedeemGiftCardDialog();
                  },
                );
              },
              minimumSize: Size(0, 0),
              child: Row(
                children: [
                  const Icon(
                    Ionicons.gift,
                    color: ColorPalette.primary80,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    context.translate.redeemGiftCard,
                    style: context.labelLarge,
                  ),
                ],
              ),
            ),
            Container(
              width: 1,
              height: 32,
              color: ColorPalette.primary95,
            ),
            BlocBuilder<AuthBloc, AuthState>(
              builder: (context, state) {
                return CupertinoButton(
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                  onPressed: () {
                    switch (locator<WalletBloc>().state.walletState) {
                      case ApiResponseLoaded(:final data):
                        showDialog(
                          context: context,
                          useSafeArea: false,
                          builder: (context) => AddCreditDialog(
                            currency: state.profile?.currency ?? Env.defaultCurrency,
                            paymentMethods: data.paymentMethods.entities,
                          ),
                        );
                        break;

                      default:
                        throw Exception('Invalid wallet state');
                    }
                  },
                  minimumSize: Size(0, 0),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.add_circle,
                        color: ColorPalette.primary80,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        context.translate.addCredit,
                        style: context.labelLarge,
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
