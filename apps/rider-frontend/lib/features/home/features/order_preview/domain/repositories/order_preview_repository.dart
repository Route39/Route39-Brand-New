import 'package:api_response/api_response.dart';
import 'package:ridy/core/graphql/documents/track_order.graphql.dart';
import 'package:ridy/core/graphql/schema.gql.dart';

abstract class OrderPreviewRepository {
  Future<ApiResponse<Mutation$CreateOrder>> submitOrder({
    required Input$CreateOrderInput args,
  });
}
