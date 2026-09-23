import 'package:hive_flutter/hive_flutter.dart';

class NotificationHistoryRepository {
  static const String _boxName = 'driver_notification_history';

  Future<Box> _box() async {
    if (Hive.isBoxOpen(_boxName)) {
      return Hive.box(_boxName);
    }
    return Hive.openBox(_boxName);
  }

  Future<void> saveNotifications(
    List<Map<String, dynamic>> notifications,
  ) async {
    if (notifications.isEmpty) return;

    final box = await _box();

    for (final notification in notifications) {
      final messageId = notification['messageId'];
      if (messageId == null) continue;

      await box.put(messageId.toString(), notification);
    }
  }

  Future<List<Map<String, dynamic>>> getNotifications() async {
    final box = await _box();

    final items = box.values
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();

    items.sort((a, b) {
      final aDate = DateTime.tryParse('${a['createdAt']}');
      final bDate = DateTime.tryParse('${b['createdAt']}');

      if (aDate == null || bDate == null) return 0;
      return bDate.compareTo(aDate);
    });

    return items;
  }
}
