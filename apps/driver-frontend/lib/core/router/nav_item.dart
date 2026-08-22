import 'package:auto_route/auto_route.dart';
import 'package:ridy_driver/config/env.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/gen/assets.gen.dart';
import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'app_router.dart';

enum NavItem {
  home,
  earnings,
  profile,
  announcements,
  wallet,
  rideHistory,
  signIn,
  settings,
  about,
  logout,
}

const signedInNavItems = [
  NavItem.earnings,
  NavItem.profile,
  NavItem.announcements,
  NavItem.wallet,
  NavItem.rideHistory,
  NavItem.settings,
  NavItem.about,
];

const signedOutNavItems = [
  NavItem.signIn,
  NavItem.settings,
  NavItem.about,
];

extension NavItemX on NavItem {
  String name(BuildContext context) {
    switch (this) {
      case NavItem.home:
        return context.translate.home;
      case NavItem.earnings:
        return context.translate.earnings;
      case NavItem.profile:
        return context.translate.profile;
      case NavItem.announcements:
        return context.translate.announcements;
      case NavItem.wallet:
        return context.translate.wallet;
      case NavItem.rideHistory:
        return context.translate.rideHistory;
      case NavItem.signIn:
        return context.translate.signInSignUp;
      case NavItem.settings:
        return context.translate.settings;
      case NavItem.about:
        return context.translate.about;
      case NavItem.logout:
        return context.translate.logout;
    }
  }

  IconData get icon => switch (this) {
        NavItem.home => Ionicons.home,
        NavItem.earnings => Icons.bar_chart,
        NavItem.profile => Ionicons.person,
        NavItem.announcements => Ionicons.megaphone,
        NavItem.wallet => Ionicons.wallet,
        NavItem.rideHistory => Ionicons.time,
        NavItem.signIn => Icons.login,
        NavItem.settings => Ionicons.settings,
        NavItem.about => Icons.info,
        NavItem.logout => Icons.logout
      };

  PageRouteInfo get route => switch (this) {
        NavItem.home => const HomeRoute(),
        NavItem.earnings => const EarningsRoute(),
        NavItem.profile => const ProfileParentRoute(),
        NavItem.wallet => const WalletParentRoute(),
        NavItem.rideHistory => const RideHistoryRoute(),
        NavItem.settings => const SettingsParentRoute(),
        NavItem.announcements => const AnnouncementsRoute(),
        NavItem.signIn => const AuthRoute(),
        NavItem.about => throw Exception('Invalid route'),
        NavItem.logout => throw Exception('Invalid route')
      };

  Future<void> onPressed(BuildContext context) async {
    //Navigator.pop(context);
    switch (this) {
      case NavItem.signIn:
        context.router.push(route);
        break;

      case NavItem.about:
        final platformInfo = await PackageInfo.fromPlatform();
        showAboutDialog(
          // ignore: use_build_context_synchronously
          context: context,
          applicationIcon: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Assets.images.logo.image(
              width: 100,
              height: 100,
            ),
          ),
          applicationVersion: "${platformInfo.version} (Build ${platformInfo.buildNumber})",
          applicationName: Env.appName,
          // ignore: use_build_context_synchronously
          applicationLegalese: context.translate.copyright_notice(
            Env.companyName,
          ),
        );
        break;

      case NavItem.logout:
        locator<AuthBloc>().onLoggedOut();
        context.router.replaceAll([const AuthRoute()]);
        break;

      default:
        context.router.push(route);
    }
  }
}
