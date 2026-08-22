import 'package:collection/collection.dart';
import 'package:dartz/dartz.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/current_order.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:generic_map/interfaces/place.dart';

extension CurrentOrderX on Fragment$ActiveOrder {
  Option<String> get avatar => rider?.profileImageUrl != null ? Some(rider!.profileImageUrl!) : const None();

  List<Place> get wayPoints => waypoints
      .mapIndexed(
        (index, element) => element.toPlace,
      )
      .toList();

  bool get isPaid => switch (paymentMethod.mode) {
        Enum$PaymentMode.Cash => false,
        Enum$PaymentMode.SavedPaymentMethod => true,
        Enum$PaymentMode.Wallet => true,
        Enum$PaymentMode.PaymentGateway => false,
        _ => false,
      };
}
