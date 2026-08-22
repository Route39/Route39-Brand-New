import 'package:ridy_driver/core/graphql/fragments/ride_option.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';

final mockRiderOption1 = Fragment$RideOption(
  name: 'Pet',
  icon: Enum$ServiceOptionIcon.Pet,
);

final mockRiderOption2 = Fragment$RideOption(
  name: 'Delivery',
  icon: Enum$ServiceOptionIcon.PackageDelivery,
);

final mockRiderOption3 = Fragment$RideOption(
  name: 'Shopping',
  icon: Enum$ServiceOptionIcon.Shopping,
);

final mockRiderOption4 = Fragment$RideOption(
  name: 'Luggage',
  icon: Enum$ServiceOptionIcon.Luggage,
);

final moclRiderOptions = [
  mockRiderOption1,
  mockRiderOption2,
  mockRiderOption3,
  mockRiderOption4,
];
