import 'package:api_response/api_response.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:flutter_common/core/theme/animation_duration.dart';
import 'package:generic_map/interfaces/place.dart';
import 'package:ridy/config/env.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/auth_bloc.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/blocs/location.bloc.dart';
import 'package:ridy/core/blocs/place_lookup.bloc.dart';
import 'package:ridy/core/blocs/settings.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/app_card_sheet.dart';
import 'package:ridy/core/presentation/place_lookup_state_view.dart';
import 'package:ridy/core/presentation/place_result_item.dart';
import 'package:ridy/gen/assets.gen.dart';

import '../../../../presentation/blocs/destination_suggestions.bloc.dart';
import '../components/where_are_you_going_button.dart';
import '../popular_search_notifier.dart';

class WhereAreYouGoingSheet extends StatefulWidget {
  final List<Place?> waypoints;

  const WhereAreYouGoingSheet({
    super.key,
    required this.waypoints,
  });

  @override
  State<WhereAreYouGoingSheet> createState() => _WhereAreYouGoingSheetState();
}

class _WhereAreYouGoingSheetState extends State<WhereAreYouGoingSheet> {
  bool isExpanded = true;
  final placeLookupBloc = locator<PlaceLookupBloc>();

  @override
  void initState() {
    super.initState();
    activePopularSearchNotifier.addListener(_onPopularSearchChanged);
  }

  @override
  void dispose() {
    activePopularSearchNotifier.removeListener(_onPopularSearchChanged);
    super.dispose();
  }

  void _onPopularSearchChanged() {
    if (mounted) setState(() {});
  }

  String? extractDistrictFromAddress(String? address) {
    if (address == null) return null;
    final match = RegExp(r',\s*([A-Za-z\s]+?),\s*Tamil\s*Nadu', caseSensitive: false).firstMatch(address);
    return match?.group(1)?.trim();
  }

  void searchPopularPlace(String query) {
    activePopularSearchNotifier.value = query;
    placeLookupBloc.onStarted();
    final settingsState = locator<SettingsCubit>().state;
    final locationState = locator<LocationCubit>().state;
    final district = extractDistrictFromAddress(locationState.place?.address);
    final biasedQuery = district != null && district.isNotEmpty ? '$query $district' : query;
    placeLookupBloc.add(
      PlaceLookupEvent.onQueryChanged(
        query: biasedQuery,
        latLng: locationState.place?.latLng ?? Constants.defaultLocation.latLng,
        radius: Env.placeSearchSearchRadius * 3,
        language: settingsState.locale,
        mapProvider: settingsState.mapProvider,
      ),
    );
  }

  void selectDestination(Place place) {
    final pickupLocation = widget.waypoints.firstOrNull ?? locator<LocationCubit>().state.place;
    if (pickupLocation == null) {
      context.showSnackBar(message: context.translate.pickupLocationNotFound);
      return;
    }
    locator<HomeBloc>().add(HomeEvent.showPreview(destination: place));
  }

