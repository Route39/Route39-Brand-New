/// Stub implementation for non-web platforms.
/// On mobile (Android/iOS), Razorpay checkout is handled natively via the razorpay_flutter package.
void openRazorpayCheckout({
  required String keyId,
  required String orderId,
  required double amountInPaise,
  required String currency,
  required String name,
  required String description,
  required void Function(String paymentId, String orderId, String signature)
      onSuccess,
  required void Function(String reason) onError,
}) {
  // No-op stub — mobile platforms do not use JS interop.
  onError('Razorpay web checkout is not supported on this platform.');
}
