import 'package:ridy/core/graphql/fragments/favorite_location.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/point.mock.dart';
import 'package:ridy/core/graphql/schema.gql.dart';

final mockFavoriteLocation1 = Fragment$FavoriteLocation(
  id: '1',
  title: 'Home',
  type: Enum$RiderAddressType.Home,
  details: '23, 1st Avenue, New York',
  location: mockPoint1,
);

final mockFavoriteLocation2 = Fragment$FavoriteLocation(
  id: '2',
  title: 'Work',
  type: Enum$RiderAddressType.Work,
  details: '456, 2nd Avenue, New York',
  location: mockPoint2,
);

final mockFavoriteLocations = [mockFavoriteLocation1, mockFavoriteLocation2];
