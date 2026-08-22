import 'package:image_faker/image_faker.dart';
import 'package:ridy/config/env.dart';
import 'package:ridy/core/graphql/fragments/driver.mock.dart';
import 'package:ridy/core/graphql/fragments/past_order.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/payment_method.mock.dart';
import 'package:ridy/core/graphql/fragments/point.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/point.mock.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:time/time.dart';

final mockPastOrder1 = Fragment$PastOrder(
  id: '1',
  type: Enum$TaxiOrderType.Ride,
  estimatedDistance: 5400,
  estimatedDuration: 1200,
  serviceName: 'Economy',
  paymentMethod: mockPaymentMethod,
  currency: Env.defaultCurrency,
  waypoints: [
    Fragment$Waypoint$$RideWaypoint(
      location: mockPoint1,
      address: 'Apple Park, Cupertino, CA',
      role: Enum$WaypointRole.Pickup,
    ),
    Fragment$Waypoint$$RideWaypoint(
      location: mockPoint2,
      address: 'Infinite Loop, Cupertino, CA',
      role: Enum$WaypointRole.Dropoff,
    ),
  ],
  serviceImageAddress: ImageFaker().taxiService.carPremiumBlack,
  options: [],
  driver: mockPastOrderDriver,
  status: Enum$OrderStatus.Booked,
  directions: [],
  pickupEta: 5.minutes.fromNow,
  dropoffEta: 20.minutes.fromNow,
  createdAt: 12.minutes.ago,
  totalCost: 25.0,
);
