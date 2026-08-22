import 'package:flutter_common/core/entities/payment_method_union.dart';
import 'package:ridy/core/graphql/fragments/active_order.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/payment_method.extensions.dart';

extension CurrentOrderX on Fragment$ActiveOrder {
  bool get isTwoWay => waypoints.first.address == waypoints.last.address;

  PaymentMethodUnion get paymentMethodUnion {
    return paymentMethod.entity;
  }
}
