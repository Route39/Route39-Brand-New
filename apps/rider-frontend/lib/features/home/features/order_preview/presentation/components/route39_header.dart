import 'package:flutter/material.dart';
import 'package:auto_route/auto_route.dart';
import 'package:ridy/config/router/app_router.dart';

class Route39Header extends StatelessWidget {
  final VoidCallback? onBackPressed;
  final Widget? trailingAction;
  final bool showLeading;

  const Route39Header({super.key, this.onBackPressed, this.trailingAction, this.showLeading = true});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          showLeading
              ? IconButton(
                  icon: Icon(onBackPressed != null ? Icons.arrow_back : Icons.menu, color: Colors.black),
                  onPressed: onBackPressed ?? () => Scaffold.of(context).openDrawer(),
                )
              : const SizedBox(width: 48),
          Flexible(
            child: Image.asset(
            'assets/images/route39_logo.png',
            height: 28,
            fit: BoxFit.contain,
            ),
          ),
          Row(
            children: [
              if (trailingAction != null) trailingAction!,
              IconButton(
                icon: const Icon(Icons.notifications_none, color: Colors.black),
                onPressed: () {
                  context.router.push(const NotificationHistoryRoute());
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
