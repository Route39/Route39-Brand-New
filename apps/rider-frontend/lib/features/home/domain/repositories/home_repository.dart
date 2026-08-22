import 'package:api_response/api_response.dart';
import 'package:latlong2/latlong.dart';
import 'package:ridy/core/graphql/documents/home.graphql.dart';
import 'package:ridy/core/graphql/fragments/point.fragment.graphql.dart';

abstract class HomeRepository {
  Future<ApiResponse<Query$CurrentOrder>> getCurrentOrder();

  Future<ApiResponse<List<Fragment$Coordinate>>> getDriversAround(LatLng origin);
}
