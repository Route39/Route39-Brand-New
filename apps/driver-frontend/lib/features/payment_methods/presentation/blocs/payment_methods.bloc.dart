import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/documents/wallet.graphql.dart';
import 'package:ridy_driver/features/payment_methods/domain/repositories/payment_methods_repository.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:injectable/injectable.dart';
part 'payment_methods.state.dart';
part 'payment_methods.bloc.freezed.dart';

@lazySingleton
class PaymentMethodsBloc extends Cubit<PaymentMethodsState> {
  final PaymentMethodsRepository _repository;

  PaymentMethodsBloc(this._repository) : super(const PaymentMethodsState());

  void fetchPaymentMethods() async {
    emit(state.copyWith(savedPaymentMethodsState: ApiResponse.loading()));

    final savedPaymentMethodsResponse = await _repository.getPaymentMethods();

    emit(state.copyWith(savedPaymentMethodsState: savedPaymentMethodsResponse));
  }
}
