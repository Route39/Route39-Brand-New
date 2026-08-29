import 'package:flutter/material.dart';

class Route39Header extends StatelessWidget {
  final VoidCallback? onBackPressed;
  final Widget? trailingAction;

  const Route39Header({super.key, this.onBackPressed, this.trailingAction});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: Icon(onBackPressed != null ? Icons.arrow_back : Icons.menu, color: Colors.black),
            onPressed: onBackPressed ?? () => Scaffold.of(context).openDrawer(),
          ),
          Image.asset(
            'assets/images/route39_logo.png',
            height: 20,
            fit: BoxFit.contain,
          ),
          Row(
            children: [
              if (trailingAction != null) trailingAction!,
              IconButton(
                icon: const Icon(Icons.notifications_none, color: Colors.black),
                onPressed: () {},
              ),
            ],
          ),
        ],
      ),
    );
  }
}
