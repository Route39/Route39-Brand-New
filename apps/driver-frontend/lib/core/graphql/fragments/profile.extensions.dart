import 'package:ridy_driver/core/graphql/fragments/profile.fragment.graphql.dart';

extension ProfileX on Fragment$Profile {
  String get fullName => [firstName, lastName].where((e) => e.isNotEmpty == true).join(' ').trim();
}
