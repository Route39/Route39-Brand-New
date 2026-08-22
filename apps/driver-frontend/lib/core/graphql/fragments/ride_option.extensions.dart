import 'package:ridy_driver/core/graphql/fragments/ride_option.fragment.graphql.dart';
import 'package:flutter_common/core/entities/ride_option.dart';
import 'package:ridy_driver/core/enums/ride_option_icon.prod.dart';

extension RideOptionProdX on Fragment$RideOption {
  RideOptionEntity get toEntity => RideOptionEntity(
        id: "21",
        name: name,
        icon: icon.toEntity,
      );
}
