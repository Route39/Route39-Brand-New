import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/datasources/location_update_datasource.dart';
import 'package:ridy_driver/core/graphql/documents/home.graphql.dart';
import 'package:flutter_common/core/entities/driver_location.dart';
import 'package:injectable/injectable.dart';

@dev
@LazySingleton(as: LocationUpdateDatasource)
class LocationUpdateDatasourceMock implements LocationUpdateDatasource {
  @override
  Future<ApiResponse<Mutation$UpdateDriverLocation>> updateDriverLocation({
    required DriverLocation location,
  }) async {
    Future.delayed(
      Duration(seconds: 1),
    );
    return ApiResponse.loaded(
      Mutation$UpdateDriverLocation(updateDriverLocation: true),
    );
  }
}
