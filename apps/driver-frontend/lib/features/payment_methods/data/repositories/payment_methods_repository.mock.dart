import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/documents/wallet.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/payment_method.mock.dart';
import '../../domain/repositories/payment_methods_repository.dart';
import 'package:injectable/injectable.dart';

@dev
@LazySingleton(as: PaymentMethodsRepository)
class PaymentMethodsRepositoryMock implements PaymentMethodsRepository {
  @override
  Future<ApiResponse<Query$PaymentMethods>> getPaymentMethods() async {
    await Future.delayed(Duration(seconds: 1));
    return ApiResponse.loaded(
      Query$PaymentMethods(paymentMethods: [mockPaymentMethod]),
    );
  }

  @override
  Future<ApiResponse<Mutation$SetupPaymentMethodLink>> getExternalUrl({
    required String paymentGatewayId,
  }) async {
    await Future.delayed(Duration(seconds: 1));

    return ApiResponse.loaded(
      Mutation$SetupPaymentMethodLink(
        setupPaymentMethod: Mutation$SetupPaymentMethodLink$setupPaymentMethod(
          url: 'https://www.paypal.com',
        ),
      ),
    );
  }
}
