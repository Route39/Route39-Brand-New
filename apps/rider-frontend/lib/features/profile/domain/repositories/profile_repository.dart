import 'package:api_response/api_response.dart';

import 'package:ridy/core/graphql/documents/profile.graphql.dart';

abstract class ProfileRepository {
  Future<ApiResponse<Query$ProfileAggregations>> getProfileAggregationsInfo();

  Future<ApiResponse<Query$FavoriteDrivers>> getFavoriteDrivers();

  Future<ApiResponse<Mutation$DeleteFavoriteDriver>> deleteFavoriteDriver({
    required String driverId,
  });

  Future<ApiResponse<Mutation$DeleteAccount>> deleteAccount();
}
