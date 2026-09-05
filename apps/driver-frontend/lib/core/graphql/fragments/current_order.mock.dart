import 'package:ridy_driver/config/env.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.mock.dart';
import 'package:ridy_driver/core/graphql/fragments/current_order.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/customer.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/payment_method.mock.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:image_faker/image_faker.dart';
import 'package:time/time.dart';

final mockCurrentOrder1 = Fragment$ActiveOrder(
  id: "1",
  type: Enum$TaxiOrderType.Ride,
  estimatedDistance: 5400,
  estimatedDuration: 1200,
  serviceName: 'Economy',
  currency: Env.defaultCurrency,
  waypoints: mockWaypoints,
  nextDestination: mockWaypoint2,
  serviceImageAddress: ImageFaker().taxiService.carPremiumBlack,
  options: [],
  rider: Fragment$customer(),
  status: Enum$OrderStatus.Booked,
  chatMessages: [],
  directions: [],
  pickupEta: 5.minutes.fromNow,
  dropoffEta: 20.minutes.fromNow,
  createdAt: 12.minutes.ago,
  totalCost: 25.0,
  costBest: 700.0,
  providerShare: 50.0,
  gstPercent: 18.0,
  gstAmount: 25.43,
  platformFee: 10.0,
  platformFeeAmount: 10.0,
  paymentGatewayFeePercent: 0.0,
  paymentGatewayFeeAmount: 0.0,
  couponDiscount: 0.0,
  paymentMethod: mockPaymentMethod,
  unreadMessagesCount: 10,
);

final mockCurrentOrders = [
  mockCurrentOrder1,
];
