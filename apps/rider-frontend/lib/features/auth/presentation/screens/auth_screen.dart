import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/config/router/app_router.dart';
import 'package:ridy/core/blocs/auth_bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/features/auth/presentation/blocs/login.bloc.dart';
import 'package:ridy/features/auth/presentation/blocs/onboarding_cubit.dart';
import 'package:ridy/features/auth/presentation/screens/auth_screen.desktop.dart';
import 'package:ridy/features/auth/presentation/screens/auth_screen.mobile.dart';

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
          BlocProvider.value(
            value: locator<OnboardingCubit>(),
          ),
          BlocProvider.value(
            value: locator<LoginBloc>(),
          )
        ],
        child: BlocListener<LoginBloc, LoginState>(
          listener: (context, state) {
            if (state.jwtToken != null) {
              locator<AuthBloc>().onLoggedIn(
                jwtToken: state.jwtToken!,
                profile: state.profile!,
              );
            }

            switch (state.loginPage) {
              case LoginPage$Success():
                locator<LoginBloc>().reset();
                locator<OnboardingCubit>().skip();
                context.router.replaceAll([const HomeRoute()]);
                break;

              default:
                break;
            }
          },
          child: context.responsive(
            BlocBuilder<OnboardingCubit, int>(
                builder: (context, stateOnboarding) {
              return onboardingCubit.isDone
                  ? const AuthScreenMobile()
                  : const OnboardingScreen();
            }),
            xl: const AuthScreenDesktop(),
          ),
        ),
      ),
    );
  }
}
