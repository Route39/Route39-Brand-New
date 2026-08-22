import 'package:api_response/api_response.dart';
import 'package:ridy/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:ridy/core/graphql/schema.gql.dart';

abstract class ProfileRepository {
  Stream<ApiResponse<Fragment$Profile>> get profileStream;

  Future<ApiResponse<Fragment$Profile>> getProfile();

  Future<ApiResponse<Fragment$Profile>> updateProfile(
      {required Input$UpdateRiderInput input});
}
