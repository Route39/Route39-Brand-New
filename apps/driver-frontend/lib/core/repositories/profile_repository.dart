import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/documents/profile.graphql.dart';

abstract class ProfileRepository {
  Future<ApiResponse<Query$Profile>> getProfile();
  Future<ApiResponse<Mutation$UpdateDriverOfferFilter>> updateRadius({
    required int? radius,
  });
  Future<ApiResponse<bool>> deleteAccount();
}
