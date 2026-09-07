import 'dart:ui';

import 'package:better_localization/country_code/phone_number.extensions.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/avatars/app_avatar_compact.dart';
import 'package:ridy_driver/core/presentation/app_drawer.dart';
import 'package:ridy_driver/gen/assets.gen.dart';

class NavigationScreenDesktop extends StatefulWidget {
  final Widget child;

  const NavigationScreenDesktop({super.key, required this.child});

  @override
  State<NavigationScreenDesktop> createState() => _NavigationScreenDesktopState();
}

class _NavigationScreenDesktopState extends State<NavigationScreenDesktop> {
  // final OverlayPortalController _overlayPortalController = OverlayPortalController();
  // final LayerLink _link = LayerLink();

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const AppDrawer(showHeader: false, scaffoldKey: null),
        Expanded(child: widget.child),
      ],
    );
  }
}
