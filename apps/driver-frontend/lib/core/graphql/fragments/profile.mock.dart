import 'package:ridy_driver/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:image_faker/image_faker.dart';

final mockProfile1 = Fragment$Profile(
  id: '1',
  mobileNumber: '+12065550123',
  firstName: 'John',
  lastName: 'Doe',
  status: Enum$DriverStatus.Online,
  searchDistance: 15,
  currency: 'USD',
  profileImageUrl: ImageFaker().person.random(),
);

final mockProfile2 = Fragment$Profile(
  id: '2',
  mobileNumber: '+12065550456',
  firstName: 'Jane',
  lastName: 'Smith',
  status: Enum$DriverStatus.Offline,
  searchDistance: 12,
  currency: 'USD',
  profileImageUrl: ImageFaker().person.random(),
);

final mockProfileFull1 = Fragment$Profile(
  id: '1',
  mobileNumber: '+12065550123',
  firstName: 'John',
  lastName: 'Doe',
  status: Enum$DriverStatus.Online,
  searchDistance: 15,
  currency: 'USD',
  profileImageUrl: ImageFaker().person.random(),
);
