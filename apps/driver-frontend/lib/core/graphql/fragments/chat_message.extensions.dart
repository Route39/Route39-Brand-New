import 'package:ridy_driver/core/graphql/fragments/chat_message.fragment.graphql.dart';
import 'package:flutter_common/features/chat/chat.dart';

extension ChatMessageX on Fragment$ChatMessage {
  ChatMessageEntity get toEntity {
    return ChatMessageEntity(
      id: createdAt.toString(),
      message: message,
      createdAt: createdAt,
      isSender: isFromMe,
    );
  }
}

extension ChatMessageListX on List<Fragment$ChatMessage> {
  List<ChatMessageEntity> get toEntity {
    return map(
      (e) => e.toEntity,
    ).toList();
  }
}
