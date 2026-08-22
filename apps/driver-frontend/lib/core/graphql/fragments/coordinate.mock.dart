import 'package:ridy_driver/core/graphql/schema.gql.dart';

import 'coordinate.fragment.graphql.dart';

final mockDirections = [
  Fragment$Coordinate(lat: 37.3875, lng: -122.0575),
  Fragment$Coordinate(lat: 37.388033, lng: -122.057918),
  Fragment$Coordinate(lat: 37.386627, lng: -122.068655),
  Fragment$Coordinate(lat: 37.394856, lng: -122.068583),
  Fragment$Coordinate(lat: 37.400799, lng: -122.069950),
  Fragment$Coordinate(lat: 37.409426, lng: -122.070957),
  Fragment$Coordinate(lat: 37.416224, lng: -122.085845),
  Fragment$Coordinate(lat: 37.422394, lng: -122.091887),
  Fragment$Coordinate(lat: 37.42203, lng: -122.08417),
  Fragment$Coordinate(lat: 37.4220, lng: -122.0841),
];

final mockCoordinate1 = Fragment$Coordinate(lat: 37.4220, lng: -122.0841);
final mockCoordinate2 = Fragment$Coordinate(lat: 37.3875, lng: -122.0575);
final mockCoordinate3 = Fragment$Coordinate(lat: 37.4000, lng: -122.0800);

final mockCoordinates = [mockCoordinate1, mockCoordinate2, mockCoordinate3];

final mockAddress1 = '22 Apple Park Way, Cupertino';
final mockAddress2 = '1 Infinite Loop, Cupertino';
final mockAddress3 = '2217 Poco Mas Drive';

final mockAddresses = [mockAddress1, mockAddress2, mockAddress3];

final mockPlace1 = Fragment$place(point: mockCoordinate1, address: mockAddress1);

final mockPlace2 = Fragment$place(point: mockCoordinate2, address: mockAddress2);

final mockPlaces = [mockPlace1, mockPlace2];

final mockWaypoint1 = Fragment$Waypoint$$RideWaypoint(
  location: mockCoordinate1,
  address: 'Infinite Loop, Cupertino, CA',
  role: Enum$WaypointRole.Dropoff,
);

final mockWaypoint2 = Fragment$Waypoint$$RideWaypoint(
  location: mockCoordinate2,
  address: 'Apple Park Way, Cupertino, CA',
  role: Enum$WaypointRole.Pickup,
);

final mockWaypoints = [mockWaypoint1, mockWaypoint2];
