import 'package:ridy/core/graphql/fragments/chat_message.fragment.graphql.dart';
import 'package:time/time.dart';

final mockChatMessage1 = Fragment$ChatMessage(
  message: 'Hello, I\'m outside your location.',
  isFromMe: true,
  createdAt: 5.hours.ago,
);

final mockChatMessage2 = Fragment$ChatMessage(
  message: 'Okay, I\'ll be waiting outside near the entrance.',
  isFromMe: false,
  createdAt: 4.hours.ago,
);

final mockChatMessage3 = Fragment$ChatMessage(
  message: 'Please be careful, it\'s raining heavily today.',
  isFromMe: true,
  createdAt: 3.hours.ago,
);

final mockChatMessage4 = Fragment$ChatMessage(
  message: 'Thanks for the ride! Have a great day.',
  isFromMe: false,
  createdAt: 1.hours.ago,
);

final mockChatMessages = [
  mockChatMessage1,
  mockChatMessage2,
  mockChatMessage3,
  mockChatMessage4,
];
