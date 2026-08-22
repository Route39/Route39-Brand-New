import 'package:api_response/api_response.dart';
import 'package:ridy/core/graphql/documents/home.graphql.dart';

abstract class NewOrderRepository {
  Future<ApiResponse<Query$DestinationSuggesions>> getDestinationSuggestions();
}
