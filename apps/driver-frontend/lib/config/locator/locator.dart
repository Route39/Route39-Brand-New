// import 'package:connectivity_plus/connectivity_plus.dart';
// import 'package:ridy_driver/config/locator/locator.config.dart';
// import 'package:ridy_driver/core/blocs/auth_bloc.dart';
// import 'package:ridy_driver/core/graphql/app_socket_link.dart';
// import 'package:get_it/get_it.dart';
// import 'package:graphql/client.dart';
// import 'package:injectable/injectable.dart';
// import 'package:flutter/foundation.dart';

// import '../env.dart';

// final locator = GetIt.instance;

// @InjectableInit()
// void configureDependencies() => locator.init(environment: prod.name);

// @module
// abstract class ServiceModule {
//   @lazySingleton
//   Connectivity get connectivity => Connectivity();

//   @factoryMethod
//   GraphQLClient create() {
//     final url = Env.gqlEndpoint;
//     final authLink = AuthLink(
//       // getToken: () {
//       //   final token = locator<AuthBloc>().state.jwtToken;
//       //   return token == null ? null : 'Bearer $token';
//       // },
//       getToken: () {
//   final token = locator<AuthBloc>().state.jwtToken;

//   if (kDebugMode) {
//     print(
//       '[HTTP-AUTH] GraphQL token available: '
//       '${token != null && token.isNotEmpty}',
//     );
//   }

//   if (token == null || token.isEmpty) {
//     return null;
//   }

//   return 'Bearer $token';
// },
//     );
//     final httpLink = HttpLink(url, httpClient: _TimeoutClient());
//     final httpLinkWithAuth = authLink.concat(httpLink);
//     final subscriptionUrl = url.replaceAll('http', 'ws');
//     final websocketLink = AppSocketLink(subscriptionUrl);
//     final link = Link.from(
//       [
//         DedupeLink(),
//       ],
//     ).split(
//       (request) => request.isSubscription,
//       websocketLink,
//       httpLinkWithAuth,
//     );
//     return GraphQLClient(
//       link: link,
//       defaultPolicies: DefaultPolicies(
//         query: Policies(
//           fetch: FetchPolicy.noCache,
//         ),
//         mutate: Policies(
//           fetch: FetchPolicy.noCache,
//         ),
//       ),
//       cache: GraphQLCache(
//         store: InMemoryStore(),
//       ),
//     );
//   }
// }

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:ridy_driver/config/locator/locator.config.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/graphql/app_socket_link.dart';
import 'package:get_it/get_it.dart';
import 'package:graphql/client.dart';
import 'package:injectable/injectable.dart';
import 'package:flutter/foundation.dart';

import '../env.dart';

import 'package:http/http.dart' as http;

class _TimeoutClient extends http.BaseClient {
  final http.Client _inner = http.Client();
  final Duration timeout;

  _TimeoutClient({this.timeout = const Duration(seconds: 15)});

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    return _inner.send(request).timeout(timeout);
  }
}

final locator = GetIt.instance;

@InjectableInit()
void configureDependencies() => locator.init(environment: prod.name);

@module
abstract class ServiceModule {
  @lazySingleton
  Connectivity get connectivity => Connectivity();

  @factoryMethod
  GraphQLClient create() {
    final url = Env.gqlEndpoint;

    final authLink = AuthLink(
      getToken: () {
        final token = locator<AuthBloc>().state.jwtToken;

        if (kDebugMode) {
          print(
            '[HTTP-AUTH] GraphQL token available: '
            '${token != null && token.isNotEmpty}',
          );
        }

        if (token == null || token.isEmpty) {
          return null;
        }

        return 'Bearer $token';
      },
    );

    final httpLink = HttpLink(url, httpClient: _TimeoutClient());
    final httpLinkWithAuth = authLink.concat(httpLink);

    final subscriptionUrl = url.replaceAll('http', 'ws');
    final websocketLink = AppSocketLink(subscriptionUrl);

    final link = Link.from(
      [
        DedupeLink(),
      ],
    ).split(
      (request) => request.isSubscription,
      websocketLink,
      httpLinkWithAuth,
    );

    return GraphQLClient(
      link: link,
      defaultPolicies: DefaultPolicies(
        query: Policies(
          fetch: FetchPolicy.noCache,
        ),
        mutate: Policies(
          fetch: FetchPolicy.noCache,
        ),
      ),
      cache: GraphQLCache(
        store: InMemoryStore(),
      ),
    );
  }
}