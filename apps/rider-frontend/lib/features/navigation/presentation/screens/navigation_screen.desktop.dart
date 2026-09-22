import 'package:auto_route/auto_route.dart';
import 'dart:ui';

import 'package:better_localization/country_code/phone_number.extensions.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/config/env.dart';
import 'package:ridy/core/blocs/auth_bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/avatars/app_avatar_compact.dart';
import 'package:ridy/core/graphql/fragments/profile.extensions.dart';
import 'package:ridy/core/presentation/app_drawer.dart';
import 'package:ridy/config/router/app_router.dart';

class NavigationScreenDesktop extends StatefulWidget {
  final Widget child;

  const NavigationScreenDesktop({super.key, required this.child});

  @override
  State<NavigationScreenDesktop> createState() =>
      _NavigationScreenDesktopState();
}

class _NavigationScreenDesktopState extends State<NavigationScreenDesktop> {
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 96),
                child: AppDrawer(showHeader: false, scaffoldKey: null),
              ),
              Expanded(child: widget.child),
            ],
          ),
        ),
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          height: 96,
          child: ClipRRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0x99FDFCFF),
                  border: Border.all(color: ColorPalette.neutral90, width: 1.5),
                ),
                child: BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, state) {
                    return SafeArea(
                      bottom: false,
                      child: Row(
                        children: [
                          Image.asset(
                            'assets/images/route39_logo.png',
                            filterQuality: FilterQuality.high,
                            height: 32,
                          ),
                          const Spacer(),
                          Badge(
                            isLabelVisible: false,
                            label: const Text("0"),
                            child: CupertinoButton(
                              padding: const EdgeInsets.all(0),
                              onPressed: () {
                                context.router.push(
                                  const NotificationHistoryRoute(),
                                );
                              },
                              minimumSize: const Size(0, 0),
                              child: const Icon(
                                Ionicons.notifications,
                                color: ColorPalette.neutral70,
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(switch (state) {
                                AuthState$Authenticated(:final profile) =>
                                  profile.fullName,
                                AuthState$Unauthenticated() => "Guest",
                              }, style: context.labelMedium),
                              switch (state) {
                                AuthState$Authenticated(:final profile) => Text(
                                  profile.mobileNumber.formatPhoneNumber(
                                    profile.countryIso,
                                  ),
                                  style: context.bodySmall,
                                ),
                                AuthState$Unauthenticated() => const SizedBox(),
                              },
                            ],
                          ),
                          const SizedBox(width: 16),
                          AppAvatarCompact(
                            url: state.avatar,
                            defaultAvatarPath: Env.defaultAvatar,
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
