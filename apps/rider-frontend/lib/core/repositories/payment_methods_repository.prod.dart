import 'package:api_response/api_response.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/graphql/fragments/payment_method.fragment.graphql.dart';
import 'package:rxdart/rxdart.dart';

import 'package:ridy/core/graphql/documents/wallet.graphql.dart';

import '../datasources/graphql_datasource.dart';

import 'payment_methods_repository.dart';

@prod
@LazySingleton(as: PaymentMethodsRepository)
class PaymentMethodsRepositoryImpl implements PaymentMethodsRepository {
  @override
  Stream<ApiResponse<List<Fragment$PaymentMethod>>> get paymentMethods => _paymentMethods.stream;

  final BehaviorSubject<ApiResponse<List<Fragment$PaymentMethod>>> _paymentMethods = BehaviorSubject.seeded(
    ApiResponse.initial(),
  );

  final GraphqlDatasource graphQLDatasource;

  PaymentMethodsRepositoryImpl(this.graphQLDatasource);

  @override
  Future<ApiResponse<String>> getExternalUrl({required String paymentGatewayId}) async {
    final result = await graphQLDatasource.mutate(
      Options$Mutation$GetSetupPaymentMethodLink(
        variables: Variables$Mutation$GetSetupPaymentMethodLink(gatewayId: paymentGatewayId),
      ),
    );

    return result.mapData((r) => r.setupPaymentMethod.url!);
  }

  @override
  Future<ApiResponse<List<Fragment$PaymentMethod>>> markAsDefault({required String paymentMethodId}) async {
    final paymentmethods = await graphQLDatasource.mutate(
      Options$Mutation$MarkAsDefault(variables: Variables$Mutation$MarkAsDefault(id: paymentMethodId)),
    );
    return paymentmethods.mapData((r) => r.markPaymentMethodAsDefault);
  }

  @override
  Future<void> refreshPaymentMethods() async {
    final paymentMethods = await graphQLDatasource.query(Options$Query$PaymentMethods());
    _paymentMethods.add(ApiResponse.loaded(paymentMethods.data!.paymentMethods));
  }

  @override
  Future<ApiResponse<void>> deletePaymentMethod({required String paymentMethodId}) async {
    final deleteResponse = await graphQLDatasource.mutate(
      Options$Mutation$DeleteSavedPaymentMethod(
        variables: Variables$Mutation$DeleteSavedPaymentMethod(id: paymentMethodId),
      ),
    );
    if (deleteResponse.data != null) {
      _paymentMethods.add(ApiResponse.loaded(
        _paymentMethods.value.data?.where((method) => method.nullableId != paymentMethodId).toList() ?? [],
      ));
    }
    return deleteResponse.mapData((r) => r.deleteSavedPaymentMethod);
  }
}
