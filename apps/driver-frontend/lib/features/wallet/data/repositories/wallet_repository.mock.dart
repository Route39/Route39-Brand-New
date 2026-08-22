import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/documents/wallet.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/driver_transactions.mock.dart';
import 'package:ridy_driver/core/graphql/fragments/intent_result.mock.dart';
import 'package:ridy_driver/core/graphql/fragments/payment_method.mock.dart';
import 'package:flutter_common/core/enums/payment_mode.dart';
import 'package:injectable/injectable.dart';

import '../../domain/repositories/wallet_repository.dart';

@dev
@LazySingleton(as: WalletRepository)
class WalletRepositoryMock implements WalletRepository {
  @override
  Future<ApiResponse<Query$Wallet>> getWalletData() async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded(
      Query$Wallet(
        driverTransacions: Query$Wallet$driverTransacions(
          edges: [
            Query$Wallet$driverTransacions$edges(
              node: mockDriverTransaction1,
            ),
            Query$Wallet$driverTransacions$edges(
              node: mockDriverTransaction2,
            ),
          ],
        ),
        paymentMethods: [mockPaymentMethod],
      ),
    );
  }

  @override
  Future<ApiResponse<Mutation$TopUpWallet>> topUpWallet({
    required PaymentMode paymentMode,
    required String paymentGatewayId,
    required String currency,
    required double amount,
  }) async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded(
      Mutation$TopUpWallet(
        topUpWallet: mockIntentResult1,
      ),
    );
  }
}
