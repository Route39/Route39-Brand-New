import 'package:api_response/api_response.dart';
import 'package:graphql/client.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/graphql/documents/wallet.graphql.dart';
import 'package:ridy/core/graphql/fragments/payment_method.mock.dart';
import 'package:ridy/core/graphql/fragments/rider_transaction.mock.dart';
import 'package:ridy/core/graphql/fragments/wallet.fragment.graphql.dart';
import '../../domain/repositories/wallet_repository.dart';

@dev
@LazySingleton(as: WalletRepository)
class WalletRepositoryMock implements WalletRepository {
  @override
  Future<ApiResponse<Query$Wallet>> getWalletData({
    FetchPolicy? fetchPolicy,
  }) async {
    return ApiResponse.loaded(
      Query$Wallet(
        paymentMethods: [mockPaymentMethod],
        riderTransactions: [
          mockRiderTransaction1,
          mockRiderTransaction2,
        ],
        riderWallets: [
          Fragment$Wallet(
            currency: 'USD',
            balance: 300,
          ),
        ],
      ),
    );
  }
}
