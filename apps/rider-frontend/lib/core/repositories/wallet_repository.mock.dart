import 'package:api_response/api_response.dart';
import 'package:flutter_common/core/enums/payment_mode.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/graphql/documents/wallet.graphql.dart';
import 'package:ridy/core/graphql/fragments/intent_result.fragment.graphql.dart';
import 'package:ridy/core/graphql/schema.gql.dart';

import 'wallet_repository.dart';

@dev
@LazySingleton(as: WalletRepository)
class WalletRepositoryMock implements WalletRepository {
  @override
  Future<ApiResponse<Mutation$TopUpWallet>> getTopUpWallet({
    required PaymentMode paymentMode,
    required String paymentGatewayId,
    required String? orderId,
    required String currency,
    required double amount,
    required bool canPreauth,
  }) {
    return Future.delayed(
      const Duration(seconds: 1),
      // () => const Right(
      //   IntentResult.redirect(
      //     url: "https://www.stripe.com",
      //   ),
      // ),

      () => ApiResponse.loaded(
        Mutation$TopUpWallet(
          topUpWallet: Fragment$IntentResult(
            status: Enum$TopUpWalletStatus.Redirect,
            url: 'https://www.stripe.com',
          ),
        ),
      ),
    );
  }
}
