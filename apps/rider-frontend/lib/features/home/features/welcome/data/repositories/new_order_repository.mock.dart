import 'package:api_response/api_response.dart';
import 'package:ridy/core/graphql/documents/home.graphql.dart';
import 'package:ridy/core/graphql/fragments/favorite_location.mock.dart';
import '../../../welcome/domain/repositories/new_order_repository.dart';
import 'package:injectable/injectable.dart';

@dev
@LazySingleton(as: NewOrderRepository)
class NewOrderRepositoryMock implements NewOrderRepository {
  @override
  Future<ApiResponse<Query$DestinationSuggesions>> getDestinationSuggestions() async {
    return ApiResponse.loaded(
      Query$DestinationSuggesions(favoriteLocations: mockFavoriteLocations, recentDestinations: []),
    );
  }
}
