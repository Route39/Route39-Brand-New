part of 'location.bloc.dart';

@Freezed(fromJson: true)
sealed class LocationState with _$LocationState {
  const factory LocationState.loading() = LocationState$Loading;

  const factory LocationState.error({
    required LocationError error,
  }) = LocationState$Error;

  const factory LocationState.determined({
    required Fragment$Coordinate location,
  }) = LocationState$Determined;

  factory LocationState.fromJson(Map<String, dynamic> json) => _$LocationStateFromJson(json);

  const LocationState._();

  Fragment$Coordinate? get location => switch (this) {
        LocationState$Determined(:final location) => location,
        _ => null,
      };
}

enum LocationError { permissionDenied, permissionDeniedForever, onlyAllowedWhileInUse, serviceDisabled }
