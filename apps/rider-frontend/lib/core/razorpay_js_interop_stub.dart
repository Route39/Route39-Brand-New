void openRazorpayCheckout({
  required String keyId,
  required String orderId,
  required double amountInPaise,
  required String currency,
  required String name,
  required String description,
  required void Function(String paymentId, String orderId, String signature) onSuccess,
  required void Function(String reason) onError,
}) {
  onError('Razorpay checkout is only supported on web');
}
