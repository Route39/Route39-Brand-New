import 'package:api_response/api_response.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:generic_map/interfaces/place.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/graphql/documents/home.graphql.dart';
import 'package:ridy/core/graphql/fragments/favorite_location.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/point.extensions.dart';
import 'package:ridy/features/home/features/welcome/domain/repositories/new_order_repository.dart';

part 'destination_suggestions.state.dart';
part 'destination_suggestions.bloc.freezed.dart';

@lazySingleton
class DestinationSuggestionsCubit extends Cubit<DestinationSuggestionsState> {
  final NewOrderRepository repository;

  DestinationSuggestionsCubit(this.repository) : super(const DestinationSuggestionsState());

  void onStarted() async {
    emit(
      state.copyWith(
        destinationSuggesionsState: ApiResponse.loading(),
      ),
    );

    final destinationSuggestionsResponse = await repository.getDestinationSuggestions();

    emit(
      state.copyWith(
        destinationSuggesionsState: destinationSuggestionsResponse,
      ),
    );
  }
}
