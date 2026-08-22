import 'package:api_response/api_response.dart';
import 'package:ridy/core/graphql/documents/calculate_fare.graphql.dart';

abstract class CouponRepository {
  Future<ApiResponse<Query$GetCouponInfo>> checkCouponValidity(String code);
}
