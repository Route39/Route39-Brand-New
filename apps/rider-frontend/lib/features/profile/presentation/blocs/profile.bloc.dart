import 'package:api_response/api_response.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/blocs/auth_bloc.dart';
import 'package:ridy/core/graphql/documents/profile.graphql.dart';
import '../../domain/repositories/profile_repository.dart';

part 'profile.state.dart';
part 'profile.bloc.freezed.dart';

@lazySingleton
class ProfileBloc extends Cubit<ProfileState> {
  final ProfileRepository _repository;
  final AuthBloc _authBloc;

  ProfileBloc(this._repository, this._authBloc) : super(const ProfileState());

  void fetchProfileAggregationsInfo() async {
    emit(
      state.copyWith(
        profileAggregationsState: ApiResponse.loading(),
      ),
    );

    final profileAggregationsInfoResponse =
        await _repository.getProfileAggregationsInfo();

    if (profileAggregationsInfoResponse is ApiResponseError &&
        (profileAggregationsInfoResponse as ApiResponseError).message ==
            'GqlAuthGuard') {
      _authBloc.onLoggedOut();
      return;
    }

    emit(
      state.copyWith(
        profileAggregationsState: profileAggregationsInfoResponse,
      ),
    );
  }
}
