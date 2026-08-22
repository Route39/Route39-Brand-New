import 'package:api_response/api_response.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
import 'package:flutter_common/core/presentation/app_card_sheet.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/markers/app_marker_address.dart';
import 'package:flutter_common/core/presentation/my_location_button.dart';
import 'package:generic_map/generic_map.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy/config/env.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/blocs/location.bloc.dart';
import 'package:ridy/core/blocs/place_lookup.bloc.dart';
import 'package:ridy/core/blocs/settings.bloc.dart';
import 'package:ridy/core/datasources/geo_datasource.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/core/presentation/app_generic_map.dart';
import 'package:ridy/core/presentation/place_lookup_state_view.dart';
import 'package:ridy/core/presentation/place_result_item.dart';

import 'locate_screen_layout_delegate.dart';

class LocateFavoriteLocationScreenMobile extends StatefulWidget {
  final Place? initialLocation;

  const LocateFavoriteLocationScreenMobile({super.key, this.initialLocation});

  @override
  State<LocateFavoriteLocationScreenMobile> createState() => _LocateFavoriteLocationScreenMobileState();
}

class _LocateFavoriteLocationScreenMobileState extends State<LocateFavoriteLocationScreenMobile> {
  Place? selectedPlace;
  MapViewController? mapController;

  @override
  Widget build(BuildContext context) {
    return CustomMultiChildLayout(
      delegate: LocateLocationLayoutDelegate(),
      children: [
        LayoutId(
          id: LocateLocationLayoutDelegate.mapLayoutId,
          child: AppGenericMap(
            mode: MapViewMode.picker,
            onControllerReady: (p0) => mapController = p0,
            buttonPadding: EdgeInsets.only(bottom: 32, left: 16, right: 16),
            interactive: true,
            padding: const EdgeInsets.all(148),
            centerMarkerBuilder: (context, key, address) => AppMarkerAddresss(
              key: key,
              title: context.translate.dragToSelect,
              address: selectedPlace?.address ?? "",
            ).centerMarker,
            initialLocation:
                (widget.initialLocation ?? locator<LocationCubit>().state.place ?? Constants.defaultLocation),
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
            onMapMoved: (event) {
              if (event.type == MapMoveEventType.start) return;
              setState(() {
                selectedPlace = event.place;
              });
            },
          ),
        ),
        LayoutId(
          id: LocateLocationLayoutDelegate.cardLayoutId,
          child: BlocBuilder<PlaceLookupBloc, PlaceLookupState>(
            builder: (context, state) {
              final isInitial = switch (state) {
                PlaceLookupState$Initial() => true,
                _ => false,
              };
              return AppCardSheet(
                isFullScreen: state is PlaceLookupState$Loaded,
                child: Padding(
                  padding: EdgeInsets.all(16).copyWith(top: isInitial ? 0 : (48 + MediaQuery.paddingOf(context).top)),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    spacing: 16,
                    children: [
                      if (state is PlaceLookupState$Initial) ...[
                        SizedBox(
                          height: 75,
                          child: PlaceResultItem(
                            subtitle: selectedPlace?.address ?? "",
                            title: selectedPlace?.title,
                            onPressed: null,
                          ),
                        ),
                      ],
                      TextField(
                        onChanged: (value) {
                          final settingsState = locator<SettingsCubit>().state;
                          final locationState = locator<LocationCubit>().state;
                          locator<PlaceLookupBloc>().add(
                            PlaceLookupEvent.onQueryChanged(
                              query: value,
                              latLng: selectedPlace?.latLng ?? locationState.place?.latLng ?? Constants.defaultLocation.latLng,
                              radius: Env.placeSearchSearchRadius,
                              language: settingsState.locale,
                              mapProvider: settingsState.mapProvider,
                            ),
                          );
                        },
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Ionicons.search),
                          hintText: context.translate.searchLocation,
                        ),
                      ),
                      if (state is PlaceLookupState$Loaded ||
                          state is PlaceLookupState$MoreCharacters ||
                          state is PlaceLookupState$Loading) ...[
                        Expanded(
                          child: Align(
                            alignment: Alignment.topCenter,
                            child: PlaceLookupStateView(
                              state: state,
                              onItemSelected: (place) {
                                setState(() {
                                  selectedPlace = place;
                                });
                                mapController?.moveCamera(place.latLng, 16);
                                locator<PlaceLookupBloc>().onStarted();
                              },
                            ),
                          ),
                        ),
                      ],
                      SizedBox(
                        width: double.infinity,
                        child: AppPrimaryButton(
                          onPressed: () {
                            context.router.maybePop(selectedPlace);
                          },
                          child: Text(context.translate.confirm),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        LayoutId(
          id: LocateLocationLayoutDelegate.actionButtonId,
          child: FloatingActionButton.small(
            onPressed: () => context.router.maybePop(),
            child: const Icon(Icons.arrow_back),
          ),
        ),
        LayoutId(
          id: LocateLocationLayoutDelegate.myLocationButtonId,
          child: MyLocationButton(
            onPressed: () {
              if (locator<LocationCubit>().state.place?.latLng == null) return;
              mapController?.moveCamera(locator<LocationCubit>().state.place!.latLng, 16);
              locator<HomeBloc>().add(
                HomeEvent.onMapMoved(selectedLocation: ApiResponseLoaded(locator<LocationCubit>().state.place!)),
              );
            },
          ),
        ),
      ],
    );
  }
}
