import 'package:auto_route/auto_route.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/blocs/onboarding_cubit.dart';
import 'package:ridy_driver/core/router/app_router.dart';
import 'package:ridy_driver/features/auth/domain/entities/login_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/extensions/extensions.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';

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
                // A driver who is already active (Online/Offline/InService)
                // has completed onboarding in a previous session; skip the
                // onboarding/under-review flow entirely and go straight home.
                final status = state.profile?.status;
                if (status == Enum$DriverStatus.Online ||
                    status == Enum$DriverStatus.Offline ||
                    status == Enum$DriverStatus.InService) {
                  locator<OnboardingCubit>().skip();
                  locator<LoginBloc>().clear();
                  locator<LoginBloc>().reset();
                  context.router.replaceAll([const HomeRoute()]);
                }
              },
            ),
            BlocListener<LoginBloc, LoginState>(
              listenWhen: (previous, current) =>
                  previous.selectedCity != current.selectedCity ||
                  previous.selectedVehicleType != current.selectedVehicleType,
              listener: (context, state) {
                final onboardingExtrasDone = state.selectedCity != null && state.selectedVehicleType != null;
                if (onboardingExtrasDone) {
                  locator<OnboardingCubit>().skip();
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
