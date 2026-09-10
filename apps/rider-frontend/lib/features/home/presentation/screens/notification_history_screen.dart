import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/notification_history.cubit.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_top_bar.dart';
import 'package:ridy/features/home/presentation/components/route39_nav_bar.dart';

@RoutePage()
class NotificationHistoryScreen extends StatelessWidget {
  const NotificationHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const Route39NavBar(currentIndex: 0),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppTopBar(title: 'Notifications'),
              const SizedBox(height: 16),
              Expanded(
                child: BlocBuilder<NotificationHistoryCubit, List<NotificationItem>>(
                  bloc: locator<NotificationHistoryCubit>(),
                  builder: (context, items) {
                    if (items.isEmpty) {
                      return Center(
                        child: Text(
                          'No notifications yet',
                          style: context.bodyMedium,
                        ),
                      );
                    }
                    return ListView.separated(
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const Divider(),
                      itemBuilder: (context, index) {
                        final item = items[index];
                        return ListTile(
                          leading: const Icon(Icons.notifications_none),
                          title: Text(item.title, style: context.bodyMedium?.copyWith(fontWeight: FontWeight.w700)),
                          subtitle: Text(item.body),
                          trailing: Text(
                            DateFormat('hh:mm a').format(item.createdAt),
                            style: context.labelSmall,
                          ),
                        );
                      },
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
