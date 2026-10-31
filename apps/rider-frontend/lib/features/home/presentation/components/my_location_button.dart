import 'package:ridy/core/graphql/fragments/point.extensions.dart';
import 'package:ridy/features/home/presentation/blocs/home.extensions.dart';
import 'home_map.dart';
import 'package:api_response/api_response.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/presentation/my_location_button.dart'
    as button;
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/blocs/location.bloc.dart';

class AppMyLocationButton extends StatelessWidget {
  const AppMyLocationButton({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<HomeBloc, HomeState>(
      builder: (context, state) {
        if (state.mode == HomeMode.rideInProgress) {
          return button.MyLocationButton(
            onPressed: () async {
              followDriverNotifier.value = true;
              final c = state.mapViewController;
              final pts = state.markers.nonNulls.map((e) => e.position).followedBy(state.directions.toLatLngs).toList();
              if (c != null && pts.length >= 2) c.fitBounds(pts);
            },
          );
        }
        return switch (state.orderSubmissionPage) {
          OrderSubmissionPage.welcome ||
          OrderSubmissionPage.confirmLocation =>
            button.MyLocationButton(
              onPressed: () async {
                final currentPlace = locator<LocationCubit>().state.place;
                if (currentPlace != null) {
                  locator<HomeBloc>().add(HomeEvent.onMapMoved(
                      selectedLocation: ApiResponse.loaded(currentPlace)));
                  final mapController = state.mapViewController;
                  mapController?.moveCamera(currentPlace.latLng, 16);
                  return;
                }
              },
            ),
          _ => const SizedBox.shrink(),
        };
      },
    );
  }
}
