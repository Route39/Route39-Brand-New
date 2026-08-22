import 'package:ridy_driver/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:injectable/injectable.dart';
import '../repositories/profile_repository.dart';

part 'auth_bloc.state.dart';
part 'auth_bloc.freezed.dart';
part 'auth_bloc.g.dart';

@lazySingleton
class AuthBloc extends HydratedCubit<AuthState> {
  final ProfileRepository profileRepository;

  AuthBloc(this.profileRepository) : super(const AuthState.unauthenticated());

  @override
  AuthState? fromJson(Map<String, dynamic> json) => AuthState.fromJson(json);

  @override
  Map<String, dynamic>? toJson(AuthState state) => state.toJson();

  void onLoggedIn({required String jwtToken, required Fragment$Profile profile}) {
    emit(AuthState.authenticated(jwtToken: jwtToken, profile: profile));
  }

  void requestUserInfo() async {
    if (!state.isAuthenticated) {
      return;
    }
    final result = await profileRepository.getProfile();
    emit(
      result.fold(
        (l, {failure}) => AuthState.error(message: "Couldn't retrieve user info"),
        (r) => state.authenticatedState!.copyWith(profile: r.me),
      ),
    );
  }

  void changeSearchRadius(int? radius) async {
    if (state is! AuthState$Authenticated) {
      return;
    }
    final result = await profileRepository.updateRadius(radius: radius);
    emit((state as AuthState$Authenticated).copyWith(profile: result.data!.updateDriverOfferFilter));
  }

  void onLoggedOut() {
    emit(const AuthState.unauthenticated());
  }
}
