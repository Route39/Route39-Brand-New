import 'package:api_response/api_response.dart';

import 'package:better_localization/country_code/country_code.dart';
import 'package:ridy_driver/core/enums/gender.prod.dart';
import 'package:ridy_driver/core/graphql/fragments/login.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/media.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/vehicle_color.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/vehicle_model.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:ridy_driver/features/auth/domain/entities/login_page.dart';
import 'package:flutter_common/core/enums/gender.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../domain/repositories/auth_repository.dart';

part 'login.state.dart';
part 'login.bloc.freezed.dart';
part 'login.bloc.g.dart';

@LazySingleton()
class LoginBloc extends HydratedCubit<LoginState> {
  AuthRepository repository;

  LoginBloc(this.repository) : super(LoginState());

  void onBackPressed() {
    emit(
      state.copyWith(
        loginPage: switch (state.loginPage) {
          LoginPage.enterOtp => LoginPage.enterNumber,
          LoginPage.enterPassword => LoginPage.enterNumber,
          LoginPage.setPassword => LoginPage.enterNumber,
          LoginPage.contactDetails => LoginPage.enterPassword,
          LoginPage.vehicleDetails => LoginPage.contactDetails,
          LoginPage.documents => LoginPage.vehicleDetails,
          _ => state.loginPage,
        },
      ),
    );
  }

  void reset() => emit(LoginState());

  void onNumberChanged(CountryCode countryCode, String number) =>
      emit(state.copyWith(countryCode: countryCode, mobileNumber: number));

  void onOtpChanged(String newOtp) {
    emit(state.copyWith(otp: newOtp));
  }

  void onCurrentPasswordChanged(String password) => emit(state.copyWith(currentPassword: password));

  void onNewPasswordChanged(String password) => emit(state.copyWith(newPassword: password));

  void onNewPasswordSubmitted() async {
    emit(state.copyWith(enterPasswordResponse: ApiResponse.loading()));
    final setPasswordResponse = await repository.setPassword(state.newPassword!);
    if (setPasswordResponse.isLoaded) {
      _processVerifiedUser(setPasswordResponse.data!.setPassword);
    } else {
      emit(state.copyWith(enterPasswordResponse: setPasswordResponse));
    }
    emit(state.copyWith(enterPasswordResponse: ApiResponse.initial()));
  }

  void sendOtp() async {
    emit(state.copyWith(enterNumberResponse: ApiResponse.loading()));
    final resendOtpResponse = await repository.resendOtp(state.countryCode!.e164CountryCode + state.mobileNumber!);
    if (resendOtpResponse.isLoaded) {
      emit(
        state.copyWith(
          enterNumberResponse: ApiResponse.initial(),
          loginPage: LoginPage.enterOtp,
          verificationHash: resendOtpResponse.data!.verifyNumber.hash,
          lastOtpSentAt: DateTime.now(),
        ),
      );
    } else {
      emit(state.copyWith(enterNumberResponse: resendOtpResponse));
      emit(state.copyWith(enterNumberResponse: ApiResponse.initial()));
    }
  }

  void onNumberSubmitted() async {
    emit(state.copyWith(enterNumberResponse: ApiResponse.loading()));
    final verifyNumberResponse = await repository.verifyNumber(
      mobileNumber: state.countryCode!.e164CountryCode + state.mobileNumber!,
      countryIsoCode: state.countryCode!.iso2CountryCode,
    );
    if (verifyNumberResponse.isLoaded) {
      if (verifyNumberResponse.data!.verifyNumber.isExistingUser) {
        emit(state.copyWith(loginPage: LoginPage.enterPassword, verificationHash: null));
      } else {
        emit(
          state.copyWith(
            enterNumberResponse: ApiResponse.initial(),
            loginPage: LoginPage.enterOtp,
            verificationHash: verifyNumberResponse.data!.verifyNumber.hash,
            lastOtpSentAt: DateTime.now(),
          ),
        );
      }
    } else {
      emit(state.copyWith(enterNumberResponse: verifyNumberResponse));
      emit(state.copyWith(enterNumberResponse: ApiResponse.initial()));
    }
  }

  void onConfirmOtpPressed() async {
    emit(state.copyWith(enterOtpResponse: ApiResponse.loading()));
    final verifyOtpResponse = await repository.verifyOtp(state.verificationHash!, state.otp!);
    if (verifyOtpResponse.isLoaded) {
      _processVerifiedUser(verifyOtpResponse.data!.verifyOtp);
    } else {
      emit(state.copyWith(enterOtpResponse: verifyOtpResponse));
    }
    emit(state.copyWith(enterOtpResponse: ApiResponse.initial()));
  }

