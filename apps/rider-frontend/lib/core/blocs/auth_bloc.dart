import 'package:api_response/api_response.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/graphql/fragments/profile.extensions.dart';
import 'package:ridy/core/graphql/fragments/profile.fragment.graphql.dart';
import '../repositories/profile_repository.dart';
import 'package:ridy/features/auth/domain/repositories/auth_repository.dart';

part 'auth_bloc.state.dart';
part 'auth_bloc.freezed.dart';
part 'auth_bloc.g.dart';

@lazySingleton
class AuthBloc extends HydratedCubit<AuthState> {
  final ProfileRepository profileRepository;
  final AuthRepository authRepository;

  AuthBloc(this.profileRepository, this.authRepository) : super(const AuthState.unauthenticated());

  @override
  AuthState? fromJson(Map<String, dynamic> json) => AuthState.fromJson(json);

  @override
  Map<String, dynamic>? toJson(AuthState state) => state.toJson();

  void onLoggedIn({
    required String jwtToken,
    required String refreshToken,
    required profile,
  }) {
    emit(
      AuthState.authenticated(
        jwtToken: jwtToken,
        refreshToken: refreshToken,
        profile: profile,
      ),
    );
  }

  void profileUpdated(Fragment$Profile profile) {
    emit(
      switch (state) {
        AuthState$Authenticated(:final jwtToken, :final refreshToken) => AuthState.authenticated(
            jwtToken: jwtToken,
            refreshToken: refreshToken,
            profile: profile,
          ),
        AuthState$Unauthenticated() => throw Exception('Unauthenticated user'),
      },
    );
  }

  Future<void> requestUserInfo() async {
    if (state is! AuthState$Authenticated) return;

    final profile = await profileRepository.getProfile();

    switch (profile) {
      case ApiResponseLoaded(:final data):
        emit(
          AuthState.authenticated(
            jwtToken: (state as AuthState$Authenticated).jwtToken,
            refreshToken: (state as AuthState$Authenticated).refreshToken,
            profile: data,
          ),
        );
        return;
      case ApiResponseError(:final message):
        if (message != 'GqlAuthGuard') {
          throw Exception("Couldn't retrieve user info");
        }
        final refreshed = await _tryRefreshToken();
        if (!refreshed) {
          emit(const AuthState.unauthenticated());
        }
        return;
      default:
        return;
    }
  }

  Future<bool> _tryRefreshToken() async {
    if (state is! AuthState$Authenticated) return false;

    final currentRefreshToken = (state as AuthState$Authenticated).refreshToken;
    final response = await authRepository.refreshToken(currentRefreshToken);

    switch (response) {
      case ApiResponseLoaded(:final data):
        emit(
          AuthState.authenticated(
            jwtToken: data.refreshToken.accessToken,
            refreshToken: data.refreshToken.refreshToken,
            profile: (state as AuthState$Authenticated).profile,
          ),
        );
        return true;
      default:
        return false;
    }
  }

  void onLoggedOut() {
    emit(const AuthState.unauthenticated());
  }
}
