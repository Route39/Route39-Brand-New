part of 'payment_methods.bloc.dart';

@freezed
sealed class PaymentMethodsState with _$PaymentMethodsState {
  const factory PaymentMethodsState({
    @Default(ApiResponseInitial()) ApiResponse<List<Fragment$PaymentMethod>> paymentMethods,
    Fragment$PaymentMethod? selectedSavedPaymentMethod,
  }) = _PaymentMethodsState;

  const PaymentMethodsState._();

  Fragment$PaymentMethod? get currentSavedPaymentMethod =>
      selectedSavedPaymentMethod ?? paymentMethods.data?.firstOrNull;
}
