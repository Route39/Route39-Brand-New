part of 'destination_suggestions.bloc.dart';

@freezed
sealed class DestinationSuggestionsState with _$DestinationSuggestionsState {
  const factory DestinationSuggestionsState({
    @Default(ApiResponseInitial()) ApiResponse<Query$DestinationSuggesions> destinationSuggesionsState,
  }) = _DestinationSuggestionsState;

  const DestinationSuggestionsState._();

  (List<Fragment$FavoriteLocation>, List<Place>)? get destinationSuggestions {
    switch (destinationSuggesionsState) {
      case ApiResponseLoaded<Query$DestinationSuggesions>(data: final data):
        final favorites = data.favoriteLocations.toList();
        final places = data.recentDestinations.toPlaces;
        return (favorites, places);
      default:
        return null;
    }
  }
}
