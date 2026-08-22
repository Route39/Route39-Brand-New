import 'package:api_response/api_response.dart';
import 'package:flutter_common/core/enums/payment_mode.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/graphql/documents/wallet.graphql.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:ridy/core/datasources/graphql_datasource.dart';
import 'package:ridy/core/enums/payment_mode.prod.dart';

import 'wallet_repository.dart';

@prod
@LazySingleton(as: WalletRepository)
class WalletRepositoryImpl implements WalletRepository {
  final GraphqlDatasource graphqlDatasource;

  WalletRepositoryImpl(this.graphqlDatasource);

  @override
  Future<ApiResponse<Mutation$TopUpWallet>> getTopUpWallet({
    required PaymentMode paymentMode,
    required String paymentGatewayId,
    required String? orderId,
    required String currency,
    required double amount,
    required bool canPreauth,
  }) async {
    final intentResponse = await graphqlDatasource.mutate(
      Options$Mutation$TopUpWallet(
        variables: Variables$Mutation$TopUpWallet(
          input: Input$TopUpWalletInput(
            gatewayId: paymentGatewayId,
            amount: amount,
            orderNumber: orderId,
            currency: currency,
            paymentMode: paymentMode.toGql,
          ),
          canPreauthorize: canPreauth,
        ),
      ),
    );
    return intentResponse;
  }
}
