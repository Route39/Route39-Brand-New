import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:flutter/cupertino.dart';

enum LoginPage {
  enterNumber,
  enterOtp,
  enterPassword,
  setPassword,
  contactDetails,
  vehicleDetails,
  documents,
  accessDenied,
  success,
}

extension LoginPageX on LoginPage {
  int? get loginStep => switch (this) {
    LoginPage.enterNumber => 3,
    _ => null,
  };

  int? get wizardStep => switch (this) {
    LoginPage.enterNumber => null,
    LoginPage.enterOtp || LoginPage.enterPassword || LoginPage.setPassword => 1,
    LoginPage.contactDetails => 2,
    LoginPage.vehicleDetails => 3,
    LoginPage.documents => 5,
    LoginPage.accessDenied => null,
    LoginPage.success => null,
  };

  String title(BuildContext context) => switch (this) {
    LoginPage.enterNumber => context.translate.signInSignUp,
    LoginPage.enterOtp => context.translate.enterOtp,
    LoginPage.enterPassword => context.translate.enterPassword,
    LoginPage.setPassword => context.translate.setPassword,
    LoginPage.contactDetails => context.translate.contactDetails,
    LoginPage.vehicleDetails => context.translate.vehicleDetails,
    LoginPage.documents => context.translate.documents,
    LoginPage.accessDenied => context.translate.accessDenied,
    LoginPage.success => context.translate.success,
  };
}
