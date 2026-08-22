import 'package:api_response/api_response.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/graphql/documents/profile.graphql.dart';
import 'package:ridy/core/datasources/graphql_datasource.dart';
import 'package:ridy/features/profile/domain/repositories/profile_repository.dart';

@prod
@LazySingleton(as: ProfileRepository)
class ProfileRepositoryProd implements ProfileRepository {
  final GraphqlDatasource graphqlDatasource;

  ProfileRepositoryProd(this.graphqlDatasource);

  @override
  Future<ApiResponse<Query$ProfileAggregations>> getProfileAggregationsInfo() async {
    final profileAggregationsInfoResponse = await graphqlDatasource.query(
      Options$Query$ProfileAggregations(),
    );

    return profileAggregationsInfoResponse;
  }

  @override
  Future<ApiResponse<Query$FavoriteDrivers>> getFavoriteDrivers() async {
    final favoriteDriversResponse = await graphqlDatasource.query(
      Options$Query$FavoriteDrivers(),
    );

    return favoriteDriversResponse;
  }

  @override
  Future<ApiResponse<Mutation$DeleteFavoriteDriver>> deleteFavoriteDriver({
    required String driverId,
  }) async {
    final deleteFavoriteDriverResponse = await graphqlDatasource.mutate(
      Options$Mutation$DeleteFavoriteDriver(
        variables: Variables$Mutation$DeleteFavoriteDriver(
          driverId: driverId,
        ),
      ),
    );

    return deleteFavoriteDriverResponse;
  }

  @override
  Future<ApiResponse<Mutation$DeleteAccount>> deleteAccount() async {
    final deleteAccountResponse = await graphqlDatasource.mutate(
      Options$Mutation$DeleteAccount(),
    );

    return deleteAccountResponse;
  }
}
