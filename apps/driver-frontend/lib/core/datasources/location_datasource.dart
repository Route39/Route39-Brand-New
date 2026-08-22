import 'dart:async';

import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/enums/location_permission.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.fragment.graphql.dart';

abstract class LocationDatasource {
  Stream<ApiResponse<Fragment$Coordinate>> get driverLocation;

  Stream<LocationPermission> get permissionStatus;

  Future<LocationPermission> getLocationPermissionStatus();
  Future<bool> isLocationServiceEnabled();
  Future<LocationPermission> requestLocationPermission();
  Future<bool> requestLocationService();
  void getCurrentLocation();
  Future<void> startGettingLocationUpdates();
  void stopGettingLocationUpdates();
}
