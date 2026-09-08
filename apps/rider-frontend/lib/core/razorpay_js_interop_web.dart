// ignore_for_file: avoid_web_libraries_in_flutter
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

@JS('Razorpay')
extension type _RazorpayJS._(JSObject _) implements JSObject {
  external factory _RazorpayJS(JSObject options);
  external void open();
}

@JS()
@staticInterop
class _RazorpayOptionsBuilder {}

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
  final options = JSObject();
  options.setProperty('key'.toJS, keyId.toJS);
  options.setProperty('amount'.toJS, amountInPaise.toJS);
  options.setProperty('currency'.toJS, currency.toJS);
  options.setProperty('name'.toJS, name.toJS);
  options.setProperty('description'.toJS, description.toJS);
  options.setProperty('order_id'.toJS, orderId.toJS);

  final handler = ((JSObject response) {
    final paymentId = (response.getProperty('razorpay_payment_id'.toJS) as JSString).toDart;
    final respOrderId = (response.getProperty('razorpay_order_id'.toJS) as JSString).toDart;
    final signature = (response.getProperty('razorpay_signature'.toJS) as JSString).toDart;
    onSuccess(paymentId, respOrderId, signature);
  }).toJS;
  options.setProperty('handler'.toJS, handler);

  final modal = JSObject();
  final dismissHandler = (() {
    onError('Payment cancelled');
  }).toJS;
  modal.setProperty('ondismiss'.toJS, dismissHandler);
  options.setProperty('modal'.toJS, modal);

  final rzp = _RazorpayJS(options);
  rzp.open();
}
