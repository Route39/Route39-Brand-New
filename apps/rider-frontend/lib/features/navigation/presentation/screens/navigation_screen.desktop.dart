import 'dart:ui';

import 'package:better_localization/country_code/phone_number.extensions.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/config/env.dart';
import 'package:ridy/core/blocs/auth_bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/avatars/app_avatar_compact.dart';
import 'package:ridy/core/graphql/fragments/profile.extensions.dart';
import 'package:ridy/core/presentation/app_drawer.dart';
import 'package:ridy/features/announcements/presentation/screens/announcements_screen.dart';
import 'package:ridy/gen/assets.gen.dart';

class NavigationScreenDesktop extends StatefulWidget {
  final Widget child;

  const NavigationScreenDesktop({super.key, required this.child});

  @override
  State<NavigationScreenDesktop> createState() => _NavigationScreenDesktopState();
}

class _NavigationScreenDesktopState extends State<NavigationScreenDesktop> {
  final OverlayPortalController _overlayPortalController = OverlayPortalController();
  final LayerLink _link = LayerLink();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Padding(padding: EdgeInsets.only(top: 96), child: AppDrawer(showHeader: false, scaffoldKey: null)),
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
                            dotenv.maybeGet('HEADER_LOGO') ?? Assets.images.logoHeader.path,
                            filterQuality: FilterQuality.high,
                            height: 40,
                          ),
                          const Spacer(),
                          OverlayPortal(
                            overlayChildBuilder: (context) {
                              return CompositedTransformFollower(
                                targetAnchor: Alignment.bottomCenter,
                                followerAnchor: Alignment.topCenter,
                                link: _link,
                                child: Align(
                                  alignment: AlignmentDirectional.topCenter,
                                  child: Container(
                                    margin: const EdgeInsets.only(top: 8, right: 50),
                                    width: 400,
                                    height: context.height * 0.7,
                                    clipBehavior: Clip.hardEdge,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: const [
                                        BoxShadow(color: Color(0x1464748B), offset: Offset(2, 4), blurRadius: 8),
                                      ],
                                    ),
                                    child: const AnnouncementsScreen(),
                                  ),
                                ),
                              );
                            },
                            controller: _overlayPortalController,
                            child: CompositedTransformTarget(
                              link: _link,
                              child: Badge(
                                isLabelVisible: false,
                                label: const Text("0"),
                                child: CupertinoButton(
                                  padding: const EdgeInsets.all(0),
                                  onPressed: () {
                                    if (_overlayPortalController.isShowing) {
                                      _overlayPortalController.hide();
                                    } else {
                                      _overlayPortalController.show();
                                      //locator<NotificationsBloc>().markNotificationsAsRead();
                                    }
                                  },
                                  minimumSize: Size(0, 0),
                                  child: const Icon(Ionicons.notifications, color: ColorPalette.neutral70),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(switch (state) {
                                AuthState$Authenticated(:final profile) => profile.fullName,
                                AuthState$Unauthenticated() => "Guest",
                              }, style: context.labelMedium),
                              switch (state) {
                                AuthState$Authenticated(:final profile) => Text(
                                  profile.mobileNumber.formatPhoneNumber(profile.countryIso),
                                  style: context.bodySmall,
                                ),
                                AuthState$Unauthenticated() => const SizedBox(),
                              },
                            ],
                          ),
                          const SizedBox(width: 16),
                          AppAvatarCompact(url: state.avatar, defaultAvatarPath: Env.defaultAvatar),
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
