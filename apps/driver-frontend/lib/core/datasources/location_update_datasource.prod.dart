import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/datasources/graphql_datasource.dart';
import 'package:ridy_driver/core/datasources/location_update_datasource.dart';
import 'package:ridy_driver/core/graphql/documents/home.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:flutter_common/core/entities/driver_location.dart';
import 'package:injectable/injectable.dart';

@prod
@LazySingleton(as: LocationUpdateDatasource)
class LocationUpdateDatasourceImpl implements LocationUpdateDatasource {
  final GraphqlDatasource _graphqlDatasource;

  LocationUpdateDatasourceImpl(this._graphqlDatasource);

  @override
  Future<ApiResponse<Mutation$UpdateDriverLocation>> updateDriverLocation({
    required DriverLocation location,
  }) async {
    final updateDriverLocationResponse = await _graphqlDatasource.mutate(
      Options$Mutation$UpdateDriverLocation(
        variables: Variables$Mutation$UpdateDriverLocation(
          point: Input$PointInput(
            lat: location.lat,
            lng: location.lng,
          ),
        ),
      ),
    );
    return updateDriverLocationResponse;
  }
}
