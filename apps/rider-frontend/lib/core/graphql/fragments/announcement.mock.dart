import 'package:time/time.dart';

import 'announcement.fragment.graphql.dart';

final mockAnnouncement1 = Fragment$Announcement(
  startAt: 500.hours.ago,
  expireAt: 200.hours.fromNow,
  title: "Get discounts with gifts!",
  description: "Lorem ipsum dolor sit amet, consetetur sadipscing voluptua. At vero eos et",
  url: "https://bettersuite.io",
);

final mockAnnouncement2 = Fragment$Announcement(
  startAt: 421.hours.ago,
  expireAt: 54.hours.fromNow,
  title: "Get rides with your favorite driver anytime they are around!",
  description:
      "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et",
  url: null,
);

final mockAnnouncement3 = Fragment$Announcement(
  startAt: 320.hours.ago,
  expireAt: 32.hours.fromNow,
  title: "You got 5 stars from 15 drivers!",
  description:
      "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquy",
  url: "https://bettersuite.io",
);

final mockAnnouncements = [mockAnnouncement1, mockAnnouncement2, mockAnnouncement3];
