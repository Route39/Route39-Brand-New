import 'package:auto_route/auto_route.dart';
import 'package:ridy/config/router/app_router.dart';
import 'package:flutter/material.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/features/home/presentation/components/route39_nav_bar.dart';
import 'package:ridy/features/home/features/order_preview/presentation/components/route39_header.dart';
import 'package:ridy/features/wallet/presentation/components/wallet_activities.dart';
import 'package:ridy/features/wallet/presentation/components/wallet_header.dart';
import 'package:ridy/features/wallet/presentation/components/wallet_payment_method.dart';

class WalletScreenMobile extends StatelessWidget {
  const WalletScreenMobile({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.theme.scaffoldBackgroundColor,
      bottomNavigationBar: const Route39NavBar(currentIndex: 3),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Route39Header(
                onBackPressed: () {
                  context.router.navigate(const HomeRoute());
                },
              ),
            ),
            const WalletHeader(),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: WalletPaymentMethod(),
            ),
            const Expanded(child: WalletActivities()),
          ],
        ),
      ),
    );
  }
}
