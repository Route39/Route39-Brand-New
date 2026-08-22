import 'package:api_response/api_response.dart';
import 'package:ridy/core/graphql/fragments/payment_method.fragment.graphql.dart';

abstract class PaymentMethodsRepository {
  Stream<ApiResponse<List<Fragment$PaymentMethod>>> get paymentMethods;

  Future<void> refreshPaymentMethods();

  Future<ApiResponse<List<Fragment$PaymentMethod>>> markAsDefault({required String paymentMethodId});

  Future<ApiResponse<void>> deletePaymentMethod({required String paymentMethodId});

  Future<ApiResponse<String>> getExternalUrl({required String paymentGatewayId});
}
