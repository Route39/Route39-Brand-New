part of 'login.bloc.dart';

@freezed
sealed class LoginState with _$LoginState {
  const factory LoginState({
    @Default(LoginPage.enterNumber()) LoginPage loginPage,
    required (String, String?) mobileNumber,
    @Default('') String name,
    String? hash,
    String? devOtp,
    String? jwtToken,
    String? refreshToken,
    Fragment$Profile? profile,
    DateTime? lastOtpSentAt,
  }) = _LoginState;

  const LoginState._();

  // initial state
  factory LoginState.initial() => LoginState(mobileNumber: (Env.defaultCountry.iso2CountryCode, null));

  bool get canResendOtp {
    if (lastOtpSentAt == null) {
      return true;
    }

    final now = DateTime.now();
    final difference = now.difference(lastOtpSentAt!);
    return difference.inSeconds > 60;
  }

  int get resendOtpIn {
    if (lastOtpSentAt == null) {
      return 0;
    }

    final now = DateTime.now();
    final difference = now.difference(lastOtpSentAt!);
    return 60 - difference.inSeconds;
  }
}

@freezed
sealed class LoginPage with _$LoginPage {
  const factory LoginPage.enterNumber({@Default(PageState.idle()) PageState state}) = LoginPage$EnterNumber;

  const factory LoginPage.enterOtp({@Default(PageState.idle()) PageState state}) = LoginPage$EnterOtp;

  const factory LoginPage.success({@Default(PageState.idle()) PageState state}) = LoginPage$Success;
}

@freezed
sealed class PageState with _$PageState {
  const factory PageState.idle() = PageState$Idle;
  const factory PageState.loading() = PageState$Loading;
  const factory PageState.error({required String errorMessage}) = PageState$Error;

  const PageState._();

  bool get isLoading => switch (this) {
    PageState$Loading() => true,
    _ => false,
  };
}
