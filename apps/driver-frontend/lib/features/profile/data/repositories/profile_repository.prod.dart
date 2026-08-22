import 'package:api_response/api_response.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy_driver/core/graphql/documents/profile.graphql.dart';
import 'package:ridy_driver/core/datasources/graphql_datasource.dart';
import 'package:ridy_driver/features/profile/domain/repositories/profile_repository.dart';

@prod
@LazySingleton(as: ProfileRepository)
class ProfileRepositoryProd implements ProfileRepository {
  final GraphqlDatasource graphqlDatasource;

  ProfileRepositoryProd(this.graphqlDatasource);

  @override
  Future<ApiResponse<Query$ProfileAggregations>> getProfileAggregationsInfo() async {
    final profileAggregationsInfoResponse = await graphqlDatasource.query(
      Options$Query$ProfileAggregations(),
    );
    return profileAggregationsInfoResponse;
  }

  @override
  Future<ApiResponse<Query$FeedbacksSummary>> getFeedbacksSummary() async {
    final feedbacksSummaryResponse = await graphqlDatasource.query(Options$Query$FeedbacksSummary());
    return feedbacksSummaryResponse;
  }
}
