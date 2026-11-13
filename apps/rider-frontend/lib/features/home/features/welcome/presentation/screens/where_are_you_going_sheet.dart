import 'package:latlong2/latlong.dart';
import 'package:ridy/core/graphql/fragments/favorite_location.fragment.graphql.dart';
import 'package:ridy/features/favorite_locations/domain/repositories/favorite_locations_repository.dart';
import 'package:ridy/features/favorite_locations/models/update_favorite_location_input.dart';
import 'package:ridy/features/home/presentation/blocs/destination_suggestions.bloc.dart';
import '../components/category_tiles.dart';
import 'package:api_response/api_response.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:flutter_common/core/theme/animation_duration.dart';
import 'package:generic_map/interfaces/place.dart';
import 'package:ridy/config/env.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
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
import '../premium_notifier.dart';

class WhereAreYouGoingSheet extends StatefulWidget {
  final List<Place?> waypoints;

  const WhereAreYouGoingSheet({super.key, required this.waypoints});

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
    final match = RegExp(
      r',\s*([A-Za-z\s]+?),\s*Tamil\s*Nadu',
      caseSensitive: false,
    ).firstMatch(address);
    return match?.group(1)?.trim();
  }

  void searchPopularPlace(String query) {
    activePopularSearchNotifier.value = query;
    placeLookupBloc.onStarted();
    final settingsState = locator<SettingsCubit>().state;
    final locationState = locator<LocationCubit>().state;
    final district = extractDistrictFromAddress(locationState.place?.address);
    final biasedQuery = district != null && district.isNotEmpty
        ? '$query $district'
        : query;
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
    final pickupLocation =
        widget.waypoints.firstOrNull ?? locator<LocationCubit>().state.place;
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
                      ],
                    ),
                  const SizedBox(height: 16),
                  BlocBuilder<HomeBloc, HomeState>(
                    bloc: locator<HomeBloc>(),
                    builder: (context, homeState) {
                      final isRide =
                          homeState.orderType == Enum$TaxiOrderType.Ride;
                      Widget optionCard({
                        required String label,
                        required String assetPath,
                        required bool selected,
                        required VoidCallback onTap,
                      }) {
                        return GestureDetector(
                          onTap: onTap,
                          child: Container(
                            height: 104,
                            padding: const EdgeInsets.symmetric(
                              vertical: 8,
                              horizontal: 4,
                            ),
                            margin: const EdgeInsets.only(right: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: selected
                                    ? Colors.red
                                    : Colors.grey.shade300,
                                width: selected ? 2 : 1,
                              ),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    Image.asset(
                                      assetPath,
                                      height: 40,
                                      fit: BoxFit.contain,
                                    ),
                                    if (label.contains('Premium'))
                                      const Positioned(
                                        right: -8,
                                        top: -6,
                                        child: Icon(
                                          Icons.workspace_premium,
                                          color: Color(0xFFD4A017),
                                          size: 22,
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  label,
                                  maxLines: 2,
                                  textAlign: TextAlign.center,
                                  overflow: TextOverflow.ellipsis,
                                  style: context.bodySmall?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12,
                                    color: selected
                                        ? Colors.black
                                        : Colors.black54,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      return const CategoryTiles();
                    },
                  ),
                  const SizedBox(height: 16),
                  BlocBuilder<HomeBloc, HomeState>(
                    bloc: locator<HomeBloc>(),
                    builder: (context, homeState) {
                      void openWaypoints({required bool cargo}) {
                        selectedServiceIdNotifier.value = null;
                        premiumSelectedNotifier.value = false;
                        final bloc = locator<HomeBloc>();
                        bloc.add(cargo
                            ? const HomeEvent.onDeliveryOptionSelected()
                            : const HomeEvent.onRideOptionSelected());
                        bloc.add(const HomeEvent.changeOrderSubmissionPage(
                          orderSubmissionPage: OrderSubmissionPage.rideWaypointsInput,
                        ));
                      }
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          WhereAreYouGoingButton(
                            assetPath: 'assets/images/ev_auto_icon_small.png',
                            onPressed: () => openWaypoints(cargo: false),
                          ),
                        ],
                      );
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
                          isActive:
                              activePopularSearchNotifier.value == 'Bus Stand',
                          onTap: () => searchPopularPlace('Bus Stand'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _PopularPlaceCard(
                          title: 'Railway station',
                          assetPath:
                              'assets/images/popular_railway_station.jpg',
                          isActive:
                              activePopularSearchNotifier.value ==
                              'Railway station',
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
                              final match = RegExp(
                                r'([0-9]+\.?[0-9]*)\s*(km|m)',
                              ).firstMatch(label.toLowerCase());
                              if (match == null) return double.infinity;
                              final value =
                                  double.tryParse(match.group(1) ?? '') ??
                                  double.infinity;
                              return match.group(2) == 'm'
                                  ? value / 1000
                                  : value;
                            }

                            final currentAddress =
                                locator<LocationCubit>().state.place?.address;
                            final currentDistrict = extractDistrictFromAddress(
                              currentAddress,
                            );

                            var filteredPlaces = places;
                            if (currentDistrict != null &&
                                currentDistrict.isNotEmpty) {
                              filteredPlaces = places
                                  .where(
                                    (p) => (p.address ?? '')
                                        .toLowerCase()
                                        .contains(
                                          currentDistrict.toLowerCase(),
                                        ),
                                  )
                                  .toList();
                            }

                            filteredPlaces.sort((a, b) {
                              final da = parseKm(
                                locator<LocationCubit>().state.distanceTo(
                                  a.latLng,
                                  context,
                                ),
                              );
                              final db = parseKm(
                                locator<LocationCubit>().state.distanceTo(
                                  b.latLng,
                                  context,
                                ),
                              );
                              return da.compareTo(db);
                            });
                            final nearby = filteredPlaces.take(5).toList();

                            if (nearby.isEmpty) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                                child: Text(
                                  'No results found in ${currentDistrict ?? "your area"}',
                                  style: context.bodyMedium?.copyWith(
                                    color: ColorPalette.neutralVariant50,
                                  ),
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
                                      trailing: locator<LocationCubit>().state
                                          .distanceTo(place.latLng, context),
                                    ),
                                  )
                                  .separated(
                                    const Divider(
                                      thickness: 0.3,
                                      indent: 48,
                                      height: 16,
                                    ),
                                  ),
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
                    crossFadeState: isExpanded
                        ? CrossFadeState.showFirst
                        : CrossFadeState.showSecond,
                    secondChild: const SizedBox.shrink(),
                    firstChild:
                        BlocBuilder<
                          DestinationSuggestionsCubit,
                          DestinationSuggestionsState
                        >(
                          builder: (context, state) => AnimatedSwitcher(
                            duration:
                                AnimationDuration.pageStateTransitionMobile,
                            child: switch (state.destinationSuggesionsState) {
                              ApiResponseInitial() => const SizedBox.shrink(),
                              ApiResponseLoading() => Center(
                                child: Assets.lottie.loading.lottie(
                                  width: 100,
                                  height: 100,
                                ),
                              ),
                              ApiResponseLoaded() => Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Container(
                                    constraints: const BoxConstraints(
                                      maxHeight: double.infinity,
                                    ),
                                    child: ListView.separated(
                                      shrinkWrap: true,
                                      physics:
                                          const NeverScrollableScrollPhysics(),
                                      padding: EdgeInsets.zero,
                                      itemBuilder: (context, index) {
                                        final sug = state.destinationSuggestions!;
                                        final favs = sug.$1;
                                        final recents = _recentsNotSaved(sug);
                                        final isFav = index < favs.length;
                                        final Place place = isFav
                                            ? Place(LatLng(favs[index].location.lat, favs[index].location.lng), favs[index].details ?? favs[index].title, favs[index].title)
                                            : recents[index - favs.length];
                                        return PlaceResultItem(
                                          subtitle: place.address,
                                          title: place.title,
                                          isRecent: !isFav,
                                          isFavorite: isFav,
                                          onFavoriteToggle: () => _toggleSavedPlace(place, isFav ? favs[index].id : null, () => locator<DestinationSuggestionsCubit>().onStarted()),
                                          onPressed: () {
                                            final pickupLocation = widget.waypoints.firstOrNull ?? locator<LocationCubit>().state.place;
                                            if (pickupLocation == null) {
                                              context.showSnackBar(message: context.translate.pickupLocationNotFound);
                                              return;
                                            }
                                            locator<HomeBloc>().add(HomeEvent.showPreview(destination: place));
                                          },
                                        );
                                      },
                                      separatorBuilder: (context, index) => const Divider(indent: 42),
                                      itemCount: state.destinationSuggestions!.$1.length + _recentsNotSaved(state.destinationSuggestions!).length,
                                    ),
                                  ),
                                ],
                              ),
                              ApiResponseError(:final message) => Text(message),
                            },
                          ),
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
                      style: context.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Icon(
                    Icons.chevron_right,
                    color: isActive ? Colors.red : Colors.black45,
                    size: 18,
                  ),
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
                  child: const Icon(
                    Icons.image_not_supported_outlined,
                    color: Colors.grey,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


List<Place> _recentsNotSaved((List<Fragment$FavoriteLocation>, List<Place>) s) =>
    s.$2.where((p) => !s.$1.any((f) => f.title == (p.title ?? p.address))).toList();

Future<void> _toggleSavedPlace(Place place, String? favoriteId, VoidCallback refresh) async {
  debugPrint('[SAVED] tapped: ${place.title ?? place.address} favId=$favoriteId');
  try {
    final repo = locator<FavoriteLocationsRepository>();
    if (favoriteId != null) {
      final r = await repo.deleteFavoriteLocation(id: favoriteId);
    debugPrint('[SAVED] delete result: $r');
    } else {
      final r = await repo.addFavoriteLocation(
        input: UpdateFavoriteLocationInput(
          name: place.title ?? place.address,
          type: Enum$RiderAddressType.Other,
          place: place,
          phone: (Env.defaultCountry, _riderNumber()),
        ),
      );
    }
    debugPrint('[SAVED] done');
  } catch (e, st) {
    debugPrint('[SAVED] ERROR: $e');
    debugPrint('$st');
  }
  refresh();
}

String _riderNumber() {
  final m = locator<AuthBloc>().state.profile?.mobileNumber ?? '';
  final digits = m.replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return '0';
  return digits.length > 10 ? digits.substring(digits.length - 10) : digits;
}
