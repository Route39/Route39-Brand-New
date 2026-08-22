import 'package:api_response/api_response.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
import 'package:flutter_common/core/presentation/markers/app_marker_pickup.dart';
import 'package:generic_map/generic_map.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/blocs/settings.bloc.dart';
import 'package:ridy/core/datasources/geo_datasource.dart';
import 'package:flutter_common/core/presentation/markers/app_marker_drop_off.dart';
import 'package:ridy/core/graphql/fragments/point.extensions.dart';
import 'package:ridy/core/presentation/app_generic_map.dart';
import 'package:ridy/features/home/presentation/blocs/home.extensions.dart';

import 'current_location_marker.dart';

class HomeMap extends StatefulWidget {
  const HomeMap({super.key});

  @override
  State<HomeMap> createState() => _HomeMapState();
}

class _HomeMapState extends State<HomeMap> {
  @override
  Widget build(BuildContext context) {
    return BlocConsumer<HomeBloc, HomeState>(
      listenWhen: (previous, current) => previous.markers != current.markers,
      listener: (context, state) async {
        switch (state.mode) {
          case HomeMode.preSubmission:
            switch (state.orderSubmissionPage) {
              case OrderSubmissionPage.welcome:
                // if (state.waypoints.first == null) return;
                // final mapCenter = await state.mapViewController?.getCenter();
                // final distance = mapCenter?.distanceTo(state.waypoints.first!.latLng);
                // if (distance != null && distance < 100) return;
                // state.mapViewController?.moveCamera(state.waypoints.first!.latLng, null);
                return;

              case OrderSubmissionPage.confirmLocation:
                // if (state.selectedLocationResponse.data == null) return;
                // final mapCenter = await state.mapViewController?.getCenter();
                // final distance = mapCenter?.distanceTo(state.selectedLocationResponse.data!.latLng);
                // if (distance != null && distance < 50) return;
                // state.mapViewController?.moveCamera(state.selectedLocationResponse.data!.latLng, null);
                break;
              default:
                break;
            }
            break;
          case HomeMode.ridePreview:
            // if (state.waypoints.nonNulls.toList().latLngs.length < 2) return;
            // Future.delayed(const Duration(milliseconds: 200), () {
            //   if (state.ridePreviewFareResponse.isLoaded) {
            //     state.mapViewController?.fitBounds(
            //       state.waypoints.nonNulls.toList().latLngs.followedBy(state.directions.toLatLngs).toList(),
            //     );
            //   }
            // });
            break;

          case HomeMode.rideInProgress:
            if (state.markers.nonNulls.toList().length < 2) return;
            state.mapViewController?.fitBounds(
              state.markers.nonNulls.toList().map((e) => e.position).followedBy(state.directions.toLatLngs).toList(),
            );
            break;

          default:
            break;
        }
      },
      builder: (context, state) {
        return BlocBuilder<SettingsCubit, SettingsState>(
          buildWhen: (previous, current) => previous.mapProvider != current.mapProvider,
          builder: (context, settingsState) {
            return AppGenericMap(
              padding: const EdgeInsets.only(left: 120, right: 120, top: 150, bottom: 60),
              buttonPadding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
              mode: state.mapViewMode,
              interactive: state.isInteractive,
              polylines: state.polylines(context),
              onControllerReady: (controller) => locator<HomeBloc>().add(HomeEvent.onMapReady(controller: controller)),
              centerMarkerBuilder: switch (state.orderSubmissionPage) {
                OrderSubmissionPage.confirmLocation => (context, key, address) {
                  if (state.selectedWaypointIndex == 0) {
                    return AppMarkerPickup(address: "Drag to adjust", key: key).centerMarker;
                  } else {
                    return AppMarkerDropoff(address: "Drag to adjust", key: key).centerMarker;
                  }
                },
                OrderSubmissionPage.welcome => (context, key, address) => CurrentLocationMarker(key: key).marker,
                _ => null,
              },
              enableAddressResolve: state.mapViewMode == MapViewMode.picker,
              addressResolver: state.mapViewMode == MapViewMode.static
                  ? null
                  : (provider, location) async {
                      final settingsState = locator<SettingsCubit>().state;
                      final result = await locator<GeoDatasource>().getAddressForLocation(
                        latLng: location,
                        language: settingsState.locale,
                        mapProvider: settingsState.mapProvider,
                      );
                      if (result is ApiResponseError) {
                        return Place(location, "", "");
                      } else {
                        final data = (result as ApiResponseLoaded<Place>).data;
                        return Place(location, data.address, data.title);
                      }
                    },
              onMapMoved: (event) {
                if (event.type == MapMoveEventType.start) return;
                if (state.mapViewMode == MapViewMode.picker) {
                  locator<HomeBloc>().add(HomeEvent.onMapMoved(selectedLocation: ApiResponseLoaded(event.place)));
                }
              },
              markers: state.markers,
              initialLocation: state.waypoints.firstOrNull ?? Constants.defaultLocation,
            );
          },
        );
      },
    );
  }
}
