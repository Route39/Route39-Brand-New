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
    if (state.loginPage == LoginPage.success) {
      emit(
        state.copyWith(
          loginPage: LoginPage.contactDetails,
          documentsChecklistDone: false,
        ),
      );
      return;
    }

    if (state.loginPage == LoginPage.contactDetails) {
      if (state.showAadhaarPan) {
        emit(state.copyWith(showAadhaarPan: false));
        return;
      }
      if (state.showVehicleRC) {
        emit(state.copyWith(showVehicleRC: false));
        return;
      }
      if (state.showProfileInfo) {
        emit(state.copyWith(showProfileInfo: false));
        return;
      }
      if (state.showLicenseUpload) {
        emit(state.copyWith(showLicenseUpload: false));
        return;
      }
      if (state.documentsChecklistDone) {
        emit(state.copyWith(documentsChecklistDone: false));
        return;
      }
      if (state.selectedVehicleType != null) {
        emit(state.copyWith(selectedVehicleType: null));
        return;
      }
      if (state.selectedCity != null) {
        emit(state.copyWith(selectedCity: null));
        return;
      }
      emit(state.copyWith(loginPage: LoginPage.enterOtp));
      return;
    }
    emit(
      state.copyWith(
        loginPage: switch (state.loginPage) {
          LoginPage.enterOtp => LoginPage.enterNumber,
          LoginPage.enterPassword => LoginPage.enterNumber,
          LoginPage.setPassword => LoginPage.enterNumber,
          LoginPage.vehicleDetails => LoginPage.contactDetails,
          LoginPage.documents => LoginPage.contactDetails,
          _ => state.loginPage,
        },
      ),
    );
  }

  void onCityConfirmed(String city) => emit(state.copyWith(selectedCity: city));

  void onVehicleConfirmed(String vehicleType) =>
      emit(state.copyWith(selectedVehicleType: vehicleType));

  void onDocumentsChecklistConfirmed() =>
      emit(state.copyWith(documentsChecklistDone: true));

  void onDrivingLicenseAnswer(bool answer) => emit(
    state.copyWith(hasDrivingLicense: answer, showLicenseUpload: answer),
  );

  void onOpenLicenseUpload() => emit(state.copyWith(showLicenseUpload: true));

  void onCloseLicenseUpload() => emit(state.copyWith(showLicenseUpload: false));

  void onLicenseSubmitted() =>
      emit(state.copyWith(licenseSubmitted: true, showLicenseUpload: false));

  void onOpenProfileInfo() => emit(state.copyWith(showProfileInfo: true));

  void onCloseProfileInfo() => emit(state.copyWith(showProfileInfo: false));

  void onProfileInfoSubmitted({
    required String firstName,
    required String lastName,
    required String dob,
    required String gender,
  }) => emit(
    state.copyWith(
      profileFirstName: firstName,
      profileLastName: lastName,
      profileDob: dob,
      profileGender: gender,
      profileInfoSubmitted: true,
      showProfileInfo: false,
    ),
  );

  void onDraftCityChanged(String? city) =>
      emit(state.copyWith(draftCity: city));

  void onDraftVehicleChanged(String? vehicle) =>
      emit(state.copyWith(draftVehicleType: vehicle));

  void onDraftLicenseNumberChanged(String number) =>
      emit(state.copyWith(draftLicenseNumber: number));

  void onDraftProfileChanged({
    String? firstName,
    String? lastName,
    String? dob,
    String? gender,
  }) => emit(
    state.copyWith(
      draftProfileFirstName: firstName ?? state.draftProfileFirstName,
      draftProfileLastName: lastName ?? state.draftProfileLastName,
      draftProfileDob: dob ?? state.draftProfileDob,
      draftProfileGender: gender ?? state.draftProfileGender,
    ),
  );

  void onOpenVehicleRC() => emit(state.copyWith(showVehicleRC: true));

  void onCloseVehicleRC() => emit(state.copyWith(showVehicleRC: false));

  void onVehicleRCSubmitted({
    required String ownership,
    required String? vehicleNumber,
  }) => emit(
    state.copyWith(
      vehicleOwnership: ownership,
      vehicleNumberValue: vehicleNumber,
      vehicleRCSubmitted: true,
      showVehicleRC: false,
    ),
  );

  void onDraftVehicleOwnershipChanged(String? ownership) =>
      emit(state.copyWith(draftVehicleOwnership: ownership));

  void onDraftVehicleNumberChanged(String number) =>
      emit(state.copyWith(draftVehicleNumber: number));

  void onOpenAadhaarPan() => emit(state.copyWith(showAadhaarPan: true));

  void onCloseAadhaarPan() => emit(state.copyWith(showAadhaarPan: false));

  void onAadhaarPanSubmitted({
    required String aadhaarNumber,
    required String panNumber,
  }) => emit(
    state.copyWith(
      aadhaarNumberValue: aadhaarNumber,
      panNumberValue: panNumber,
      aadhaarPanSubmitted: true,
      showAadhaarPan: false,
    ),
  );

  void onDraftAadhaarNumberChanged(String number) =>
      emit(state.copyWith(draftAadhaarNumber: number));

  void onDraftPanNumberChanged(String number) =>
      emit(state.copyWith(draftPanNumber: number));

  void reset() => emit(LoginState());

  void onNumberChanged(CountryCode countryCode, String number) =>
      emit(state.copyWith(countryCode: countryCode, mobileNumber: number));

  void onOtpChanged(String newOtp) {
    emit(state.copyWith(otp: newOtp));
  }

  void onCurrentPasswordChanged(String password) =>
      emit(state.copyWith(currentPassword: password));

  void onNewPasswordChanged(String password) =>
      emit(state.copyWith(newPassword: password));

  void onNewPasswordSubmitted() async {
    emit(state.copyWith(enterPasswordResponse: ApiResponse.loading()));
    final setPasswordResponse = await repository.setPassword(
      state.newPassword!,
    );
    if (setPasswordResponse.isLoaded) {
      _processVerifiedUser(setPasswordResponse.data!.setPassword);
    } else {
      emit(state.copyWith(enterPasswordResponse: setPasswordResponse));
    }
    emit(state.copyWith(enterPasswordResponse: ApiResponse.initial()));
  }

  void sendOtp() async {
    emit(state.copyWith(enterNumberResponse: ApiResponse.loading()));
    final resendOtpResponse = await repository.resendOtp(
      state.countryCode!.e164CountryCode + state.mobileNumber!,
    );
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
      if (false) {
        // forced to always go to OTP
        emit(
          state.copyWith(
            loginPage: LoginPage.enterPassword,
            verificationHash: null,
          ),
        );
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
    final verifyOtpResponse = await repository.verifyOtp(
      state.verificationHash!,
      state.otp!,
    );
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
        emit(
          state.copyWith(
            loginPage: LoginPage.success,
            jwtToken: response.jwtToken,
            profile: response.user,
          ),
        );
        break;
      case Enum$DriverStatus.$unknown:
    }
  }

  // START: Contact Details

  void onGenderChanged(Gender? gender) =>
      emit(state.copyWith(gender: gender!.toGql));

  void onFirstNameChanged(String? firstName) =>
      emit(state.copyWith(firstName: firstName));

  void onLastNameChanged(String? lastName) =>
      emit(state.copyWith(lastName: lastName));

  void onAddressChanged(String? address) =>
      emit(state.copyWith(address: address));

  void onEmailChanged(String? email) => emit(state.copyWith(email: email));

  void onCertificateNumberChanged(String? certificateNumber) =>
      emit(state.copyWith(certificateNumber: certificateNumber?.trim()));

  void onConfirmContactDetailsPressed() =>
      emit(state.copyWith(loginPage: LoginPage.documents));

  // END: Contact Details

  // START: Vehicle Details

  void onPlateNumberChanged(String? newValue) =>
      emit(state.copyWith(vehiclePlateNumber: newValue?.trim()));

  void onVehicleModelIdChanged(String? newValue) =>
      emit(state.copyWith(vehicleModelId: newValue));

  void onVehicleColorIdChanged(String? newValue) =>
      emit(state.copyWith(vehicleColorId: newValue));

  void onVehicleProductionYearChanged(int? newValue) =>
      emit(state.copyWith(vehicleYear: newValue ?? 0));

  void onConfirmVehicleDetailsPressed() =>
      emit(state.copyWith(loginPage: LoginPage.documents));

  // END: Vehicle Details

  // START: Upload Documents

  void onProfilePhotoChanged(Fragment$Media? newValue) =>
      emit(state.copyWith(profilePicture: newValue));

  void setDocuments(List<Fragment$Media> newValue) {
    emit(state.copyWith(documents: newValue));
  }

  void onConfirmDocumentsPressed() async {
    print('=== DOCUMENT CONFIRM DEBUG ===');
    print('firstName: ${state.firstName}');
    print('profilePicture: ${state.profilePicture}');
    print('profilePictureId: ${state.profilePicture?.id}');
    print('documents count: ${state.documents.length}');
    print('document IDs: ${state.documents.map((e) => e.id).toList()}');

    emit(state.copyWith(completeRegistrationResponse: ApiResponse.loading()));
    final registerResponse = await repository.register(
      input: state.toProfileInput,
    );
    if (registerResponse.isLoaded) {
      emit(
        state.copyWith(
          loginPage: LoginPage.success,
          profile: registerResponse.data!.completeRegistration,
        ),
      );
    } else {
      emit(state.copyWith(completeRegistrationResponse: registerResponse));
    }
  }

  @override
  LoginState? fromJson(Map<String, dynamic> json) => LoginState.fromJson(json);

  @override
  Map<String, dynamic>? toJson(LoginState state) => state.toJson();
}
