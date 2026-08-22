import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/documents/profile.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy_driver/features/profile/domain/repositories/profile_repository.dart';

@dev
@LazySingleton(as: ProfileRepository)
class ProfileRepositoryMock implements ProfileRepository {
  @override
  Future<ApiResponse<Query$ProfileAggregations>> getProfileAggregationsInfo() async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded(
      Query$ProfileAggregations(
        driverPerformance: Fragment$DriverPerformance(totalRides: 400, acceptanceRate: 32, distanceTraveled: 150),
      ),
    );
  }

  @override
  Future<ApiResponse<Query$FeedbacksSummary>> getFeedbacksSummary() async {
    await Future.delayed(const Duration(seconds: 1));
    return ApiResponse.loaded(
      Query$FeedbacksSummary(
        feedbacksSummary: Query$FeedbacksSummary$feedbacksSummary(
          averageRating: 23,
          goodPoints: [
            "Great vehicle condition",
            "Good routing",
            "Polite",
          ],
          badPoints: ['Unsafe driving'],
          goodReviews: [
            Query$FeedbacksSummary$feedbacksSummary$goodReviews(
              serviceName: 'Economy',
              rating: 4.5,
              review: 'Excellence driving and a very good car condition one of the best rides I have ever had',
              goodPoints: [
                "Good routing",
                "Polite",
              ],
            ),
          ],
        ),
      ),
    );
  }
}
