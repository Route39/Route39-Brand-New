import 'package:ridy_driver/features/auth/domain/entities/login_page.dart';
import 'package:ridy_driver/features/auth/presentation/blocs/login.bloc.dart';
import 'package:ridy_driver/features/auth/presentation/widgets/access_denied_form.dart';
import 'package:ridy_driver/features/auth/presentation/widgets/login_forms/contact_details.dart';
import 'package:ridy_driver/features/auth/presentation/widgets/login_forms/documents_form.dart';
import 'package:ridy_driver/features/auth/presentation/widgets/login_forms/vehicle_details.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:flutter/cupertino.dart';

import 'login_forms/enter_number_form.dart';
import 'login_forms/enter_otp_form.dart';
import 'login_forms/enter_password_form.dart';
import 'login_forms/set_password_form.dart';
import '../screens/city_selection_screen.dart';
import '../screens/vehicle_selection_screen.dart';
import '../screens/document_checklist_screen.dart';

class LoginFormBuilder {
  final LoginState loginState;

  LoginFormBuilder({required this.loginState});

  Widget get _onboardingExtraOrForm {
    if (loginState.selectedCity == null) {
      return CitySelectionScreen(
        embedded: true,
        onConfirm: (city) => locator<LoginBloc>().onCityConfirmed(city),
      );
    }
    if (loginState.selectedVehicleType == null) {
      return VehicleSelectionScreen(
        embedded: true,
        onConfirm: (vehicle) => locator<LoginBloc>().onVehicleConfirmed(vehicle),
      );
    }
    if (!loginState.documentsChecklistDone) {
      return DocumentChecklistScreen(
        embedded: true,
        onConfirm: () => locator<LoginBloc>().onDocumentsChecklistConfirmed(),
      );
    }
    return switch (loginState.loginPage) {
      LoginPage.contactDetails => ContactDetails(state: loginState),
      LoginPage.success => const SizedBox(),
      _ => const SizedBox(),
    };
  }

  Widget get footer => switch (loginState.loginPage) {
    LoginPage.enterNumber => EnterNumberForm(state: loginState),
    LoginPage.enterOtp => EnterOtpForm(state: loginState),
    LoginPage.enterPassword => const EnterPasswordForm(),
    LoginPage.setPassword => const SetPasswordForm(),
    LoginPage.contactDetails => _onboardingExtraOrForm,
    LoginPage.vehicleDetails => VehicleDetails(state: loginState),
    LoginPage.documents => DocumentsForm(state: loginState),
    LoginPage.accessDenied => const AccessDeniedForm(),
    LoginPage.success => _onboardingExtraOrForm,
  };
}
