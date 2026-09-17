import 'package:auto_route/auto_route.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:ridy_driver/core/router/app_router.dart';

const _activeStatuses = {
  Enum$DriverStatus.Online,
  Enum$DriverStatus.Offline,
  Enum$DriverStatus.InService,
};

class LoginGuard extends AutoRouteGuard {
  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    final auth = locator<AuthBloc>();

    if (!auth.state.isAuthenticated) {
      resolver.redirectUntil(const AuthRoute());
      return;
    }

    var status = auth.state.authenticatedState?.profile.status;
    if (!_activeStatuses.contains(status)) {
      await auth.refreshProfileSilently();
      status = auth.state.authenticatedState?.profile.status;
    }

    if (_activeStatuses.contains(status)) {
      resolver.next(true);
    } else {
      resolver.redirectUntil(const AuthRoute());
    }
  }
}
