import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
import 'package:generic_map/generic_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/settings.bloc.dart';
import 'package:ridy/core/datasources/geo_datasource.dart';
import 'package:flutter_common/core/presentation/markers/app_marker_address.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/core/presentation/app_generic_map.dart';
import 'package:ridy/features/favorite_locations/presentation/blocs/favorite_location_desktop_map.bloc.dart';
import 'package:api_response/api_response.dart';

class FavoriteLocationsScreenDesktop extends StatefulWidget {
  final Widget child;

  const FavoriteLocationsScreenDesktop({super.key, required this.child});

  @override
  State<FavoriteLocationsScreenDesktop> createState() => _FavoriteLocationsScreenDesktopState();
}

class _FavoriteLocationsScreenDesktopState extends State<FavoriteLocationsScreenDesktop> {
  MapViewController? mapController;
  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: locator<FavoriteLocationsDesktopMapCubit>(),
      child: Row(
        children: [
          Expanded(
            child: BlocConsumer<FavoriteLocationsDesktopMapCubit, FavoriteLocationsDesktopMapState>(
              listener: (context, state) {
                switch (state) {
                  case FavoriteLocationsDesktopMapState$ShowList(:final locations):
                    mapController?.fitBounds(locations.map((e) => LatLng(e.location.lat, e.location.lng)).toList());
                    break;
                  case FavoriteLocationsDesktopMapState$ViewOne(:final location):
                    mapController?.moveCamera(location.latLng, null);
                    break;
                  case FavoriteLocationsDesktopMapState$Locate(:final centerLocation):
                    if (centerLocation == null) return;
                    mapController?.moveCamera(centerLocation.latLng, null);
                    break;
                  default:
                    break;
                }
              },
              builder: (context, state) {
                final mode = switch (state) {
                  FavoriteLocationsDesktopMapState$ShowList() => MapViewMode.static,
                  FavoriteLocationsDesktopMapState$ViewOne() => MapViewMode.static,
                  FavoriteLocationsDesktopMapState$Locate() => MapViewMode.static,
                  FavoriteLocationsDesktopMapState$Initial() => MapViewMode.static,
                };

                return AppGenericMap(
                  initialLocation: Constants.defaultLocation,
                  mode: mode,
                  markers: state.markers,
                  interactive: true,
                  buttonPadding: EdgeInsets.all(0),
                  padding: const EdgeInsets.symmetric(horizontal: 148),
                  onControllerReady: (controller) {
                    mapController = controller;
                    locator<FavoriteLocationsDesktopMapCubit>().onStarted();
                  },
                  addressResolver: (provider, latlng) async {
                    final settingsState = locator<SettingsCubit>().state;
                    final result = await locator<GeoDatasource>().getAddressForLocation(
                      latLng: latlng,
                      language: settingsState.locale,
                      mapProvider: settingsState.mapProvider,
                    );
                    if (result is ApiResponseError) {
                      return Place(latlng, "", null);
                    } else {
                      return (result as ApiResponseLoaded<Place>).data;
                    }
                  },
                  centerMarkerBuilder: (context, key, address) {
                    final centerAddress = switch (state) {
                      FavoriteLocationsDesktopMapState$Locate(:final centerLocation) => centerLocation?.address ?? "",
                      _ => "",
                    };

                    return AppMarkerAddresss(
                      key: key,
                      title: context.translate.dragToSelect,
                      address: centerAddress,
                    ).centerMarker;
                  },
                  onMapMoved: (event) {
                    if (event.type == MapMoveEventType.start) return;
                    locator<FavoriteLocationsDesktopMapCubit>().locate(centerLocation: event.place);
                  },
                );
              },
            ),
          ),
          Container(width: 420, padding: const EdgeInsets.only(top: 96), child: widget.child),
        ],
      ),
    );
  }
}
