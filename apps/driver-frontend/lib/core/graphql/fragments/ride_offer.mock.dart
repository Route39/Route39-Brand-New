import 'package:ridy_driver/config/env.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.mock.dart';
import 'package:ridy_driver/core/graphql/fragments/ride_offer.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:image_faker/image_faker.dart';

final mockRideOffer = Fragment$RideOffer(
  id: '1',
  type: Enum$TaxiOrderType.Ride,
  directions: [],
  waypoints: mockWaypoints,
  currency: Env.defaultCurrency,
  serviceName: 'Standard',
  serviceImageAddress: ImageFaker().taxiService.carBlack,
  options: [],
  fareEstimate: 10.0,
  distance: 4513,
  duration: 716,
);