  void onConfirmPasswordPressed() async {
    emit(state.copyWith(enterPasswordResponse: ApiResponse.loading()));

    final verifyPasswordResponse = await repository.verifyPassword(
      state.countryCode!.e164CountryCode + state.mobileNumber!,
      state.currentPassword!,
    );
    if (verifyPasswordResponse.isLoaded) {
      _processVerifiedUser(verifyPasswordResponse.data!.verifyPassword);
    } else {
      emit(state.copyWith(enterPasswordResponse: verifyPasswordResponse));
    }
    emit(state.copyWith(enterPasswordResponse: ApiResponse.initial()));
  }

  void _processVerifiedUser(Fragment$VerifyOtpOrPassword response) async {
    final profile = response.user;
    emit(state.copyWith(jwtToken: response.jwtToken, profile: response.user));
    if (response.hasPassword == false) {
      emit(state.copyWith(loginPage: LoginPage.setPassword));
      return;
    }
    switch (profile.status) {
      case Enum$DriverStatus.Blocked:
      case Enum$DriverStatus.HardReject:
        emit(state.copyWith(loginPage: LoginPage.accessDenied));
        return;
      case Enum$DriverStatus.PendingApproval:
      case Enum$DriverStatus.SoftReject:
      case Enum$DriverStatus.WaitingDocuments:
        final remoteDataResponse = await repository.getRegistrationData();
        if (remoteDataResponse.isLoaded) {
          final data = remoteDataResponse.data!;
          emit(
            state.copyWith(
              loginPage: LoginPage.contactDetails,
              vehicleModels: data.carModels,
              vehicleColors: data.carColors,
              jwtToken: response.jwtToken,
              profile: response.user,
            ),
          );
          return;
        }
        break;

      case Enum$DriverStatus.Online:
      case Enum$DriverStatus.Offline:
      case Enum$DriverStatus.InService:
        emit(state.copyWith(loginPage: LoginPage.success, jwtToken: response.jwtToken, profile: response.user));
        break;
      case Enum$DriverStatus.$unknown:
    }
  }

  // START: Contact Details

  void onGenderChanged(Gender? gender) => emit(state.copyWith(gender: gender!.toGql));

  void onFirstNameChanged(String? firstName) => emit(state.copyWith(firstName: firstName));

  void onLastNameChanged(String? lastName) => emit(state.copyWith(lastName: lastName));

  void onAddressChanged(String? address) => emit(state.copyWith(address: address));

  void onEmailChanged(String? email) => emit(state.copyWith(email: email));

  void onCertificateNumberChanged(String? certificateNumber) =>
      emit(state.copyWith(certificateNumber: certificateNumber?.trim()));

  void onConfirmContactDetailsPressed() => emit(state.copyWith(loginPage: LoginPage.vehicleDetails));

  // END: Contact Details

  // START: Vehicle Details

  void onPlateNumberChanged(String? newValue) => emit(state.copyWith(vehiclePlateNumber: newValue?.trim()));

  void onVehicleModelIdChanged(String? newValue) => emit(state.copyWith(vehicleModelId: newValue));

  void onVehicleColorIdChanged(String? newValue) => emit(state.copyWith(vehicleColorId: newValue));

  void onVehicleProductionYearChanged(int? newValue) => emit(state.copyWith(vehicleYear: newValue ?? 0));

  void onConfirmVehicleDetailsPressed() => emit(state.copyWith(loginPage: LoginPage.documents));

  // END: Vehicle Details

  // START: Upload Documents

  void onProfilePhotoChanged(Fragment$Media? newValue) => emit(state.copyWith(profilePicture: newValue));

  void setDocuments(List<Fragment$Media> newValue) {
    emit(state.copyWith(documents: newValue));
  }

  void onConfirmDocumentsPressed() async {
    emit(state.copyWith(completeRegistrationResponse: ApiResponse.loading()));
    final registerResponse = await repository.register(input: state.toProfileInput);
    if (registerResponse.isLoaded) {
      emit(state.copyWith(loginPage: LoginPage.success, profile: registerResponse.data!.completeRegistration));
    } else {
      emit(state.copyWith(completeRegistrationResponse: registerResponse));
    }
  }

  @override
  LoginState? fromJson(Map<String, dynamic> json) => LoginState.fromJson(json);

  @override
  Map<String, dynamic>? toJson(LoginState state) => state.toJson();
}
