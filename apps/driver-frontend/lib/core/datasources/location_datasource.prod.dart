import 'dart:async';


import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/enums/location_permission.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.fragment.graphql.dart';
import 'package:injectable/injectable.dart';
import 'package:location/location.dart';
import 'package:geolocator/geolocator.dart' as geolocator;
import 'package:permission_handler/permission_handler.dart';
import 'package:rxdart/rxdart.dart';
import 'package:flutter/foundation.dart';

import 'location_datasource.dart';

const int kDistanceFilter = 20; // meters
const int kLocationUpdateInterval = 5000; // milliseconds

@prod
@LazySingleton(as: LocationDatasource)
class LocationDatasourceImpl implements LocationDatasource {
  final BehaviorSubject<ApiResponse<Fragment$Coordinate>> _locationStream = BehaviorSubject();

  @override
  Stream<ApiResponse<Fragment$Coordinate>> get driverLocation => _locationStream.stream;

  final BehaviorSubject<LocationPermission> _permissionStatusStream = BehaviorSubject();

  @override
  Stream<LocationPermission> get permissionStatus => _permissionStatusStream.stream;

  StreamSubscription<LocationData>? _locationSubscription;

  Timer? resendTimer;

  @override
  void getCurrentLocation() async {
    if (!(await geolocator.Geolocator.isLocationServiceEnabled())) {
      return;
    }
    final permission = await geolocator.Geolocator.checkPermission();
    if (permission == geolocator.LocationPermission.denied) {
      await geolocator.Geolocator.requestPermission();
      return;
    }
    // final currentPosition = await Location.instance.getLocation();
    final currentPosition = await geolocator.Geolocator.getCurrentPosition(
      locationSettings: geolocator.LocationSettings(accuracy: geolocator.LocationAccuracy.high),
    );
    _locationStream.add(
      ApiResponse.loaded(
        Fragment$Coordinate(
          lat: currentPosition.latitude,
          lng: currentPosition.longitude,
        ),
      ),
    );
  }

  @override
  Future<bool> isLocationServiceEnabled() async {
    return Location.instance.serviceEnabled();
  }

  @override
  Future<void> startGettingLocationUpdates() async {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.macOS) return;

    if (!kIsWeb) {
      if (!await Location.instance.isBackgroundModeEnabled()) {
        final permission = await requestLocationPermission();
        if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
          return;
        }
      }
      Location.instance.enableBackgroundMode(enable: true);
    } else {
      final permission = await requestLocationPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return;
      }
    }

    await Location.instance.changeSettings(
      accuracy: (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) ? LocationAccuracy.navigation : LocationAccuracy.high,
      interval: kLocationUpdateInterval,
      distanceFilter: kDistanceFilter.toDouble(),
    );

    _locationSubscription?.cancel();

    DateTime? lastEmitTime;
    LocationData? lastLocation;

    _locationSubscription = Location.instance.onLocationChanged.listen((event) {
      final now = DateTime.now();
      final currentLat = event.latitude!;
      final currentLng = event.longitude!;
      final heading = event.heading?.toInt();

      final timeSinceLastEmit = lastEmitTime != null ? now.difference(lastEmitTime!) : Duration(days: 1);
      final movedDistance = (lastLocation?.latitude != null && lastLocation?.longitude != null)
          ? geolocator.Geolocator.distanceBetween(
              lastLocation!.latitude!,
              lastLocation!.longitude!,
              currentLat,
              currentLng,
            )
          : kDistanceFilter + 1;

      if (movedDistance >= kDistanceFilter || timeSinceLastEmit >= Duration(minutes: 2)) {
        lastEmitTime = now;
        lastLocation = event;

        _locationStream.add(ApiResponse.loaded(Fragment$Coordinate(lat: currentLat, lng: currentLng, heading: heading)));
      }
    });

    // Ensure resend if no updates for 2 minutes
    resendTimer = Timer.periodic(Duration(seconds: 60), (_) {
      final now = DateTime.now();
      if (lastEmitTime == null || now.difference(lastEmitTime!) >= Duration(minutes: 2)) {
        if (lastLocation != null) {
          lastEmitTime = now;
          _locationStream.add(
            ApiResponse.loaded(
              Fragment$Coordinate(
                lat: lastLocation!.latitude!,
                lng: lastLocation!.longitude!,
                heading: lastLocation!.heading?.toInt(),
              ),
            ),
          );
        }
      }
    });
  }

  @override
  void stopGettingLocationUpdates() {
    if (!kIsWeb && defaultTargetPlatform != TargetPlatform.macOS) {
      Location.instance.enableBackgroundMode(enable: false);
    }
    resendTimer?.cancel();
    resendTimer = null;
    _locationSubscription?.cancel();
    _locationSubscription = null;
  }

  @override
  Future<bool> requestLocationService() async {
    return Location.instance.requestService();
  }

  @override
  Future<LocationPermission> getLocationPermissionStatus() async {
    // Check foreground first
    var locationAlwaysAndWhenInUse = await Permission.location.status;
    if (!locationAlwaysAndWhenInUse.isGranted || (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS)) {
      _permissionStatusStream.add(locationAlwaysAndWhenInUse.toLocationPermission());
      await Permission.sensors.request();
      return locationAlwaysAndWhenInUse.toLocationPermission();
    }

    if (kIsWeb) {
      _permissionStatusStream.add(locationAlwaysAndWhenInUse.toLocationPermission());
      return locationAlwaysAndWhenInUse.toLocationPermission();
    }

    // Check background (only relevant on Android)
    var background = await Permission.locationAlways.status;
    _permissionStatusStream.add(background.toLocationPermission());
    return background.toLocationPermission();
  }

  @override
  Future<LocationPermission> requestLocationPermission() async {
    // Request foreground permission
    var foreground = await Permission.location.request();
    if (!foreground.isGranted || (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS)) {
      _permissionStatusStream.add(foreground.toLocationPermission());
      return foreground.toLocationPermission();
    }

    if (kIsWeb) {
      _permissionStatusStream.add(foreground.toLocationPermission());
      return foreground.toLocationPermission();
    }

    var background = await Permission.locationAlways.request();
    _permissionStatusStream.add(background.toLocationPermission());
    return background.toLocationPermission();
  }
}
