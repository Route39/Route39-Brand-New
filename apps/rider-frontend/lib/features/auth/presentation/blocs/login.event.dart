part of 'login.bloc.dart';

@freezed
sealed class LoginEvent with _$LoginEvent {
  const factory LoginEvent.onNumberVerificationRequested({
    required String mobileNumber,
    required String countryCode,
    required String name,
  }) = LoginEvent$OnNumberVerificationRequested;
  const factory LoginEvent.onVerificationSkipped() =
      LoginEvent$OnSkipVerificationRequested;

  const factory LoginEvent.onBackButtonPressed() =
      LoginEvent$OnBackButtonPressed;

  const factory LoginEvent.onOtpVerificationRequested({
    required String otp,
  }) = LoginEvent$OnOtpVerificationRequested;
  const factory LoginEvent.onCodeResendRequested() =
      LoginEvent$OnCodeResendRequested;

  const factory LoginEvent.reset() = LoginEvent$Reset;
}
