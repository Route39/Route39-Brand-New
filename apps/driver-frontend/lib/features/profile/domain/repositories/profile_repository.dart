import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/documents/profile.graphql.dart';

abstract class ProfileRepository {
  Future<ApiResponse<Query$ProfileAggregations>> getProfileAggregationsInfo();

  Future<ApiResponse<Query$FeedbacksSummary>> getFeedbacksSummary();
}
