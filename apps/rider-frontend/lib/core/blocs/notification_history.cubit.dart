import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:injectable/injectable.dart';

class NotificationItem {
  final String title;
  final String body;
  final DateTime createdAt;

  NotificationItem({
    required this.title,
    required this.body,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'title': title,
        'body': body,
        'createdAt': createdAt.toIso8601String(),
      };

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      title: json['title'] as String,
      body: json['body'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

@singleton
class NotificationHistoryCubit extends HydratedCubit<List<NotificationItem>> {
  NotificationHistoryCubit() : super([]);

  void add(String title, String body) {
    emit([
      NotificationItem(title: title, body: body, createdAt: DateTime.now()),
      ...state,
    ]);
  }

  void clearAll() => emit([]);

  @override
  List<NotificationItem>? fromJson(Map<String, dynamic> json) {
    final list = json['items'] as List<dynamic>?;
    if (list == null) return [];
    return list.map((e) => NotificationItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Map<String, dynamic>? toJson(List<NotificationItem> state) {
    return {'items': state.map((e) => e.toJson()).toList()};
  }
}
