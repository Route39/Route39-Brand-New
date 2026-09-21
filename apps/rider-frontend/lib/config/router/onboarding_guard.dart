import 'package:auto_route/auto_route.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/config/router/app_router.dart';
import 'package:ridy/core/blocs/auth_bloc.dart';
import 'package:ridy/features/auth/presentation/blocs/onboarding_cubit.dart';

class OnboardingGuard extends AutoRouteGuard {
  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) {
    final onboardingDone = locator<OnboardingCubit>().isDone;
    final isAuthenticated = locator<AuthBloc>().state is AuthState$Authenticated;

    if (onboardingDone && isAuthenticated) {
      // onboarding seen AND user is logged in — continue to home
      resolver.next(true);
    } else {
      // not logged in (or onboarding not done) — go to login page
      resolver.redirectUntil(const AuthRoute());
    }
  }
}
