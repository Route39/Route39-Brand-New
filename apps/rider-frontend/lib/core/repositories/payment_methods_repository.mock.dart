import 'package:api_response/api_response.dart';
import 'package:ridy/core/graphql/fragments/payment_method.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/payment_method.mock.dart';
import 'package:rxdart/rxdart.dart';

import 'payment_methods_repository.dart';
import 'package:injectable/injectable.dart';

@dev
@LazySingleton(as: PaymentMethodsRepository)
class PaymentMethodsRepositoryMock implements PaymentMethodsRepository {
  @override
  Stream<ApiResponse<List<Fragment$PaymentMethod>>> get paymentMethods => _paymentMethods.stream;

  final BehaviorSubject<ApiResponse<List<Fragment$PaymentMethod>>> _paymentMethods = BehaviorSubject.seeded(
    ApiResponse.initial(),
  );

  @override
  Future<ApiResponse<String>> getExternalUrl({required String paymentGatewayId}) async {
    return ApiResponse.loaded("https://www.paypal.com");
  }

  @override
  Future<ApiResponse<List<Fragment$PaymentMethod>>> markAsDefault({required String paymentMethodId}) async {
    return ApiResponse.loaded([]);
  }

  @override
  Future<void> refreshPaymentMethods() {
    _paymentMethods.add(ApiResponse.loaded([mockPaymentMethod]));
    return Future.value();
  }

  @override
  Future<ApiResponse<void>> deletePaymentMethod({required String paymentMethodId}) async {
    final savedPaymentMethods = _paymentMethods.value.data;
    if (savedPaymentMethods != null) {
      final updatedSavedPaymentMethods =
          savedPaymentMethods.where((method) => method.nullableId != paymentMethodId).toList();
      _paymentMethods.add(ApiResponse.loaded(updatedSavedPaymentMethods));
    }
    return ApiResponse.loaded(null);
  }
}
