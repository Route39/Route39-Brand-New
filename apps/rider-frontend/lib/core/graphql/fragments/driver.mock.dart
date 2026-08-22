import 'package:image_faker/image_faker.dart';
import 'package:ridy/core/graphql/fragments/driver.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/point.mock.dart';

final mockActiveOrderDriver = Fragment$ActiveOrderDriver(
  fullName: 'John Doe',
  profileImageUrl: ImageFaker().person.random(),
  rating: 82,
  mobileNumber: '123-456-7890',
  vehicleName: 'Toyota Camry',
  vehicleColor: 'White',
  vehiclePlate: 'ABC1234',
  location: mockPoint1,
);

final mockPastOrderDriver = Fragment$PastOrderDriver(
  fullName: 'John Doe',
  profileImageUrl: ImageFaker().person.random(),
  rating: 82,
  mobileNumber: '123-456-7890',
  vehicleName: 'Toyota Camry',
  vehicleColor: 'White',
  vehiclePlate: 'ABC1234',
);
