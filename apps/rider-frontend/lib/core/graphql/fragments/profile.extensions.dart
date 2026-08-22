import 'package:ridy/core/graphql/fragments/profile.fragment.graphql.dart';

extension PaymentGatewayProdX on Fragment$Profile {
  String get fullName => [firstName, lastName].nonNulls.isNotEmpty ? [firstName, lastName].nonNulls.join(' ') : '-';

  String? get avatar {
    if (profileImageUrl != null) {
      return profileImageUrl;
    } else {
      return null;
    }
  }
}
