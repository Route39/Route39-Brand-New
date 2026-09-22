import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:intl/intl.dart';
import 'package:ionicons/ionicons.dart';
import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:ridy_driver/features/notifications/data/notification_history_repository.dart';
import 'package:ridy_driver/features/ride_history/domain/repositories/ride_history_repository.dart';
import 'package:get_it/get_it.dart';

@RoutePage()
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationHistoryRepository _historyRepository =
      NotificationHistoryRepository();

  final RideHistoryRepository _rideHistoryRepository =
      GetIt.I<RideHistoryRepository>();

  List<Map<String, dynamic>> _notifications = [];
  bool _loading = true;

  String _notificationTitle(String type) {
    return switch (type) {
      'RiderCanceled' => 'Ride cancelled',
      'RateRider' => 'Rate your rider',
      'AddPayoutMethod' => 'Add a payout method',
      'RideReceived' => 'New ride request',
      'RideCompleted' => 'Ride completed',
      'RideCancelled' => 'Ride cancelled',
      _ => 'Notification',
    };
  }

  String _rideTitle(Enum$OrderStatus status) {
    return switch (status) {
      Enum$OrderStatus.Finished => 'Ride completed',
      Enum$OrderStatus.RiderCanceled => 'Ride cancelled by rider',
      Enum$OrderStatus.DriverCanceled => 'Ride cancelled',
      Enum$OrderStatus.Expired => 'Ride expired',
      _ => 'Ride activity',
    };
  }

  String _body(Map<String, dynamic> item) {
    final riderName = item['riderFullName'] as String?;
    final serviceName = item['serviceName'] as String?;
    final amount = item['amount'];

    final parts = <String>[];

    if (riderName != null && riderName.isNotEmpty) {
      parts.add('Rider: $riderName');
    }

    if (serviceName != null && serviceName.isNotEmpty) {
      parts.add(serviceName);
    }

    if (amount != null) {
      parts.add('₹$amount');
    }

    return parts.join(' • ');
  }

  String _time(DateTime date) {
    return DateFormat('hh:mm a').format(date);
  }

  Future<void> _loadNotifications() async {
    try {
      final saved = await _historyRepository.getNotifications();
      final rideHistoryResponse = await _rideHistoryRepository.getRideHistory();

      final combined = <Map<String, dynamic>>[...saved];

      if (rideHistoryResponse is ApiResponseLoaded &&
          rideHistoryResponse.data != null) {
        for (final order in rideHistoryResponse.data!.pastOrders) {
          combined.add({
            'messageId': 'ride-${order.id}',
            'type': 'RideHistory',
            'title': _rideTitle(order.status),
            'body': order.rider.firstName ?? order.serviceName,
            'createdAt': order.createdAt.toIso8601String(),
          });
        }
      }

      final seen = <String>{};
      combined.retainWhere((item) {
        final id = '${item['messageId']}';
        if (seen.contains(id)) return false;
        seen.add(id);
        return true;
      });

      combined.sort((a, b) {
        final aDate = DateTime.tryParse('${a['createdAt']}');
        final bDate = DateTime.tryParse('${b['createdAt']}');

        if (aDate == null || bDate == null) return 0;
        return bDate.compareTo(aDate);
      });

      if (!mounted) return;

      setState(() {
        _notifications = combined;
        _loading = false;
      });
    } catch (_) {
      final saved = await _historyRepository.getNotifications();

      if (!mounted) return;

      setState(() {
        _notifications = saved;
        _loading = false;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: () => context.router.pop(),
                    icon: const Icon(Icons.arrow_back),
                    color: ColorPalette.neutral50,
                  ),
                  const SizedBox(width: 4),
                  const Text(
                    'Notifications',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : _notifications.isEmpty
                    ? const Center(
                        child: Text(
                          'No notifications yet',
                          style: TextStyle(
                            fontSize: 15,
                            color: ColorPalette.neutral50,
                          ),
                        ),
                      )
                    : ListView.separated(
                        itemCount: _notifications.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final item = _notifications[index];

                          final type =
                              item['type'] as String? ?? 'Notification';

                          final title = type == 'RideHistory'
                              ? item['title'] as String? ?? 'Ride activity'
                              : _notificationTitle(type);

                          final body = type == 'RideHistory'
                              ? item['body'] as String? ?? ''
                              : _body(item);

                          final createdAt = DateTime.tryParse(
                            '${item['createdAt']}',
                          );

                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              vertical: 8,
                            ),
                            leading: const CircleAvatar(
                              backgroundColor: ColorPalette.primary95,
                              child: Icon(
                                Ionicons.notifications,
                                color: ColorPalette.primary40,
                              ),
                            ),
                            title: Text(
                              title,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: Colors.black,
                              ),
                            ),
                            subtitle: body.isEmpty
                                ? null
                                : Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(
                                      body,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: ColorPalette.neutral50,
                                      ),
                                    ),
                                  ),
                            trailing: createdAt == null
                                ? null
                                : Text(
                                    _time(createdAt),
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: ColorPalette.neutral60,
                                    ),
                                  ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
