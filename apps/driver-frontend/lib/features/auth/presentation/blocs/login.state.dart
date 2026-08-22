part of 'login.bloc.dart';

@freezed
sealed class LoginState with _$LoginState {
  const factory LoginState({
    @Default(LoginPage.enterNumber) LoginPage loginPage,
    String? verificationHash,
    DateTime? lastOtpSentAt,
    String? jwtToken,
    Fragment$Profile? profile,
    String? currentPassword,
    String? newPassword,
    CountryCode? countryCode,
    String? mobileNumber,
    String? otp,
    @Default([]) List<Fragment$VehicleModel> vehicleModels,
    @Default([]) List<Fragment$VehicleColor> vehicleColors,
    String? firstName,
    String? lastName,
    Enum$Gender? gender,
    String? address,
    String? vehiclePlateNumber,
    String? email,
    String? vehicleModelId,
    String? vehicleColorId,
    @Default(2025) int vehicleYear,
    String? certificateNumber,
    Fragment$Media? profilePicture,
    @Default([]) List<Fragment$Media> documents,
    @Default(ApiResponseInitial()) ApiResponse<dynamic> enterNumberResponse,
    @Default(ApiResponseInitial()) ApiResponse<dynamic> enterOtpResponse,
    @Default(ApiResponseInitial()) ApiResponse<dynamic> enterPasswordResponse,
    @Default(ApiResponseInitial()) ApiResponse<dynamic> setPasswordResponse,
    @Default(ApiResponseInitial()) ApiResponse<dynamic> completeRegistrationResponse,
  }) = _LoginState;

  const LoginState._();

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

  factory LoginState.fromJson(Map<String, dynamic> json) => _$LoginStateFromJson(json);

  bool get codeLengthIsSafe => newPassword != null && newPassword!.length >= 9 && newPassword!.length <= 64;

  bool get hasUppercase => newPassword != null && newPassword!.contains(RegExp(r'[A-Z]'));

  bool get hasDigits => newPassword != null && newPassword!.contains(RegExp(r'[0-9]'));

  bool get hasLowercase => newPassword != null && newPassword!.contains(RegExp(r'[a-z]'));

  double get desktopHeight => switch (loginPage) {
    LoginPage.enterNumber => 200,
    LoginPage.enterOtp => 300,
    LoginPage.enterPassword => 400,
    LoginPage.setPassword => 400,
    LoginPage.contactDetails => 700,
    LoginPage.vehicleDetails => double.infinity,
    LoginPage.documents => double.infinity,
    LoginPage.accessDenied => 100,
    LoginPage.success => 100,
  };

  Input$CompleteRegistrationInput get toProfileInput => Input$CompleteRegistrationInput(
    firstName: firstName!,
    lastName: lastName!,
    gender: gender!,
    carPlate: vehiclePlateNumber,
    carProductionYear: vehicleYear,
    certificateNumber: certificateNumber,
    address: address,
    profilePictureId: profilePicture!.id,
    carId: vehicleModelId!,
    carColorId: vehicleColorId!,
    legacyDocumentIds: documents.map((e) => e.id).toList(),
    documentPairs: [],
  );

  bool get hasSpecialCharacters => newPassword != null && newPassword!.contains(RegExp(r'[!@#$%^&*,.?":{}|<>]'));

  bool get hasAtLeastTwoChecks =>
      [hasUppercase, hasDigits, hasLowercase, hasSpecialCharacters].where((element) => element).length >= 2;
}
