import 'package:flutter/material.dart';
import 'package:generic_map/interfaces/place.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/place_lookup.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';
//import 'package:ridy/core/graphql/documents/get_route_distance.graphql.dart';
import 'package:ridy/core/graphql/fragments/point.extensions.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:ridy/core/repositories/order_repository.dart';
import 'package:ridy/gen/assets.gen.dart';

import 'place_result_item.dart';

class PlaceLookupStateView extends StatelessWidget {
  final PlaceLookupState state;
  final Function(Place) onItemSelected;
  final Widget? initialStateView;
  final Place? routeOrigin;

  const PlaceLookupStateView({
    super.key,
    required this.state,
    required this.onItemSelected,
    this.initialStateView,
    this.routeOrigin,
  });

  Future<String?> _getRouteDistance(
    Place destination,
    BuildContext context,
  ) async {
    if (routeOrigin == null) {
      return null;
    }

    final response = await locator<OrderRepository>().getRouteDistance(
      args: Input$GetRouteDistanceInput(
        points: [
          routeOrigin!.latLng.toPointInput,
          destination.latLng.toPointInput,
        ],
      ),
    );

    if (!response.isLoaded || response.data == null) {
      return null;
    }

    final distanceMeters =
        response.data!.getRouteDistance.distance.toInt();

    return distanceMeters.toFormattedDistance(context);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      child: switch (state) {
        PlaceLookupState$MoreCharacters() =>
          Text(context.translate.enterAtLeast3Characters),

        PlaceLookupState$NoResults() =>
          Text(context.translate.noResults),

        PlaceLookupState$Initial() =>
          initialStateView ?? const SizedBox(),

        PlaceLookupState$Loading() =>
          Assets.lottie.loading.lottie(),

        PlaceLookupState$Loaded(:final places) =>
          Column(
            mainAxisSize: MainAxisSize.min,
            children: places
                .map(
                  (place) => FutureBuilder<String?>(
                    future: _getRouteDistance(place, context),
                    builder: (context, snapshot) {
                      return PlaceResultItem(
                        onPressed: () => onItemSelected(place),
                        title: place.title,
                        subtitle: place.address,
                        trailing: snapshot.data,
                      );
                    },
                  ),
                )
                .separated(
                  const Divider(
                    thickness: 0.3,
                    indent: 48,
                    height: 16,
                  ),
                ),
          ),

        PlaceLookupState$Error(:final message) =>
          Text(message),
      },
    );
  }
}