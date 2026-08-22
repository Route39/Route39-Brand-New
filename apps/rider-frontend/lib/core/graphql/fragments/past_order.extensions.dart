import 'package:flutter_common/core/entities/payment_method_union.dart';
import 'package:generic_map/interfaces/place.dart';
import 'package:ridy/core/graphql/fragments/past_order.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/payment_method.extensions.dart';
import 'package:ridy/core/graphql/fragments/point.extensions.dart';

extension PastOrderX on Fragment$PastOrder {
  List<Place> get places => waypoints.toPlaces;

  bool get isTwoWay => waypoints.first == waypoints.last;

  PaymentMethodUnion get paymentMethodUnion {
    return paymentMethod.entity;
  }
}
