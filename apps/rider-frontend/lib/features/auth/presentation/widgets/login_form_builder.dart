import 'package:flutter/cupertino.dart';
import 'package:ridy/features/auth/presentation/blocs/login.bloc.dart';
import 'package:ridy/features/auth/presentation/widgets/login_forms/enter_number_form.dart';
import 'package:ridy/features/auth/presentation/widgets/login_forms/enter_otp_form.dart';

class LoginFormBuilder {
  final LoginPage loginPage;

  LoginFormBuilder({
    required this.loginPage,
  });

  Widget get footer {
    return switch (loginPage) {
      LoginPage$EnterNumber() => const EnterNumberForm(),
      LoginPage$EnterOtp() => const EnterOtpForm(),
      LoginPage$Success() => const SizedBox()
    };
  }
}
