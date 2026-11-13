import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/features/home/presentation/screens/mobile_layout_delegate.dart';
import 'package:latlong2/latlong.dart';
import 'package:api_response/api_response.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
import 'package:flutter_common/core/presentation/markers/app_marker_pickup.dart';
import 'package:generic_map/generic_map.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/blocs/settings.bloc.dart';
import 'package:ridy/core/datasources/geo_datasource.dart';
import 'package:flutter_common/core/presentation/markers/app_marker_drop_off.dart';
import 'package:ridy/core/graphql/fragments/point.extensions.dart';
import 'package:ridy/core/presentation/app_generic_map.dart';
import 'package:ridy/features/home/presentation/blocs/home.extensions.dart';

import 'current_location_marker.dart';

final followDriverNotifier = ValueNotifier<bool>(true);

class HomeMap extends StatefulWidget {
  const HomeMap({super.key});

  @override
  State<HomeMap> createState() => _HomeMapState();
}

class _HomeMapState extends State<HomeMap> with SingleTickerProviderStateMixin {
  late final AnimationController _anim = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1500),
  )..addListener(() {
      final now = DateTime.now();
      if (_anim.isCompleted || now.difference(_lastFrame).inMilliseconds >= 33) {
        _lastFrame = now;
        setState(() {});
      }
    });
  DateTime _lastFrame = DateTime.fromMillisecondsSinceEpoch(0);
  LatLng? _fromPos;
  LatLng? _toPos;
  int? _bearing;
  DateTime? _lastUpdate;

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  LatLng? get _animPos {
    if (_fromPos == null || _toPos == null) return _toPos;
    final t = _anim.value;
    return LatLng(
      _fromPos!.latitude + (_toPos!.latitude - _fromPos!.latitude) * t,
      _fromPos!.longitude + (_toPos!.longitude - _fromPos!.longitude) * t,
    );
  }

  void _onDriverLoc(LatLng? newPos) {
    if (newPos == null || newPos == _toPos) return;
    if (_toPos == null) {
      _fromPos = newPos;
    } else {
      _fromPos = _animPos ?? _toPos;
      if (const Distance().as(LengthUnit.Meter, _fromPos!, newPos) > 3) {
        _bearing = ((const Distance().bearing(_fromPos!, newPos) + 360) % 360).round();
      }
    }
    final now = DateTime.now();
    if (_lastUpdate != null) {
      _anim.duration = Duration(milliseconds: now.difference(_lastUpdate!).inMilliseconds.clamp(800, 5000));
    }
    _lastUpdate = now;
    _toPos = newPos;
    _anim.forward(from: 0);
  }

  List<CustomMarker> _markers(HomeState state) {
    final driverPos = state.activeOrder?.driver?.location?.toLatLng;
    final pos = _animPos;
    if (state.mode != HomeMode.rideInProgress || driverPos == null || pos == null) return state.markers;
    return state.markers
        .map((m) => m.position == driverPos
            ? CustomMarker(
                id: m.id,
                position: pos,
                widget: m.widget,
                fallbackAssetPath: m.fallbackAssetPath,
                fallbackAssetPackage: m.fallbackAssetPackage,
                width: m.width,
                height: m.height,
                alignment: m.alignment,
                rotation: _bearing ?? m.rotation,
              )
            : m)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<HomeBloc, HomeState>(
      listenWhen: (previous, current) => previous.markers != current.markers,
      listener: (context, state) async {
        _onDriverLoc(state.activeOrder?.driver?.location?.toLatLng);
        if (state.mode != HomeMode.rideInProgress) followDriverNotifier.value = true;
        switch (state.mode) {
          case HomeMode.preSubmission:
            switch (state.orderSubmissionPage) {
              case OrderSubmissionPage.welcome:
                // if (state.waypoints.first == null) return;
                // final mapCenter = await state.mapViewController?.getCenter();
                // final distance = mapCenter?.distanceTo(state.waypoints.first!.latLng);
                // if (distance != null && distance < 100) return;
                // state.mapViewController?.moveCamera(state.waypoints.first!.latLng, null);
                return;

              case OrderSubmissionPage.confirmLocation:
                // if (state.selectedLocationResponse.data == null) return;
                // final mapCenter = await state.mapViewController?.getCenter();
                // final distance = mapCenter?.distanceTo(state.selectedLocationResponse.data!.latLng);
                // if (distance != null && distance < 50) return;
                // state.mapViewController?.moveCamera(state.selectedLocationResponse.data!.latLng, null);
                break;
              default:
                break;
            }
            break;
          case HomeMode.ridePreview:
            // if (state.waypoints.nonNulls.toList().latLngs.length < 2) return;
            // Future.delayed(const Duration(milliseconds: 200), () {
            //   if (state.ridePreviewFareResponse.isLoaded) {
            //     state.mapViewController?.fitBounds(
            //       state.waypoints.nonNulls.toList().latLngs.followedBy(state.directions.toLatLngs).toList(),
            //     );
            //   }
            // });
            break;

          case HomeMode.rideInProgress:
            if (!followDriverNotifier.value) return;
            if (state.markers.nonNulls.toList().length < 2) return;

            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!context.mounted) return;

              final controller = state.mapViewController;
              if (controller == null) return;

              controller.fitBounds(
                state.markers.nonNulls
                    .toList()
                    .map((e) => e.position)
                    .followedBy(state.directions.toLatLngs)
                    .toList(),
              );
            });
            break;

          default:
            break;
        }
      },
      builder: (context, state) {
        WidgetsBinding.instance.addPostFrameCallback((_) => fullMapNotifier.value = state.mode == HomeMode.rideInProgress);
        WidgetsBinding.instance.addPostFrameCallback((_) => compactMapNotifier.value =
            state.mode == HomeMode.preSubmission && state.orderSubmissionPage == OrderSubmissionPage.welcome);
        return BlocBuilder<SettingsCubit, SettingsState>(
          buildWhen: (previous, current) =>
              previous.mapProvider != current.mapProvider,
          builder: (context, settingsState) {
            return Stack(children: [
              Listener(
              onPointerDown: (_) {
                if (state.mode == HomeMode.rideInProgress && followDriverNotifier.value) {
                  followDriverNotifier.value = false;
                }
              },
              child: AppGenericMap(
              padding: EdgeInsets.only(
                left: 120,
                right: 120,
                top: 150,
                bottom: (state.mode == HomeMode.rideInProgress || context.responsive(true, xl: false)) ? cardHeightNotifier.value + 20 : 60,
              ),
              buttonPadding: const EdgeInsets.symmetric(
                vertical: 32,
                horizontal: 16,
              ),
              mode: state.mapViewMode,
              interactive: state.isInteractive,
              polylines: state.polylines(context),
              onControllerReady: (controller) => locator<HomeBloc>().add(
                HomeEvent.onMapReady(controller: controller),
              ),
              centerMarkerBuilder: switch (state.orderSubmissionPage) {
                OrderSubmissionPage.confirmLocation => (context, key, address) {
                  if (state.selectedWaypointIndex == 0) {
                    return AppMarkerPickup(
                      address: "Drag to adjust",
                      key: key,
                    ).centerMarker;
                  } else {
                    return AppMarkerDropoff(
                      address: "Drag to adjust",
                      key: key,
                    ).centerMarker;
                  }
                },
                OrderSubmissionPage.welcome =>
                  (context, key, address) =>
                      CurrentLocationMarker(key: key).marker,
                _ => null,
              },
              enableAddressResolve: state.mapViewMode == MapViewMode.picker,
              addressResolver: state.mapViewMode == MapViewMode.static
                  ? null
                  : (provider, location) async {
                      final settingsState = locator<SettingsCubit>().state;
                      final result = await locator<GeoDatasource>()
                          .getAddressForLocation(
                            latLng: location,
                            language: settingsState.locale,
                            mapProvider: settingsState.mapProvider,
                          );
                      if (result is ApiResponseError) {
                        return Place(location, "", "");
                      } else {
                        final data = (result as ApiResponseLoaded<Place>).data;
                        return Place(location, data.address, data.title);
                      }
                    },
              onMapMoved: (event) {
                if (event.type == MapMoveEventType.start) return;
                if (state.mapViewMode == MapViewMode.picker) {
                  locator<HomeBloc>().add(
                    HomeEvent.onMapMoved(
                      selectedLocation: ApiResponseLoaded(event.place),
                    ),
                  );
                }
              },
              markers: _markers(state),
              initialLocation:
                  state.waypoints.firstOrNull ?? Constants.defaultLocation,
            )),
            if (state.mode == HomeMode.rideInProgress)
              Positioned.fill(
                child: AnimatedBuilder(
                  animation: Listenable.merge([followDriverNotifier, cardHeightNotifier]),
                  builder: (context, _) => Align(
                    alignment: Alignment.bottomRight,
                    child: Padding(
                      padding: EdgeInsets.only(right: 16, bottom: cardHeightNotifier.value + 84),
                      child: followDriverNotifier.value
                          ? const SizedBox.shrink()
                          : FloatingActionButton.small(
                              heroTag: 'recenter',
                              backgroundColor: Colors.white,
                              onPressed: () {
                                followDriverNotifier.value = true;
                                state.mapViewController?.fitBounds(
                                  state.markers.nonNulls.map((e) => e.position).followedBy(state.directions.toLatLngs).toList(),
                                );
                              },
                              child: const Icon(Icons.my_location, color: Colors.black87),
                            ),
                    ),
                  ),
                ),
              ),
            ]);
          },
        );
      },
    );
  }
}
