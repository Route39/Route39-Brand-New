import 'package:api_response/api_response.dart';
import 'package:flutter_common/core/enums/payment_mode.dart';
import 'package:ridy/core/graphql/documents/wallet.graphql.dart';

abstract class WalletRepository {
  Future<ApiResponse<Mutation$TopUpWallet>> getTopUpWallet({
    required PaymentMode paymentMode,
    required String paymentGatewayId,
    required String? orderId,
    required String currency,
    required double amount,
    required bool canPreauth,
  });
}
