import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:generic_map/generic_map.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:injectable/injectable.dart';
import 'package:latlong2/latlong.dart';
import 'package:ridy/core/datasources/geo_datasource.dart';
import 'package:ridy/core/datasources/location_datasource.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:api_response/api_response.dart';

part 'location.state.dart';
part 'location.bloc.freezed.dart';
part 'location.bloc.g.dart';

@lazySingleton
class LocationCubit extends HydratedCubit<LocationState> {
  final LocationDatasource locationDatasource;
  final GeoDatasource geoDatasource;

  LocationCubit(this.locationDatasource, this.geoDatasource) : super(const LocationState.loading());

  void fetchCurrentLocation({required String language, required MapProviderEnum mapProvider}) async {
    emit(const LocationState.loading());
    final serviceEnabled = await locationDatasource.isLocationServiceEnabled();
    if (serviceEnabled == false) {
      emit(const LocationState.error(error: LocationError.serviceDisabled));
    }
    bool permissionGranted = false;
    try {
      permissionGranted = await locationDatasource.isLocationPermissionGranted();
    } catch (error) {
      permissionGranted = false;
    }
    if (permissionGranted == false) {
      emit(const LocationState.error(error: LocationError.permissionDenied));
    }
    final location = await geoDatasource.getCurrentLocation(language: language, mapProvider: mapProvider);
    if (location is ApiResponseError) {
      emit(const LocationState.error(error: LocationError.unknown));
    } else {
      emit(LocationState.determined(place: (location as ApiResponseLoaded<Place>).data));
    }
  }

  @override
  LocationState? fromJson(Map<String, dynamic> json) {
    return LocationState.fromJson(json);
  }

  @override
  Map<String, dynamic>? toJson(LocationState state) {
    return state.toJson();
  }
}
