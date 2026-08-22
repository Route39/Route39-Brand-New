import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/documents/login.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';

abstract class AuthRepository {
  Future<ApiResponse<Mutation$VerifyNumber>> verifyNumber({
    required String mobileNumber,
    required String countryIsoCode,
  });

  Future<ApiResponse<Mutation$VerifyOtp>> verifyOtp(
    String hash,
    String otp,
  );

  Future<ApiResponse<Mutation$VerifyPassword>> verifyPassword(
    String mobileNumber,
    String password,
  );

  Future<ApiResponse<Mutation$UpdatePassword>> setPassword(
    String password,
  );

  Future<ApiResponse<Query$RegistrationData>> getRegistrationData();

  Future<ApiResponse<Mutation$ResendOtp>> resendOtp(
    String mobileNumber,
  );

  Future<ApiResponse<Mutation$Register>> register({
    required Input$CompleteRegistrationInput input,
  });
}
