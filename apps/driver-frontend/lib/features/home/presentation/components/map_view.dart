import 'package:ridy_driver/core/graphql/schema.gql.dart';
import '../screens/turn_by_turn_navigation_screen.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.extensions.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/blocs/settings.dart';
import 'package:ridy_driver/core/presentation/app_generic_map.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
import 'package:generic_map/generic_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:maps_toolkit/maps_toolkit.dart' as map_toolkit;

import '../blocs/home.bloc.dart';

class HomeMapView extends StatefulWidget {
  const HomeMapView({super.key});

  @override
  State<HomeMapView> createState() => _HomeMapViewState();
}

class _HomeMapViewState extends State<HomeMapView> {
  MapViewController? controller;
  bool _follow = true;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SettingsCubit, SettingsState>(
      buildWhen: (previous, current) => previous.mapProvider != current.mapProvider,
      builder: (context, settingsState) {
        return BlocConsumer<HomeBloc, HomeState>(
          listener: (context, state) {
            _maybeAutoNavigate(state);
            if (state.markers.length > 1) {
              if (_follow) {
                final d = _driverPos(state); if (d != null) controller?.moveCamera(d, 17);
              }
            } else if (state.markers.length == 1) {
              switch (state.driverStatus) {
                case HomeStateDriverStatus.online:
                  final authState = locator<AuthBloc>().state;
                  int? radius;
                  switch (authState) {
                    case AuthState$Authenticated(:final profile):
                      radius = profile.searchDistance;
                      break;
                    default:
                      radius = null;
                  }

                  fitMapToCenterAndRadius(
                    state.markers.first.position,
                    radius ?? 10000,
                  );
                  break;

                default:
                  controller?.moveCamera(state.markers.first.position, null);
              }
            }
          },
          builder: (context, state) {
            return BlocConsumer<AuthBloc, AuthState>(
              listenWhen: (previous, current) {
                return switch (previous) {
                  AuthState$Authenticated() => switch (current) {
                      AuthState$Authenticated() => previous.profile.searchDistance != current.profile.searchDistance,
                      _ => false,
                    },
                  _ => true,
                };
              },
              listener: (context, stateAuth) {
                switch (state.driverStatus) {
                  case HomeStateDriverStatus.online:
                    final radius = switch (stateAuth) {
                      AuthState$Authenticated(:final profile) => profile.searchDistance,
                      _ => null
                    };

                    if (state.markers.isNotEmpty && state.orderRequests.isEmpty) {
                      fitMapToCenterAndRadius(
                        state.markers.first.position,
                        radius ?? 10000,
                      );
                    }
                    break;

                  default:
                    if (state.markers.isNotEmpty) {
                      controller?.moveCamera(state.markers.first.position, null);
                    }
                }
              },
              builder: (context, stateAuth) {
                final radius = switch (stateAuth) {
                  AuthState$Authenticated(:final profile) => profile.searchDistance,
                  _ => null,
                };
                return Stack(children: [Listener(onPointerDown: (_) { if (_follow) setState(() => _follow = false); }, child: AppGenericMap(
                  padding: state.mapPadding(context),
                  onControllerReady: (p0) => controller = p0,
                  circleMarkers: state.circleMarkers(radius),
                  polylines: state.polylines(context),
                  interactive: true,
                  mode: MapViewMode.static,
                  initialLocation: Constants.defaultLocation,
                  markers: state.markers,
                )),
                if (state.driverStatus == HomeStateDriverStatus.onTrip && state.currentOrder?.nextDestination != null && state.driverLocation != null) Positioned(left: 16, top: 16, child: _etaChip(_driverPos(state)!, state.currentOrder!.nextDestination!.location.toPlace.latLng, state.currentOrder!.directions.map((e) => e.toLatLng).toList())),
                if (!_follow) Positioned(left: 16, top: 70, child: FloatingActionButton.small(heroTag: 'recenter', onPressed: () { setState(() => _follow = true); final d = _driverPos(state); if (d != null) controller?.moveCamera(d, 17); }, child: const Icon(Icons.my_location))),
                ]);
              },
            );
          },
        );
      },
    );
  }

  final Set<String> _autoNavShown = {};

  void _maybeAutoNavigate(HomeState state) {
    if (state.driverStatus != HomeStateDriverStatus.onTrip) return;
    final o = state.currentOrder;
    if (o == null) return;
    if (o.status != Enum$OrderStatus.DriverAccepted && o.status != Enum$OrderStatus.Started) return;
    final key = '${o.id}:${o.status}';
    if (_autoNavShown.contains(key) || TurnByTurnNavigationScreen.isOpen) return;
    final place = o.nextDestination?.location.toPlace;
    if (place == null) return;
    _autoNavShown.add(key);
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => TurnByTurnNavigationScreen(place: place)));
  }

  LatLng? _driverPos(HomeState s) => s.driverLocation == null ? null : LatLng(s.driverLocation!.lat, s.driverLocation!.lng);

  double _routeKm(LatLng from, LatLng to, List<LatLng> route) {
    const dist = Distance();
    double m(LatLng a, LatLng b) => dist.as(LengthUnit.Meter, a, b);
    if (route.length < 2 || m(route.last, to) > 300) return m(from, to) * 1.4 / 1000;
    var best = 0;
    var bestD = double.infinity;
    for (var i = 0; i < route.length; i++) {
      final d = m(from, route[i]);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (bestD > 500) return m(from, to) * 1.4 / 1000;
    var total = bestD;
    for (var i = best; i < route.length - 1; i++) { total += m(route[i], route[i + 1]); }
    return total / 1000;
  }

  Widget _etaChip(LatLng from, LatLng to, List<LatLng> route) {
    final km = _routeKm(from, to, route);
    final mins = (km / 18 * 60).ceil().clamp(1, 999);
    return Material(
      elevation: 4,
      borderRadius: BorderRadius.circular(20),
      color: Theme.of(context).colorScheme.surface,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.place, size: 18, color: Colors.red),
          const SizedBox(width: 6),
          Text('$mins min • ${km.toStringAsFixed(1)} km', style: const TextStyle(fontWeight: FontWeight.w600)),
        ]),
      ),
    );
  }

  void fitMapToCenterAndRadius(LatLng center, int radius) {
    final northeast = map_toolkit.SphericalUtil.computeOffset(
      map_toolkit.LatLng(center.latitude, center.longitude),
      radius.toDouble(),
      45,
    ).toLatLong;
    final southwest = map_toolkit.SphericalUtil.computeOffset(
      map_toolkit.LatLng(center.latitude, center.longitude),
      radius.toDouble(),
      225,
    ).toLatLong;
    controller?.fitBounds(
      [northeast, southwest],
    );
  }
}

extension MapToolkitLatLng on map_toolkit.LatLng {
  LatLng get toLatLong => LatLng(latitude, longitude);
}
