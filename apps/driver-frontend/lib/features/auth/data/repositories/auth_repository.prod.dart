import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/datasources/graphql_datasource.dart';
import 'package:ridy_driver/core/graphql/documents/login.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:graphql/client.dart';
import 'package:injectable/injectable.dart';
import '../../domain/repositories/auth_repository.dart';

@prod
@LazySingleton(as: AuthRepository)
class LoginRepositoryImpl implements AuthRepository {
  final GraphqlDatasource graphqlDatasource;

  LoginRepositoryImpl(this.graphqlDatasource);

  @override
  Future<ApiResponse<Mutation$VerifyNumber>> verifyNumber({
    required String mobileNumber,
    required String countryIsoCode,
  }) async {
    final verifyNumberResponse = await graphqlDatasource.mutate(
      Options$Mutation$VerifyNumber(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$VerifyNumber(
          countryIso: countryIsoCode,
          number: mobileNumber,
        ),
      ),
    );
    return verifyNumberResponse;
  }

  @override
  Future<ApiResponse<Mutation$VerifyOtp>> verifyOtp(String hash, String otp) async {
    final verifyOtpResponse = await graphqlDatasource.mutate(
      Options$Mutation$VerifyOtp(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$VerifyOtp(
          hash: hash,
          code: otp,
        ),
      ),
    );
    return verifyOtpResponse;
  }

  @override
  Future<ApiResponse<Mutation$VerifyPassword>> verifyPassword(String mobileNumber, String password) async {
    final verifyPasswordResponse = await graphqlDatasource.mutate(
      Options$Mutation$VerifyPassword(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$VerifyPassword(
          mobileNumber: mobileNumber,
          password: password,
        ),
      ),
    );
    return verifyPasswordResponse;
  }

  @override
  Future<ApiResponse<Mutation$ResendOtp>> resendOtp(String mobileNumber) async {
    final resendOtpResponse = await graphqlDatasource.mutate(
      Options$Mutation$ResendOtp(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$ResendOtp(
          mobileNumber: mobileNumber,
        ),
      ),
    );
    return resendOtpResponse;
  }

  @override
  Future<ApiResponse<Mutation$UpdatePassword>> setPassword(String password) async {
    final setPasswordResponse = await graphqlDatasource.mutate(
      Options$Mutation$UpdatePassword(
        fetchPolicy: FetchPolicy.noCache,
        variables: Variables$Mutation$UpdatePassword(
          password: password,
        ),
      ),
    );
    return setPasswordResponse;
  }

  @override
  Future<ApiResponse<Query$RegistrationData>> getRegistrationData() async {
    final registrationDataResponse = await graphqlDatasource.query(
      Options$Query$RegistrationData(
        fetchPolicy: FetchPolicy.noCache,
      ),
    );

    return registrationDataResponse;
  }

  @override
  Future<ApiResponse<Mutation$Register>> register({
    required Input$CompleteRegistrationInput input,
  }) async {
    final registerResponse = await graphqlDatasource.mutate(Options$Mutation$Register(
      fetchPolicy: FetchPolicy.noCache,
      variables: Variables$Mutation$Register(
        updateDriverInput: input,
      ),
    ));
    return registerResponse;
  }
}
