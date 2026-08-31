import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/config/router/app_router.dart';

class Route39NavBar extends StatelessWidget {
  final int currentIndex;
  const Route39NavBar({super.key, this.currentIndex = 0});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavBarItem(
                icon: Icons.home,
                label: 'HOME',
                isActive: currentIndex == 0,
                onTap: () {
                  if (currentIndex != 0) context.router.popUntilRoot();
                },
              ),
              _NavBarItem(
                icon: Icons.history,
                label: 'RIDE HISTORY',
                isActive: currentIndex == 1,
                onTap: () {
                  if (currentIndex != 1) context.router.push(const RideHistoryRoute());
                },
              ),
              _NavBarItem(
                icon: Icons.event_note,
                label: 'SCHEDULED',
                isActive: currentIndex == 2,
                onTap: () {
                  if (currentIndex != 2) context.router.push(const ScheduledRidesRoute());
                },
              ),
              _NavBarItem(
                icon: Icons.account_balance_wallet_outlined,
                label: 'WALLET',
                isActive: currentIndex == 3,
                onTap: () {
                  if (currentIndex != 3) context.router.push(const WalletParentRoute());
                },
              ),
              _NavBarItem(
                icon: Icons.person,
                label: 'PROFILE',
                isActive: currentIndex == 4,
                onTap: () {
                  if (currentIndex != 4) context.router.push(const ProfileParentRoute());
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavBarItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  const _NavBarItem({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = isActive ? ColorPalette.primary40 : ColorPalette.neutralVariant50;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
