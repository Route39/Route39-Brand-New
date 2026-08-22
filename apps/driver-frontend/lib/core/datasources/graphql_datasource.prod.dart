import 'package:api_response/api_response.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:ridy_driver/core/datasources/graphql_datasource.dart';
import 'package:graphql/client.dart';
import 'package:injectable/injectable.dart';
// ignore: depend_on_referenced_packages
import 'package:logger/logger.dart';

@LazySingleton(as: GraphqlDatasource)
class GraphqlDatasourceImpl implements GraphqlDatasource {
  final GraphQLClient client;
  final Connectivity connectivity;

  GraphqlDatasourceImpl({required this.client, required this.connectivity});

  @override
  Future<ApiResponse<TParsed>> mutate<TParsed>(MutationOptions<TParsed> options) async {
    try {
      final result = await client.mutate(options);
      if (result.hasException) {
        return ApiResponse.error(_parseOperationException(result.exception!).errorMessage);
      }
      return ApiResponse.loaded(result.parsedData as TParsed);
    } catch (e) {
      Logger().e(e);
      return ApiResponse.error('Connection failed. Please check your internet connection.');
    }
  }

  @override
  Future<ApiResponse<TParsed>> query<TParsed>(QueryOptions<TParsed> options) async {
    try {
      final result = await client.query(options);
      if (result.hasException && result.parsedData == null) {
        Logger().e(result.exception);
        return ApiResponse.error(_parseOperationException(result.exception!).errorMessage);
      }
      return ApiResponse.loaded(result.parsedData as TParsed);
    } catch (e) {
      Logger().e(e);
      return ApiResponse.error('Connection failed. Please check your internet connection.');
    }
  }

  @override
  Stream<ApiResponse<TParsed>> watchQuery<TParsed>(WatchQueryOptions<TParsed> options) {
    final result = client.watchQuery(options);
    if (result.lifecycle == QueryLifecycle.unexecuted) {
      result.fetchResults();
    }
    return result.stream.map((data) {
      if (data.isLoading) {
        return ApiResponse.loading();
      } else if (data.hasException) {
        return ApiResponse.error(
          data.exception?.graphqlErrors.first.message ?? data.exception?.linkException.toString() ?? 'Unknown error',
        );
      } else {
        return ApiResponse.loaded(data.data as TParsed);
      }
    });
  }

  @override
  Stream<TParsed> subscribe<TParsed>(SubscriptionOptions<TParsed> options) {
    final result = client.subscribe(options);
    return result.map((event) {
      if (event.hasException) {
        throw Stream.error(_parseOperationException(event.exception!));
      }
      return event.parsedData as TParsed;
    });
  }

  @override
  Stream<ApiResponse<TParsed>> queryStream<TParsed>(QueryOptions<TParsed> options) async* {
    yield ApiResponse.loading();
    try {
      final result = await client.query(options);
      if (result.hasException && result.parsedData == null) {
        yield ApiResponse.error(
          result.exception?.graphqlErrors.first.message ?? result.exception?.linkException.toString() ?? 'Unknown error',
        );
      } else {
        yield ApiResponse.loaded(result.parsedData as TParsed);
      }
    } catch (e) {
      Logger().e(e);
      yield ApiResponse.error('Connection failed. Please check your internet connection.');
    }
  }

  static Failure _parseOperationException(OperationException exception) {
    if (exception.graphqlErrors.isNotEmpty) {
      return Failure(errorMessage: exception.graphqlErrors.first.message);
    }
    if (exception.linkException != null) {
      return Failure(errorMessage: exception.linkException.toString());
    }
    return const Failure(errorMessage: 'Unknown error');
  }
}