  @override
  Widget build(BuildContext context) {
    return AppCardSheet(
      child: BlocProvider.value(
        value: locator<DestinationSuggestionsCubit>(),
        child: BlocListener<AuthBloc, AuthState>(
          listener: (context, state) {
            switch (state) {
              case AuthState$Authenticated():
                locator<DestinationSuggestionsCubit>().onStarted();
                break;
              default:
                break;
            }
          },
          child: Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              bottom: MediaQuery.of(context).padding.bottom,
            ),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (activePopularSearchNotifier.value != null)
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () {
                            activePopularSearchNotifier.value = null;
                          },
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Where do you want to go?',
                            style: context.headlineSmall,
                          ),
                        ),
                      ],
                    )
                  else
                    Text(
                      'Where do you want to go?',
                      style: context.headlineSmall,
                    ),
                  const SizedBox(height: 16),
                  WhereAreYouGoingButton(
                    onPressed: () {
                      locator<HomeBloc>().add(HomeEvent.changeOrderSubmissionPage(
                        orderSubmissionPage: OrderSubmissionPage.rideWaypointsInput,
                      ));
                    },
                  ),
                  const SizedBox(height: 16),
                  Text('Popular Places', style: context.titleMedium),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _PopularPlaceCard(
                          title: 'Bus Stand',
                          assetPath: 'assets/images/popular_bus_stand.jpg',
                          isActive: activePopularSearchNotifier.value == 'Bus Stand',
                          onTap: () => searchPopularPlace('Bus Stand'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _PopularPlaceCard(
                          title: 'Railway station',
                          assetPath: 'assets/images/popular_railway_station.jpg',
                          isActive: activePopularSearchNotifier.value == 'Railway station',
                          onTap: () => searchPopularPlace('Railway station'),
                        ),
                      ),
                    ],
                  ),
                  if (activePopularSearchNotifier.value != null) ...[
                    const SizedBox(height: 12),
                    BlocProvider.value(
                      value: placeLookupBloc,
                      child: BlocBuilder<PlaceLookupBloc, PlaceLookupState>(
                        builder: (context, state) {
                          if (state is PlaceLookupState$Loaded) {
                            final places = [...state.places];
                            double parseKm(String? label) {
                              if (label == null) return double.infinity;
                              final match = RegExp(r'([0-9]+\.?[0-9]*)\s*(km|m)').firstMatch(label.toLowerCase());
                              if (match == null) return double.infinity;
                              final value = double.tryParse(match.group(1) ?? '') ?? double.infinity;
                              return match.group(2) == 'm' ? value / 1000 : value;
                            }

                            final currentAddress = locator<LocationCubit>().state.place?.address;
                            final currentDistrict = extractDistrictFromAddress(currentAddress);

                            var filteredPlaces = places;
                            if (currentDistrict != null && currentDistrict.isNotEmpty) {
                              filteredPlaces = places
                                  .where((p) => (p.address ?? '').toLowerCase().contains(currentDistrict.toLowerCase()))
                                  .toList();
                            }

                            filteredPlaces.sort((a, b) {
                              final da = parseKm(locator<LocationCubit>().state.distanceTo(a.latLng, context));
                              final db = parseKm(locator<LocationCubit>().state.distanceTo(b.latLng, context));
                              return da.compareTo(db);
                            });
                            final nearby = filteredPlaces.take(5).toList();

                            if (nearby.isEmpty) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                child: Text(
                                  'No results found in ${currentDistrict ?? "your area"}',
                                  style: context.bodyMedium?.copyWith(color: ColorPalette.neutralVariant50),
                                ),
                              );
                            }
                            return Column(
                              mainAxisSize: MainAxisSize.min,
                              children: nearby
                                  .map(
                                    (place) => PlaceResultItem(
                                      onPressed: () => selectDestination(place),
                                      title: place.title,
                                      subtitle: place.address,
                                      trailing: locator<LocationCubit>().state.distanceTo(place.latLng, context),
                                    ),
                                  )
                                  .separated(const Divider(thickness: 0.3, indent: 48, height: 16)),
                            );
                          }
                          return PlaceLookupStateView(
                            state: state,
                            initialStateView: const SizedBox.shrink(),
                            onItemSelected: selectDestination,
                          );
                        },
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  AnimatedCrossFade(
                    duration: AnimationDuration.pageStateTransitionMobile,
                    crossFadeState: isExpanded ? CrossFadeState.showFirst : CrossFadeState.showSecond,
                    secondChild: const SizedBox.shrink(),
                    firstChild: BlocBuilder<DestinationSuggestionsCubit, DestinationSuggestionsState>(
                      builder: (context, state) => AnimatedSwitcher(
                          duration: AnimationDuration.pageStateTransitionMobile,
                          child: switch (state.destinationSuggesionsState) {
                            ApiResponseInitial() => const SizedBox.shrink(),
                            ApiResponseLoading() => Center(child: Assets.lottie.loading.lottie(width: 100, height: 100)),
                            ApiResponseLoaded() => Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Container(
                                    constraints: const BoxConstraints(maxHeight: 100),
                                    child: ListView.separated(
                                      shrinkWrap: true,
                                      padding: EdgeInsets.zero,
                                      itemBuilder: (context, index) {
                                        final item = state.destinationSuggestions!.$2[index];

                                        return PlaceResultItem(
                                            subtitle: item.address,
                                            title: item.title,
                                            isRecent: true,
                                            onPressed: () {
                                              final pickupLocation =
                                                  widget.waypoints.firstOrNull ?? locator<LocationCubit>().state.place;
                                              if (pickupLocation == null) {
                                                context.showSnackBar(
                                                  message: context.translate.pickupLocationNotFound,
                                                );
                                                return;
                                              }
                                              locator<HomeBloc>().add(HomeEvent.showPreview(
                                                destination: Place(
                                                  item.latLng,
                                                  item.address,
                                                  item.title,
                                                ),
                                              ));
                                            });
                                      },
                                      separatorBuilder: (context, index) => const Divider(indent: 42),
                                      itemCount: state.destinationSuggestions!.$2.length,
                                    ),
                                  ),
                                ],
                              ),
                            ApiResponseError(:final message) => Text(message),
                          }),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PopularPlaceCard extends StatelessWidget {
  final String title;
  final String assetPath;
  final bool isActive;
  final VoidCallback onTap;

  const _PopularPlaceCard({
    required this.title,
    required this.assetPath,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isActive ? Colors.red : Colors.grey.shade200,
            width: isActive ? 2 : 1,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: context.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Icon(Icons.chevron_right, color: isActive ? Colors.red : Colors.black45, size: 18),
                ],
              ),
            ),
            AspectRatio(
              aspectRatio: 16 / 10,
              child: Image.asset(
                assetPath,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: Colors.grey.shade200,
                  child: const Icon(Icons.image_not_supported_outlined, color: Colors.grey),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
