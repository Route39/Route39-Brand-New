import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'package:auto_route/auto_route.dart';
import 'package:ridy/config/router/app_router.dart';

class Route39Header extends StatelessWidget {
  final VoidCallback? onBackPressed;
  final Widget? trailingAction;
  final bool showLeading;

  const Route39Header({super.key, this.onBackPressed, this.trailingAction, this.showLeading = true});

  String get _supportPhone => dotenv.maybeGet('SUPPORT_PHONE') ?? '';

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          SizedBox(
            width: 96,
            child: Align(
              alignment: Alignment.centerLeft,
              child: showLeading
              ? IconButton(
                  icon: Icon(onBackPressed != null ? Icons.arrow_back : Icons.menu, color: Colors.black),
                  onPressed: onBackPressed ?? () => Scaffold.of(context).openDrawer(),
                )
              : const SizedBox(width: 48),
            ),
          ),
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
              if (_supportPhone.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.support_agent, color: Colors.black),
                  tooltip: 'Call support',
                  onPressed: () => launchUrlString('tel:$_supportPhone'),
                ),
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
