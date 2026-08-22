import 'package:ridy_driver/core/graphql/fragments/past_order.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:image_faker/image_faker.dart';
import 'package:time/time.dart';

final mockPastOrder1 = Fragment$PastOrder(
  id: "1",
  status: Enum$OrderStatus.Booked,
  serviceName: 'Economy',
  serviceImageAddress: ImageFaker().taxiService.carPremiumBlack,
  options: [],
  rider: Fragment$PastOrder$rider(
    firstName: "John",
    profileImageUrl: ImageFaker().person.random(),
  ),
  waypoints: [],
  totalCost: 32,
  paymentMode: Enum$PaymentMode.Cash,
  directions: [],
  type: Enum$TaxiOrderType.Ride,
  currency: 'USD',
  createdAt: 50.minutes.ago,
  estimatedDistance: 312,
  estimatedDuration: 231,
);
