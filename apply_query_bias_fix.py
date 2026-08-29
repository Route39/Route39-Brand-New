path = "apps/rider-frontend/lib/features/home/features/welcome/presentation/screens/where_are_you_going_sheet.dart"
with open(path, "r") as f:
    content = f.read()

changed = []

old_fn = """  void searchPopularPlace(String query) {
    activePopularSearchNotifier.value = query;
    placeLookupBloc.onStarted();
    final settingsState = locator<SettingsCubit>().state;
    final locationState = locator<LocationCubit>().state;
    placeLookupBloc.add(
      PlaceLookupEvent.onQueryChanged(
        query: query,
        latLng: locationState.place?.latLng ?? Constants.defaultLocation.latLng,
        radius: Env.placeSearchSearchRadius * 3,
        language: settingsState.locale,
        mapProvider: settingsState.mapProvider,
      ),
    );
  }"""

new_fn = """  String? extractDistrictFromAddress(String? address) {
    if (address == null) return null;
    final match = RegExp(r',\\s*([A-Za-z\\s]+?),\\s*Tamil\\s*Nadu', caseSensitive: false).firstMatch(address);
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
  }"""

if old_fn in content:
    content = content.replace(old_fn, new_fn, 1)
    changed.append("query_bias")
else:
    print("MARKER NOT FOUND - manual fix needed")

with open(path, "w") as f:
    f.write(content)
print("changed:", changed)
