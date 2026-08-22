import 'package:auto_route/auto_route.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/blocs/onboarding_cubit.dart';
import 'package:ridy_driver/core/router/app_router.dart';
import 'package:ridy_driver/features/auth/domain/entities/login_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/extensions/extensions.dart';

import '../blocs/login.bloc.dart';
import 'auth_screen.desktop.dart';
import 'auth_screen.mobile.dart';
import 'onboarding_screen.mobile.dart';

@RoutePage()
class AuthScreen extends StatelessWidget {
  const AuthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final onboardingCubit = locator<OnboardingCubit>();
    return PopScope(
      canPop: false,
      child: MultiBlocProvider(
        providers: [
          BlocProvider.value(value: locator<OnboardingCubit>()),
          BlocProvider.value(value: locator<LoginBloc>()),
        ],
        child: MultiBlocListener(
          listeners: [
            BlocListener<LoginBloc, LoginState>(
              listenWhen: (previous, current) => previous.jwtToken == null && current.jwtToken != null,
              listener: (context, state) {
                locator<AuthBloc>().onLoggedIn(jwtToken: state.jwtToken!, profile: state.profile!);
              },
            ),
            BlocListener<LoginBloc, LoginState>(
              listenWhen: (previous, current) => previous.loginPage != current.loginPage,
              listener: (context, state) {
                switch (state.loginPage) {
                  case LoginPage.success:
                    locator<OnboardingCubit>().skip();
                    locator<LoginBloc>().clear();
                    locator<LoginBloc>().reset();
                    context.router.replaceAll([const HomeRoute()]);
                    break;

                  default:
                    break;
                }
              },
            ),
          ],
          child: context.responsive(
            BlocBuilder<OnboardingCubit, int>(
              builder: (context, stateOnboarding) {
                return onboardingCubit.isDone ? const AuthScreenMobile() : const OnboardingScreen();
              },
            ),
            xl: const AuthScreenDesktop(),
          ),
        ),
      ),
    );
  }
}
