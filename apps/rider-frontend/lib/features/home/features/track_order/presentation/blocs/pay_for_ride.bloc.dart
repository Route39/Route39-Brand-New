import 'package:api_response/api_response.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/entities/payment_method_union.dart';
import 'package:flutter_common/core/enums/payment_mode.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/graphql/documents/track_order.graphql.dart';
import 'package:ridy/core/graphql/documents/wallet.graphql.dart';
import 'package:ridy/core/graphql/fragments/intent_result.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/payment_method.extensions.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:ridy/features/home/features/track_order/domain/repositories/track_order_repository.dart';
import 'package:ridy/core/repositories/wallet_repository.dart';

part 'pay_for_ride.state.dart';
part 'pay_for_ride.bloc.freezed.dart';

@lazySingleton
class PayForRideCubit extends Cubit<PayForRideState> {
  final TrackOrderRepository _repository;
  final WalletRepository _walletRepository;

  PayForRideCubit(this._repository, this._walletRepository)
      : super(PayForRideState());

  void load({
    required PaymentMethodUnion? selectedPaymentMethod,
    required bool cashEnabled,
    required bool walletCreditSufficient,
  }) async {
    emit(state.copyWith(savedPaymentMethodsState: ApiResponse.loading()));

    final paymentMethodsResponse = await _repository.getPaymentMethods();

    emit(
      state.copyWith(
        savedPaymentMethodsState: paymentMethodsResponse,
        selectedPaymentMethod: selectedPaymentMethod,
      ),
    );
  }

  void changePaymentMethod({
    required PaymentMethodUnion selectedPaymentMethod,
  }) {
    emit(
      state.copyWith(
        selectedPaymentMethod: selectedPaymentMethod,
      ),
    );
  }

  void payWithRazorpay({
    required String currency,
    required double amount,
    required String orderId,
  }) async {
    emit(
      state.copyWith(
        paymentStatus: ApiResponse.loading(),
      ),
    );

    final razorpayResponse = await _repository.createRazorpayRideOrder(
      orderId: orderId,
    );

    final razorpayOrder = razorpayResponse.mapData(
      (data) => data.createRazorpayRideOrder,
    );

    emit(
      state.copyWith(
        razorpayOrderState: razorpayOrder,
      ),
    );
  }

  void pay({
    required String currency,
    required double amount,
    required String orderId,
    required bool canPreauth,
  }) async {
    // ignore: avoid_print
    print('[PAY-DEBUG] pay() called: orderId=' + orderId + ', amount=' + amount.toString() + ', currency=' + currency);
    final paymentMode = state.selectedPaymentMethod?.paymentMode;
    // ignore: avoid_print
    print('[PAY-DEBUG] paymentMode=' + paymentMode.toString());

    if (paymentMode == PaymentMode.cash || paymentMode == PaymentMode.wallet) {
      emit(
        state.copyWith(
          paymentStatus: ApiResponse.loaded(
            Fragment$IntentResult(
              status: Enum$TopUpWalletStatus.OK,
            ),
          ),
        ),
      );
      return;
    }

    emit(
      state.copyWith(
        paymentStatus: ApiResponse.loading(),
      ),
    );

    // ignore: avoid_print
    print('[PAY-DEBUG] calling createRazorpayRideOrder...');
    final razorpayResponse = await _repository.createRazorpayRideOrder(
      orderId: orderId,
    );
    // ignore: avoid_print
    print('[PAY-DEBUG] razorpayResponse.data=' + razorpayResponse.data.toString());

    final razorpayOrder = razorpayResponse.mapData(
      (data) => data.createRazorpayRideOrder,
    );

    emit(
      state.copyWith(
        razorpayOrderState: razorpayOrder,
      ),
    );
  }

  Future<void> verifyRazorpayPayment({
    required String orderId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    emit(
      state.copyWith(
        paymentStatus: ApiResponse.loading(),
      ),
    );

    final response = await _repository.verifyRazorpayRidePayment(
      orderId: orderId,
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
      razorpaySignature: razorpaySignature,
    );

    emit(
      state.copyWith(
        paymentStatus: response.mapData(
          (data) => Fragment$IntentResult(
            status: data.verifyRazorpayRidePayment
                ? Enum$TopUpWalletStatus.OK
                : Enum$TopUpWalletStatus.Failed,
          ),
        ),
      ),
    );
  }
}
