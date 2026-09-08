import 'package:api_response/api_response.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/config/env.dart';
import 'package:ridy/core/graphql/fragments/login.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:ridy/features/auth/domain/repositories/auth_repository.dart';

part 'login.event.dart';
part 'login.state.dart';
part 'login.bloc.freezed.dart';

@lazySingleton
class LoginBloc extends Cubit<LoginState> {
  AuthRepository repository;

  LoginBloc(this.repository) : super(LoginState.initial());

  Future<void> _completeLoginWithName({required String? jwtToken, required Fragment$Profile? profile}) async {
    emit(state.copyWith(jwtToken: jwtToken, profile: profile));
    emit(state.copyWith.loginPage.call(state: const PageState.loading()));

    final trimmedName = state.name.trim();
    String firstName = trimmedName;
    String lastName = '';

    final spaceIndex = trimmedName.indexOf(' ');
    if (spaceIndex != -1) {
      firstName = trimmedName.substring(0, spaceIndex);
      lastName = trimmedName.substring(spaceIndex + 1).trim();
    }

    final updateProfileResponse = await repository.updateProfile(
      firstName: firstName,
      lastName: lastName,
      email: null,
      gender: null,
    );

    switch (updateProfileResponse) {
      case ApiResponseLoaded(:final data):
        emit(state.copyWith(profile: data.updateProfile, loginPage: const LoginPage.success()));
      case ApiResponseError(:final message):
        emit(state.copyWith.loginPage.call(state: PageState.error(errorMessage: message)));

      case _:
    }
  }

  void onNumberVerificationRequested({
    required String mobileNumber,
    required String countryCode,
    required String name,
  }) async {
    emit(state.copyWith.loginPage.call(state: const PageState.loading()));
    final verifyNumberResponse = await repository.verifyNumber(mobileNumber: mobileNumber, countryCode: countryCode);

    switch (verifyNumberResponse) {
      case ApiResponseLoaded(:final data):
        emit(
          state.copyWith(
            loginPage: const LoginPage.enterOtp(),
            mobileNumber: (countryCode, mobileNumber),
            name: name,
            hash: data.verifyNumber.hash,
            devOtp: data.verifyNumber.devOtp,
            lastOtpSentAt: DateTime.now(),
          ),
        );
      case ApiResponseError(:final message):
        emit(state.copyWith.loginPage.call(state: PageState.error(errorMessage: message)));

      case _:
    }
  }

  void onVerificationSkipped() {
    emit(state.copyWith(loginPage: const LoginPage.success()));
  }

  void onOtpVerificationRequested(String otp) async {
    final verifyOtpResponse = await repository.verifyOtp(state.hash!, otp);

    switch (verifyOtpResponse) {
      case ApiResponseLoaded(:final data):
        await _completeLoginWithName(jwtToken: data.verifyOtp.jwtToken, profile: data.verifyOtp.user);
      case ApiResponseError(:final message):
        final newState = state.copyWith.loginPage.call(state: PageState.error(errorMessage: message));
        emit(newState);

      case _:
    }
  }

  void onCodeResendRequested() async {
    emit(state.copyWith.loginPage.call(state: const PageState.loading()));
    final resendOtpResponse = await repository.resendOtp(
      mobileNumber: state.mobileNumber.$2!,
      countryIso: state.mobileNumber.$1,
    );

    switch (resendOtpResponse) {
      case ApiResponseLoaded(:final data):
        emit(
          state.copyWith(
            loginPage: const LoginPage.enterOtp(),
            hash: data.verifyNumber.hash,
            devOtp: data.verifyNumber.devOtp,
            lastOtpSentAt: DateTime.now(),
          ),
        );
      case ApiResponseError(:final message):
        emit(state.copyWith.loginPage(state: PageState.error(errorMessage: message)));

      case _:
    }
  }

  void onBackButtonPressed() {
    emit(state.copyWith.call(loginPage: const LoginPage.enterNumber()));
  }

  void reset() {
    emit(LoginState.initial());
  }
}
