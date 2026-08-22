import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/documents/wallet.graphql.dart';

abstract class PaymentMethodsRepository {
  Future<ApiResponse<Query$PaymentMethods>> getPaymentMethods();

  Future<ApiResponse<Mutation$SetupPaymentMethodLink>> getExternalUrl({
    required String paymentGatewayId,
  });
}
