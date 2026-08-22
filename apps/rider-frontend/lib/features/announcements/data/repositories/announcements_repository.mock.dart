import 'package:api_response/api_response.dart';
import 'package:ridy/core/graphql/documents/announcements.graphql.dart';
import 'package:ridy/core/graphql/fragments/announcement.fragment.graphql.dart';
import '../../domain/repositories/announcements_repository.dart';
import 'package:injectable/injectable.dart';

@dev
@LazySingleton(as: AnnouncementsRepository)
class AnnouncementsRepositoryMock implements AnnouncementsRepository {
  @override
  Future<ApiResponse<Query$Announcements>> getAnnouncements() async {
    await Future.delayed(const Duration(seconds: 1));

    return ApiResponse.loaded(
      Query$Announcements(
        announcements: [
          Fragment$Announcement(
            title: "Get discounts with gifts!",
            description: "Lorem ipsum dolor sit amet, consetetur sadipscing voluptua. At vero eos et",
            url: null,
            startAt: DateTime.now().subtract(
              Duration(days: 4),
            ),
            expireAt: DateTime.now().add(
              Duration(days: 4),
            ),
          ),
          Fragment$Announcement(
            title: "Get rides with your favorite driver anytime they are around!",
            description:
                "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et",
            url: null,
            startAt: DateTime.now().subtract(
              Duration(days: 3),
            ),
            expireAt: DateTime.now().add(
              Duration(days: 3),
            ),
          ),
          Fragment$Announcement(
            title: "You got 5 stars from 15 drivers!",
            description:
                "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquy",
            url: "https://ridy.io",
            startAt: DateTime.now().subtract(
              Duration(days: 2),
            ),
            expireAt: DateTime.now().add(
              Duration(days: 2),
            ),
          )
        ],
      ),
    );
  }
}
