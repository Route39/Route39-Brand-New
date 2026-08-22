import 'package:api_response/api_response.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/graphql/documents/profile.graphql.dart';
import 'package:ridy/core/graphql/fragments/favorite_driver.mock.dart';
import 'package:ridy/features/profile/domain/repositories/profile_repository.dart';

@dev
@LazySingleton(as: ProfileRepository)
class ProfileRepositoryMock implements ProfileRepository {
  @override
  Future<ApiResponse<Query$ProfileAggregations>> getProfileAggregationsInfo() async {
    return ApiResponse.loaded(
      Query$ProfileAggregations(
          myStatistics: Query$ProfileAggregations$myStatistics(
              distanceTraveled: 453,
              totalRides: 120,
              canceledRides: 430,
              completedRides: 213,
              favoriteDriversCount: 54)),
    );
  }

  @override
  Future<ApiResponse<Query$FavoriteDrivers>> getFavoriteDrivers() async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded(
      Query$FavoriteDrivers(
        favoriteDrivers: [
          mockFavoriteDriver1,
        ],
      ),
    );
  }

  @override
  Future<ApiResponse<Mutation$DeleteFavoriteDriver>> deleteFavoriteDriver({
    required String driverId,
  }) async {
    await Future.delayed(
      const Duration(
        seconds: 1,
      ),
    );
    return ApiResponse.loaded(
      Mutation$DeleteFavoriteDriver(
        deleteFavoriteDriver: true,
      ),
    );
  }

  @override
  Future<ApiResponse<Mutation$DeleteAccount>> deleteAccount() async {
    await Future.delayed(
      const Duration(
        seconds: 1,
      ),
    );
    return ApiResponse.loaded(
      Mutation$DeleteAccount(
        deleteUser: Mutation$DeleteAccount$deleteUser(
          id: '1',
        ),
      ),
    );
  }
}
