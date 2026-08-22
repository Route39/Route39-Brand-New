import 'package:api_response/api_response.dart';
import 'package:collection/collection.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/graphql/fragments/payment_method.fragment.graphql.dart';
import 'package:ridy/core/repositories/payment_methods_repository.dart';

part 'payment_methods.state.dart';
part 'payment_methods.bloc.freezed.dart';
part 'payment_methods.event.dart';

@lazySingleton
class PaymentMethodsBloc extends Bloc<PaymentMethodsEvent, PaymentMethodsState> {
  final PaymentMethodsRepository _repository = locator<PaymentMethodsRepository>();

  PaymentMethodsBloc() : super(PaymentMethodsState()) {
    on<PaymentMethodsEvent>((event, emit) async {
      switch (event) {
        case PaymentMethodsEvent$Load():
          emit(state.copyWith(paymentMethods: ApiResponse.loading()));
          _repository.refreshPaymentMethods();
          await emit.forEach(
            _repository.paymentMethods,
            onData: (paymentMethods) => state.copyWith(paymentMethods: paymentMethods),
          );
          break;
        case PaymentMethodsEvent$MarkAsDefault(:final paymentMethodId):
          _repository.markAsDefault(paymentMethodId: paymentMethodId);
          break;
        case PaymentMethodsEvent$DeletePaymentMethod():
          _repository.deletePaymentMethod(paymentMethodId: event.paymentMethodId);
          break;
      }
    });
  }

  void load() async => add(PaymentMethodsEvent.load());

  void markAsDefault({required String paymentMethodId}) =>
      add(PaymentMethodsEvent.markAsDefault(paymentMethodId: paymentMethodId));

  void deletePaymentMethod({required String paymentMethodId}) =>
      add(PaymentMethodsEvent.deletePaymentMethod(paymentMethodId: paymentMethodId));
}
