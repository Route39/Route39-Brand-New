import 'package:api_response/api_response.dart';
import 'package:graphql/client.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/graphql/documents/profile.graphql.dart';
import 'package:ridy/core/datasources/graphql_datasource.dart';
import 'package:ridy/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:ridy/core/repositories/profile_repository.dart';
import 'package:rxdart/rxdart.dart';

@prod
@LazySingleton(as: ProfileRepository)
class ProfileRepositoryProd implements ProfileRepository {
  final GraphqlDatasource graphqlDatasource;
  @override
  Stream<ApiResponse<Fragment$Profile>> get profileStream => _profileStream.stream;

  final BehaviorSubject<ApiResponse<Fragment$Profile>> _profileStream = BehaviorSubject<ApiResponse<Fragment$Profile>>();

  ProfileRepositoryProd(this.graphqlDatasource);

  @override
  Future<ApiResponse<Fragment$Profile>> getProfile() async {
    final profile = await graphqlDatasource.query(Options$Query$Profile(fetchPolicy: FetchPolicy.noCache));
    _profileStream.add(profile.mapData((r) => r.me));
    return profile.mapData((r) => r.me);
  }

  @override
  Future<ApiResponse<Fragment$Profile>> updateProfile({required Input$UpdateRiderInput input}) async {
    final profile = await graphqlDatasource.mutate(
      Options$Mutation$UpdateProfile(
        variables: Variables$Mutation$UpdateProfile(input: input),
        fetchPolicy: FetchPolicy.noCache,
      ),
    );
    _profileStream.add(profile.mapData((r) => r.updateProfile));
    return profile.mapData((r) => r.updateProfile);
  }
}
