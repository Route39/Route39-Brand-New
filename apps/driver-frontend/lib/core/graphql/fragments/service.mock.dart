import 'package:ridy_driver/core/graphql/fragments/service.fragment.graphql.dart';
import 'package:image_faker/image_faker.dart';

final mockService1 = Fragment$Service(
  id: '1',
  name: 'Premium Ride',
  imageUrl: ImageFaker().taxiService.carPremiumBlack,
);

final mockService2 = Fragment$Service(
  id: '2',
  name: 'Standard Ride',
  imageUrl: ImageFaker().taxiService.carYellow,
);
