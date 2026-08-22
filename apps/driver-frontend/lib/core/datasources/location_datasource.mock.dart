import 'dart:async';

import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/enums/location_permission.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.fragment.graphql.dart';
import 'package:injectable/injectable.dart';
import 'package:rxdart/rxdart.dart';

import 'location_datasource.dart';

@dev
@LazySingleton(as: LocationDatasource)
class LocationDatasourceImpl implements LocationDatasource {
  final StreamController<ApiResponse<Fragment$Coordinate>> _locationStream = BehaviorSubject();
  final StreamController<LocationPermission> _permissionStatusStream = BehaviorSubject();

  @override
  Stream<ApiResponse<Fragment$Coordinate>> get driverLocation => _locationStream.stream;

  @override
  Stream<LocationPermission> get permissionStatus => _permissionStatusStream.stream;

  @override
  void getCurrentLocation() async {
    _locationStream.add(
      ApiResponse.loaded(
        Fragment$Coordinate(
          lat: 37.384135,
          lng: -122.067976,
        ),
      ),
    );
  }

  @override
  Future<bool> isLocationServiceEnabled() async {
    return true;
  }

  @override
  Future<void> startGettingLocationUpdates() async {
    return _locationStream.add(
      ApiResponse.loaded(
        Fragment$Coordinate(
          lat: 37.384135,
          lng: -122.067976,
        ),
      ),
    );
  }

  @override
  void stopGettingLocationUpdates() {
    _locationStream.close();
  }

  @override
  Future<LocationPermission> getLocationPermissionStatus() async {
    return LocationPermission.always;
  }

  @override
  Future<LocationPermission> requestLocationPermission() async {
    return LocationPermission.always;
  }

  @override
  Future<bool> requestLocationService() async {
    return true;
  }
}
