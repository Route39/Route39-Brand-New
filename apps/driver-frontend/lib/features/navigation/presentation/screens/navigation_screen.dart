import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';

import 'navigation_screen.desktop.dart';
import 'navigation_screen.mobile.dart';

@RoutePage()
class NavigationScreen extends StatelessWidget {
  const NavigationScreen({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: locator<AuthBloc>(),
      child: Scaffold(
        body: context.responsive(
          const NavigationScreenMobile(
            child: AutoRouter(),
          ),
          xl: const NavigationScreenDesktop(
            child: AutoRouter(),
          ),
        ),
      ),
    );
  }
}
