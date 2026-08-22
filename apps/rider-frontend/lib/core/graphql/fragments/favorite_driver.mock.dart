import 'package:image_faker/image_faker.dart';
import 'package:ridy/core/graphql/fragments/favorite_driver.fragment.graphql.dart';

final mockFavoriteDriver1 = Fragment$FavoriteDriver(
  id: "1",
  fullName: 'John Doe',
  profileImageUrl: ImageFaker().person.random(),
  rating: 82,
  mobileNumber: '123-456-7890',
  vehicleName: 'Toyota Camry',
  vehicleColor: 'White',
  vehiclePlate: 'ABC1234',
);
