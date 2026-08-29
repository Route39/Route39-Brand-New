import 'package:api_response/api_response.dart';
import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:generic_map/interfaces/place.dart';
import 'package:ridy/config/env.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/config/router/app_router.dart';
import 'package:ridy/core/blocs/auth_bloc.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/blocs/location.bloc.dart';
import 'package:ridy/core/blocs/place_lookup.bloc.dart';
import 'package:ridy/core/blocs/settings.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:ridy/core/presentation/place_lookup_state_view.dart';
import 'package:ridy/core/presentation/place_result_item.dart';
import 'package:flutter_common/core/presentation/waypoints_view/icon_destination.dart';
import 'package:flutter_common/core/presentation/waypoints_view/line_connect_destinations.dart';
import 'package:ridy/features/home/presentation/blocs/destination_suggestions.bloc.dart';

import '../components/add_stop_button.dart';
import '../components/location_textfield.dart';

class WaypointsInputSheet extends StatefulWidget {
  final List<Place?> waypoints;

  const WaypointsInputSheet({super.key, required this.waypoints});

  @override
  State<WaypointsInputSheet> createState() => _WaypointsInputSheetState();
}

class _WaypointsInputSheetState extends State<WaypointsInputSheet> {
  final placeLookupBloc = locator<PlaceLookupBloc>();
  final homeBloc = locator<HomeBloc>();

  @override
  void initState() {
    super.initState();
    if (homeBloc.state.selectedWaypointIndex == null) {
      homeBloc.add(HomeEvent.focusOnWaypoint(index: 1));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        color: ColorPalette.neutralVariant99,
        boxShadow: [
          BoxShadow(
            color: Color(0x3F0E275D),
            blurRadius: 20,
            offset: Offset(2, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: MultiBlocProvider(
        providers: [
          BlocProvider.value(value: placeLookupBloc),
          BlocProvider.value(value: locator<DestinationSuggestionsCubit>()),
        ],
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 12),
              BlocBuilder<HomeBloc, HomeState>(
                builder: (context, state) {
                  return ConstrainedBox(
                    constraints: BoxConstraints(
                      maxHeight: MediaQuery.of(context).size.height * 0.55,
                    ),
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text('Your route', style: context.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),
                          Stack(
                            children: [
                              Column(
                                mainAxisSize: MainAxisSize.min,
                                children: widget.waypoints
                                    .mapIndexed(
                                      (index, waypoint) => Padding(
                                        padding: const EdgeInsets.only(bottom: 16),
                                        child: LocationTextfield(
                                          key: ValueKey('waypoint_field_$index'),
                                          isFocused: state.selectedWaypointIndex == index,
                                          onRemoveStop: () => homeBloc.add(HomeEvent.onRemoveStop(index: index)),
                                          index: index,
                                          totalCount: widget.waypoints.length,
                                          initialValue: waypoint,
                                          onFocused: () {
                                            placeLookupBloc.onStarted();
                                            locator<HomeBloc>().add(HomeEvent.focusOnWaypoint(index: index));
                                          },
                                          onChanged: (value) {
                                            final settingsState = locator<SettingsCubit>().state;
                                            final locationState = locator<LocationCubit>().state;
                                            locator<PlaceLookupBloc>().add(
                                              PlaceLookupEvent.onQueryChanged(
                                                query: value,
                                                latLng: homeBloc.state.selectedLocationResponse.data?.latLng ?? locationState.place?.latLng ?? Constants.defaultLocation.latLng,
                                                radius: Env.placeSearchSearchRadius,
                                                language: settingsState.locale,
                                                mapProvider: settingsState.mapProvider,
                                              ),
                                            );
                                          },
                                          onMapPressed: (value) {
                                            locator<HomeBloc>().add(HomeEvent.focusOnWaypoint(index: index));
                                            showConfirmLocation(
                                              widget.waypoints[index] ??
                                                  locator<LocationCubit>().state.place ??
                                                  Constants.defaultLocation,
                                            );
                                          },
                                        ),
                                      ),
                                    )
                                    .toList(),
                              ),
                              if (widget.waypoints.length == 2)
                                Positioned(
                                  right: 0,
                                  top: 44,
                                  child: GestureDetector(
                                    onTap: () {
                                      final first = widget.waypoints[0];
                                      final second = widget.waypoints[1];
                                      if (first != null) {
                                        homeBloc.add(HomeEvent.showConfirmWaypoint(selectedLocation: first));
                                        homeBloc.add(HomeEvent.focusOnWaypoint(index: 1));
                                        homeBloc.add(HomeEvent.onWaypointConfirmed());
                                      }
                                      if (second != null) {
                                        homeBloc.add(HomeEvent.showConfirmWaypoint(selectedLocation: second));
                                        homeBloc.add(HomeEvent.focusOnWaypoint(index: 0));
                                        homeBloc.add(HomeEvent.onWaypointConfirmed());
                                      }
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(color: Colors.black12, blurRadius: 4),
                                        ],
                                      ),
                                      child: const Icon(Icons.swap_vert, size: 20, color: Colors.black54),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              AddSpotButton(onPressed: () => homeBloc.add(HomeEvent.onAddStop())),
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: () => homeBloc.add(HomeEvent.onAddStop()),
                                child: Text(
                                  'Add stop',
                                  style: context.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ),
                          BlocBuilder<PlaceLookupBloc, PlaceLookupState>(
                            builder: (context, state) => PlaceLookupStateView(
                              state: state,
                              initialStateView: BlocBuilder<DestinationSuggestionsCubit, DestinationSuggestionsState>(
                                builder: (context, state) => switch (state.destinationSuggesionsState) {
                                  ApiResponseLoaded() => Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      for (var place in state.destinationSuggestions!.$2)
                                        PlaceResultItem(
                                          onPressed: () => showConfirmLocation(place),
                                          title: place.title,
                                          trailing: locator<LocationCubit>().state.distanceTo(place.latLng, context),
                                          subtitle: place.address,
                                          isRecent: true,
                                        ),
                                    ].separated(const Divider(thickness: 0.3, indent: 48, height: 16)),
                                  ),
                                  _ => const SizedBox(),
                                },
                              ),
                              onItemSelected: showConfirmLocation,
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
                  );
                },
              ),
              Padding(
                padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16, top: 8),
                child: AppPrimaryButton(
                  isDisabled: widget.waypoints.nonNulls.length != widget.waypoints.length,
                  color: PrimaryButtonColor.error,
                  onPressed: () {
                    final isAuthenticated = locator<AuthBloc>().state.isAuthenticated;
                    if (isAuthenticated) {
                      homeBloc.add(HomeEvent.showPreview());
                    } else {
                      context.router.push(const AuthRoute());
                    }
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Confirm Route'),
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward, size: 18, color: Colors.white),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void showConfirmLocation(Place place) {
    final homeBloc = locator<HomeBloc>();
    homeBloc.add(HomeEvent.showConfirmWaypoint(selectedLocation: place));
    homeBloc.add(HomeEvent.onWaypointConfirmed());

    final updatedWaypoints = [...widget.waypoints];
    final index = homeBloc.state.selectedWaypointIndex ?? 0;
    if (index < updatedWaypoints.length) {
      updatedWaypoints[index] = place;
    }
    final allFilled = updatedWaypoints.nonNulls.length == updatedWaypoints.length;
    if (allFilled) {
      final isAuthenticated = locator<AuthBloc>().state.isAuthenticated;
      if (isAuthenticated) {
        homeBloc.add(HomeEvent.showPreview());
      } else {
        context.router.push(const AuthRoute());
      }
    }
  }
}
