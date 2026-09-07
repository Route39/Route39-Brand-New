import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/datasources/location_datasource.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/current_order.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/ride_offer.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/ephemeral_message.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:ridy_driver/core/repositories/firebase_repository.dart';
import 'package:ridy_driver/features/home/domain/repositories/home_repository.dart';
import 'package:ridy_driver/gen/assets.gen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/entities/place.dart';
import 'package:generic_map/generic_map.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:injectable/injectable.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_common/config/constants.dart';

part 'home.event.dart';
part 'home.state.dart';
part 'home.bloc.freezed.dart';
// part 'home.bloc.g.dart';

@lazySingleton
class HomeBloc extends Bloc<HomeEvent, HomeState> {
  final HomeRepository _repository;
  final FirebaseRepository _firebaseRepository;
  final LocationDatasource _locationDatasource;

  HomeBloc(this._repository, this._firebaseRepository, this._locationDatasource) : super(HomeState()) {
    on<HomeEvent>((event, emit) async {
      switch (event) {
        case HomeEvent$OnStarted():
          _firebaseRepository.retrieveAndUpdateFcmToken();
          _repository.getProfile();
          _repository.refreshActiveOrders();
          _repository.getEphemeralMessages();
          add(HomeEvent.requestUpdatedOrderRequests());
          await Future.wait([
            emit.forEach(
              _repository.orderRequests.handleError((error, stack) {
                //debugPrint('HomeBloc.orderRequests stream error: $error');
              }),
              onData: (data) {
                return state.copyWith(orderRequests: data);
              },
            ),
            emit.forEach(
  _repository.activeOrders.handleError((error, stack) {
    debugPrint('[ACCEPT-DEBUG] activeOrders stream error: $error');
  }),
  onData: (data) {
    final currentOrderId = state.currentOrderId;

    debugPrint(
      '[ACCEPT-DEBUG] activeOrders STREAM UPDATE: '
      'received=${data.length}, '
      'currentOrderId=$currentOrderId',
    );

    // If the driver has just accepted an order, do not allow an
    // older websocket/stream response to remove it from the UI.
    if (currentOrderId != null) {
      final currentOrder = state.currentOrder;

      if (currentOrder != null &&
          !data.any((order) => order.id == currentOrderId)) {
        final protectedOrders = [
          ...data,
          currentOrder,
        ];

        debugPrint(
          '[ACCEPT-DEBUG] PROTECTING ACCEPTED ORDER: '
          'orderId=$currentOrderId, '
          'activeOrders=${protectedOrders.length}',
        );

        return state.copyWith(
          activeOrders: protectedOrders,
        );
      }
    }

    debugPrint(
      '[ACCEPT-DEBUG] APPLYING activeOrders STREAM: '
      'count=${data.length}',
    );

    return state.copyWith(
      activeOrders: data,
    );
  },
),
            emit.forEach(
              _repository.ephemeralMessages.handleError((error, stack) {
                //debugPrint('HomeBloc.ephemeralMessages stream error: $error');
              }),
              onData: (data) {
                return state.copyWith(ephemeralMessages: data);
              },
            ),
            emit.forEach(
              _repository.profile.handleError((error, stack) {
                //debugPrint('HomeBloc.profile stream error: $error');
              }),
              onData: (data) {
                final previousStatus = state.profileFragment.data?.status;
                final newStatus = data.data?.status;

                if (newStatus != previousStatus) {
                  if (newStatus == Enum$DriverStatus.Online || newStatus == Enum$DriverStatus.InService) {
                    _repository.startListeningToOrderUpdates();
                  }
                  if (newStatus == Enum$DriverStatus.Offline) {
                    _repository.stopListeningToOrderUpdates();
                  }
                }
                return state.copyWith(profileFragment: data);
              },
            ),
            emit.forEach(
              _locationDatasource.driverLocation.handleError((error, stack) {
                //debugPrint('HomeBloc.driverLocation stream error: $error');
              }),              onData: (data) {
                return state.copyWith(
                  driverLocation: data.data ?? state.driverLocation,
                  lastLocationUpdate: DateTime.now(),
                );
              },
            ),
          ]);
          break;

        case HomeEvent$OnStatusChanged(:final status):
          emit(state.copyWith(updateStatusResponse: ApiResponse.loading()));
          // Use current GPS location, or fall back to default city location when on web (no GPS)
          final fallbackLocation = state.driverLocation?.toPointInput ?? Input$PointInput(
            lat: Constants.defaultLocation.latLng.latitude,
            lng: Constants.defaultLocation.latLng.longitude,
          );
          final response = await _repository.updateStatus(status: status, location: fallbackLocation);
          emit(state.copyWith(updateStatusResponse: response));
          emit(state.copyWith(updateStatusResponse: ApiResponse.initial()));
          break;

        // case HomeEvent$OnLocationUpdated(:final location, :final lastLocationUpdate):
        //   final orders = await _repository.updateDriverLocation(location: location);
        //   orders.fold(
        //     (failure) => null,
        //     (orderRequests) {
        //       if (state.driverStatus is HomeStateDriverStatus$OnlineDriver) {
        //         final onlineStatus = state.driverStatus as HomeStateDriverStatus$OnlineDriver;
        //         emit(
        //           state.copyWith(
        //             driverLocation: location,
        //             lastLocationUpdate: lastLocationUpdate,
        //             driverStatus: HomeStateDriverStatus.online(
        //               orderRequests: orderRequests.updateDriversLocationNew,
        //               currentOrderRequest: onlineStatus.currentOrderRequest,
        //             ),
        //           ),
        //         );
        //       } else {
        //         emit(state.copyWith(driverLocation: location, lastLocationUpdate: lastLocationUpdate));
        //       }
        //     },
        //   );
        //   break;

        case HomeEvent$OnAcceptOrder(:final request):
  emit(
    state.copyWith(
      acceptOrderReponse: ApiResponse.loading(),
    ),
  );

  final response = await _repository.acceptOrderRequest(
  requestId: request.id,
);

if (response.isLoaded && response.data != null) {
    final acceptedOrder = response.data!;

    // The acceptRideOffer mutation has already returned the authoritative
    // accepted order. Put that exact order into Bloc state immediately.
    final updatedActiveOrders = [
      ...state.activeOrders.where(
        (order) => order.id != acceptedOrder.id,
      ),
      acceptedOrder,
    ];

    emit(
  state.copyWith(
    activeOrders: updatedActiveOrders,
    currentOrderId: acceptedOrder.id,
    page: OnTripPage.overview,
    acceptOrderReponse: ApiResponse.initial(),
  ),
);
  } else {
    emit(
      state.copyWith(
        acceptOrderReponse: response,
      ),
    );

    emit(
      state.copyWith(
        acceptOrderReponse: ApiResponse.initial(),
      ),
    );
  }

  break;

        case HomeEvent$OnCancelOrder(:final orderId, :final reasonId, :final reasonNote):
          await _repository.cancelOrder(orderId: orderId, reasonId: reasonId, reasonNote: reasonNote);
          emit(state.copyWith(
            activeOrders: state.activeOrders.where((o) => o.id != orderId).toList(),
          ));
          break;

        case HomeEvent$OnArrivedToPickupPoint(:final orderId):
          final pickupResponse = await _repository.arrivedToPickup(orderId: orderId);
          final pickupOrder = pickupResponse.data;
          emit(state.copyWith(
            activeOrders: pickupOrder != null
                ? [...state.activeOrders.where((o) => o.id != pickupOrder.id), pickupOrder]
                : state.activeOrders.where((o) => o.id != orderId).toList(),
          ));
          break;

        case HomeEvent$OnTripStarted(:final orderId):
          final tripResponse = await _repository.startTrip(orderId: orderId);
          final tripOrder = tripResponse.data;
          emit(state.copyWith(
            activeOrders: tripOrder != null
                ? [...state.activeOrders.where((o) => o.id != tripOrder.id), tripOrder]
                : state.activeOrders.where((o) => o.id != orderId).toList(),
          ));
          break;

        case HomeEvent$OnVerifyPickupOtp(:final orderId, :final otp):
          final response = await _repository.verifyPickupOtp(orderId: orderId, otp: otp);
          emit(state.copyWith(updateStatusResponse: response));

          break;

        case HomeEvent$OnArrivedToDestination(:final order):
          final destinationResponse = await _repository.arrivedToDestination(order: order);
          final destinationOrder = destinationResponse.data;
          emit(state.copyWith(
            activeOrders: destinationOrder != null
                ? [...state.activeOrders.where((o) => o.id != destinationOrder.id), destinationOrder]
                : state.activeOrders.where((o) => o.id != order.id).toList(),
          ));
          break;

        case HomeEvent$OnShowChat():
          emit(state.copyWith(page: OnTripPage.chat));
          break;

        case HomeEvent$ReviewSubmitted(:final rating, :final review, :final orderId):
          if (rating == null) {
            add(HomeEvent.onStarted());
          } else {
            await _repository.submitReview(orderId: orderId, rating: rating, review: review);
            add(HomeEvent.onStarted());
          }
          break;

        case HomeEvent$PaidInCash(:final orderId, :final amount):
final paidResponse = await _repository.paidInCash(orderId: orderId, amount: amount);
          final paidOrder = paidResponse.data;
          emit(state.copyWith(
            activeOrders: paidOrder != null
                ? [...state.activeOrders.where((o) => o.id != paidOrder.id), paidOrder]
                : state.activeOrders.where((o) => o.id != orderId).toList(),
          ));          break;

        case HomeEvent$OnSummaryConfirmed():
          // TODO: implement summary confirmation
          break;

        case HomeEvent$OnOrderRequestPageChanged(:final request):
          emit(state.copyWith(currentOrderRequest: request));
          break;

        case HomeEvent$OnHideChat():
          emit(state.copyWith(page: OnTripPage.overview));
          break;

        case HomeEvent$OnRefreshOrderRequests():
          if (state.driverLocation != null) {
            _repository.updateDriverLocation(location: state.driverLocation!);
            return;
          }
          // try every 5 seconds 2 times to get the location
          _locationDatasource.getCurrentLocation();
          for (var i = 0; i < 2; i++) {
            await Future.delayed(const Duration(seconds: 5));
            if (state.driverLocation != null) {
              _repository.updateDriverLocation(location: state.driverLocation!);
              break;
            }
          }

          break;

        case HomeEvent$MarkEphemeralMessageAsSeen(:final messageId):
          _repository.markEphemeralMessagesAsRead(messageId: messageId);
          break;
      }
    });
  }

  void onStarted() => add(HomeEvent.onStarted());

  void onStatusChanged(Enum$DriverStatus status) => add(HomeEvent.onStatusChanged(status: status));

  void onAcceptOrder(Fragment$RideOffer request) => add(HomeEvent.onAcceptOrder(request: request));

  // @override
  // HomeState? fromJson(Map<String, dynamic> json) => HomeState.fromJson(json);

  // @override
  // Map<String, dynamic>? toJson(HomeState state) => state.toJson();
}
