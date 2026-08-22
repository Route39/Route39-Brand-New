import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/documents/login.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/login.mock.dart';
import 'package:ridy_driver/core/graphql/fragments/profile.mock.dart';
import 'package:ridy_driver/core/graphql/fragments/vehicle_color.mock.dart';
import 'package:ridy_driver/core/graphql/fragments/vehicle_model.mock.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:injectable/injectable.dart';

import '../../domain/repositories/auth_repository.dart';

@dev
@LazySingleton(as: AuthRepository)
class AuthRepositoryMock implements AuthRepository {
  @override
  Future<ApiResponse<Mutation$ResendOtp>> resendOtp(String mobileNumber) async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded(
      Mutation$ResendOtp(
        verifyNumber: mockVerifyNumberSuccess,
      ),
    );
  }

  @override
  Future<ApiResponse<Mutation$UpdatePassword>> setPassword(String password) async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded(
      Mutation$UpdatePassword(setPassword: mockVerifyOtpOrPasswordSuccess),
    );
  }

  @override
  Future<ApiResponse<Mutation$VerifyNumber>> verifyNumber({
    required String mobileNumber,
    required String countryIsoCode,
  }) async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded(
      Mutation$VerifyNumber(
        verifyNumber: mockVerifyNumberSuccess,
      ),
    );
  }

  @override
  Future<ApiResponse<Mutation$VerifyOtp>> verifyOtp(String hash, String otp) async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded(
      Mutation$VerifyOtp(
        verifyOtp: mockVerifyOtpOrPasswordSuccess,
      ),
    );
  }

  @override
  Future<ApiResponse<Mutation$VerifyPassword>> verifyPassword(String mobileNumber, String password) async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded(
      Mutation$VerifyPassword(
        verifyPassword: mockVerifyOtpOrPasswordSuccess,
      ),
    );
  }

  @override
  Future<ApiResponse<Query$RegistrationData>> getRegistrationData() async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded(
      Query$RegistrationData(
        me: mockProfileFull1,
        carModels: [
          mockVehicleModel1,
          mockVehicleModel2,
        ],
        carColors: [
          mockVehicleColor1,
          mockVehicleColor2,
        ],
      ),
    );
  }

  @override
  Future<ApiResponse<Mutation$Register>> register({
    required Input$CompleteRegistrationInput input,
  }) async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded(
      Mutation$Register(
        completeRegistration: mockProfileFull1,
      ),
    );
  }
}
