import 'package:ridy/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:image_faker/image_faker.dart';

final mockProfile1 = Fragment$Profile(
  id: '1',
  mobileNumber: '+12065550123',
  countryIso: 'US',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  walletCredit: 100,
  currency: "USD",
  gender: Enum$Gender.Male,
  profileImageUrl: ImageFaker().person.random(),
);

final mockProfile2 = Fragment$Profile(
  id: '2',
  mobileNumber: '+12065550456',
  countryIso: 'US',
  email: 'jane.smith@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  walletCredit: 100,
  currency: "USD",
  gender: Enum$Gender.Female,
  profileImageUrl: ImageFaker().person.random(),
);
