import 'package:razorpay_flutter/razorpay_flutter.dart';

/// Native Razorpay implementation for Android/iOS.
void openRazorpayCheckout({
  required String keyId,
  required String orderId,
  required double amountInPaise,
  required String name,
  required String description,
  required void Function(String paymentId, String orderId, String signature)
  onSuccess,
  required void Function(String reason) onError,
}) {
  final razorpay = Razorpay();

  razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (
    PaymentSuccessResponse response,
  ) {
    onSuccess(
      response.paymentId ?? '',
      response.orderId ?? orderId,
      response.signature ?? '',
    );
    razorpay.clear();
  });

  razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse response) {
    final message = response.message?.trim();
    final isCancelled = response.code == Razorpay.PAYMENT_CANCELLED ||
        message == null ||
        message.isEmpty ||
        message.toLowerCase() == 'undefined';
    onError(isCancelled ? 'Payment cancelled' : message!);
    razorpay.clear();
  });

  razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (
    ExternalWalletResponse response,
  ) {
    onError('External wallet: ${response.walletName ?? 'Unknown'}');
    razorpay.clear();
  });

  final options = <String, dynamic>{
    'key': keyId,
    'amount': amountInPaise.round(),
    'currency': 'INR',
    'name': name,
    'description': description,
    'order_id': orderId,
    'theme': {
      'color': '#B71C1C',
    },
    'method': {
      'netbanking': false,
      'card': false,
      'wallet': false,
      'emi': false,
      'paylater': false,
      'upi': true,
    },
  };

  razorpay.open(options);
}
