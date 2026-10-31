import '../components/pickup_wait_timer.dart';
import '../dialogs/cancel_ride_reason.dart';
import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter_ringtone_player/flutter_ringtone_player.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/enums/order_status.dart';
import 'package:generic_map/interfaces/place.dart';
import 'package:google_navigation_flutter/google_navigation_flutter.dart' as gnav;
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/enums/order_status.prod.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.extensions.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:ridy_driver/core/presentation/slider_button.dart';
import '../blocs/home.bloc.dart';
import '../dialogs/pickup_otp_dialog.dart';

class TurnByTurnNavigationScreen extends StatefulWidget {
  static bool isOpen = false;
  final Place place;
  const TurnByTurnNavigationScreen({super.key, required this.place});
  @override
  State<TurnByTurnNavigationScreen> createState() => _TurnByTurnNavigationScreenState();
}

class _TurnByTurnNavigationScreenState extends State<TurnByTurnNavigationScreen> {
  bool _ready = false, _viewReady = false;
  bool _near = false;
  StreamSubscription? _distSub;
  String? _error, _destKey;

  @override
  void initState() { super.initState(); TurnByTurnNavigationScreen.isOpen = true; _init(); }

  Future<void> _init() async {
    try {
      var ok = await gnav.GoogleMapsNavigator.areTermsAccepted();
      if (!ok) ok = await gnav.GoogleMapsNavigator.showTermsAndConditionsDialog('Route39 Pilot', 'Route39 Mobility');
      if (!ok) { if (mounted) Navigator.pop(context); return; }
      await gnav.GoogleMapsNavigator.initializeNavigationSession();
      if (mounted) setState(() => _ready = true);
    } catch (e) { if (mounted) setState(() => _error = e.toString()); }
  }

  Future<void> _onViewCreated(gnav.GoogleNavigationViewController c) async {
    await c.setMyLocationEnabled(true);
    _viewReady = true;
    _distSub = gnav.GoogleMapsNavigator.setOnRemainingTimeOrDistanceChangedListener((e) {
      final near = e.remainingDistance <= 50;
      if (near && !_near) {
        HapticFeedback.heavyImpact();
        FlutterRingtonePlayer().playNotification();
      }
      if (near != _near && mounted) setState(() => _near = near);
    }, remainingTimeThresholdSeconds: 5, remainingDistanceThresholdMeters: 5);
    await _routeTo(widget.place);
  }

  Future<void> _routeTo(Place place) async {
    final key = '${place.latLng.latitude},${place.latLng.longitude}';
    if (key == _destKey) return;
    _destKey = key;
    if (mounted) setState(() => _near = false);
    final dest = gnav.Destinations(
      waypoints: [gnav.NavigationWaypoint.withLatLngTarget(title: 'Destination',
        target: gnav.LatLng(latitude: place.latLng.latitude, longitude: place.latLng.longitude))],
      displayOptions: gnav.NavigationDisplayOptions(showDestinationMarkers: true),
    );
    for (var i = 0; i < 10; i++) {
      final s = await gnav.GoogleMapsNavigator.setDestinations(dest);
      if (s == gnav.NavigationRouteStatus.statusOk) { await gnav.GoogleMapsNavigator.startGuidance(); return; }
      if (s != gnav.NavigationRouteStatus.locationUnavailable) { if (mounted) setState(() => _error = 'Route error: $s'); return; }
      await Future.delayed(const Duration(seconds: 1));
    }
    if (mounted) setState(() => _error = 'Location unavailable');
  }

  @override
  void dispose() {
    TurnByTurnNavigationScreen.isOpen = false;
    _distSub?.cancel();
    gnav.GoogleMapsNavigator.stopGuidance();
    gnav.GoogleMapsNavigator.cleanup();
    super.dispose();
  }

  Future<void> _call(String? raw) async {
    var digits = (raw ?? '').replaceAll(RegExp(r'[^0-9+]'), '');
    if (digits.isEmpty) return;
    if (!digits.startsWith('+')) digits = digits.length == 10 ? '+91$digits' : '+$digits';
    await launchUrlString(Uri(scheme: 'tel', path: digits).toString());
  }

  void _close() { if (mounted && Navigator.canPop(context)) Navigator.pop(context); }

  @override
  Widget build(BuildContext context) {
    return BlocListener<HomeBloc, HomeState>(
      bloc: locator<HomeBloc>(),
      listener: (context, state) {
        if (state.driverStatus != HomeStateDriverStatus.onTrip ||
            state.currentOrder?.status == Enum$OrderStatus.WaitingForPostPay) { _close(); return; }
        final p = state.currentOrder?.nextDestination?.location.toPlace;
        if (p != null && _viewReady) _routeTo(p);
      },
      child: Scaffold(
        body: Column(children: [
          Expanded(child: Stack(children: [
            if (_error != null)
              Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!, textAlign: TextAlign.center)))
            else if (!_ready)
              const Center(child: CircularProgressIndicator())
            else
              gnav.GoogleMapsNavigationView(
                onViewCreated: _onViewCreated,
                initialNavigationUIEnabledPreference: gnav.NavigationUIEnabledPreference.automatic,
              ),
            Positioned(right: 12, top: MediaQuery.of(context).padding.top + 210,
              child: FloatingActionButton.small(heroTag: 'navClose', onPressed: _close, child: const Icon(Icons.close))),
            Positioned(right: 12, top: MediaQuery.of(context).padding.top + 270,
              child: Material(elevation: 4, shape: const CircleBorder(), color: Colors.white,
                child: PopupMenuButton<String>(icon: const Icon(Icons.more_vert),
                  onSelected: (v) {
                    final o = locator<HomeBloc>().state.currentOrder;
                    if (v == 'cancel' && o != null) {
                      showDialog(context: context, useSafeArea: false, builder: (_) => CancelRideReasonDialog(orderId: o.id));
                    }
                  },
                  itemBuilder: (_) => const [PopupMenuItem(value: 'cancel', child: Text('Cancel ride', style: TextStyle(color: Colors.red)))],
                ))),
            Positioned(left: 12, top: MediaQuery.of(context).padding.top + 210,
              child: BlocBuilder<HomeBloc, HomeState>(bloc: locator<HomeBloc>(), builder: (context, st) {
                final s = st.currentOrder?.status.toEntity;
                if (s == null) return const SizedBox.shrink();
                final drop = s == OrderStatus.started;
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(color: drop ? Colors.red.shade600 : Colors.green.shade600, borderRadius: BorderRadius.circular(20)),
                  child: Text(drop ? 'DROP' : 'PICKUP', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 1)),
                );
              })),
          ])),
          _bottomPanel(),
        ]),
      ),
    );
  }

  Widget _bottomPanel() {
    return BlocBuilder<HomeBloc, HomeState>(
      bloc: locator<HomeBloc>(),
      builder: (context, state) {
        final order = state.currentOrder;
        if (order == null) return const SizedBox.shrink();
        final status = order.status.toEntity;
        Widget? slider;
        if (status == OrderStatus.driverAccepted) {
          slider = SliderButton(text: context.translate.slideToConfirmArrival,
            onSlided: () => locator<HomeBloc>().add(HomeEvent.onArrivedToPickupPoint(orderId: order.id)));
        } else if (status == OrderStatus.arrived) {
          slider = SliderButton(text: context.translate.slideToConfirmPickup, onSlided: () {
            if (!order.pickupOtpRequired) {
              locator<HomeBloc>().add(HomeEvent.onStripStarted(orderId: order.id));
            } else {
              showDialog(context: context, useSafeArea: false, builder: (_) => PickupOtpDialog(
                orderId: order.id, isCargo: order.type == Enum$TaxiOrderType.ParcelDelivery, arrivedAt: order.arrivedAt));
            }
          });
        } else if (status == OrderStatus.started) {
          slider = SliderButton(text: context.translate.slideToConfirmDropoff,
            onSlided: () => locator<HomeBloc>().add(HomeEvent.onArrivedToDestination(order: order)));
        }
        final rider = order.rider;
        final img = rider?.profileImageUrl ?? '';
        final fare = '₹${(order.totalCost as num?)?.toStringAsFixed(0) ?? '-'}';
        final pm = order.paymentMethod.mode.toString().toLowerCase();
        final pay = pm.contains('cash') ? 'Cash' : pm.contains('wallet') ? 'Wallet' : 'UPI / Online';
        final card = Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 8, 0),
          child: Row(children: [
            CircleAvatar(radius: 20, backgroundColor: const Color(0x1AB30000),
              backgroundImage: img.isNotEmpty ? NetworkImage(img) : null,
              child: img.isNotEmpty ? null : const Icon(Icons.person, color: Color(0xFFB30000))),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              Text(rider?.fullName ?? 'Customer', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
              Text('$fare • $pay', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFFB30000))),
            ])),
            Badge(isLabelVisible: order.unreadMessagesCount > 0, label: Text('${order.unreadMessagesCount}'),
              child: IconButton.filledTonal(icon: const Icon(Icons.chat_bubble), onPressed: () {
                _close();
                locator<HomeBloc>().add(const HomeEvent.onShowChat());
              })),
            const SizedBox(width: 4),
            IconButton.filledTonal(icon: const Icon(Icons.call), onPressed: () => _call(rider?.mobileNumber)),
          ]),
        );
        return Material(elevation: 8, child: SafeArea(top: false, child: Column(mainAxisSize: MainAxisSize.min, children: [
          card,
          if (slider != null && _near) Container(
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(10, 10, 10, 0),
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
            decoration: BoxDecoration(color: Colors.green.shade600, borderRadius: BorderRadius.circular(12)),
            child: Text(status == OrderStatus.started ? 'Drop point reached — slide to complete' : 'Pickup point reached — slide to confirm',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
          if (status == OrderStatus.arrived) Padding(padding: const EdgeInsets.fromLTRB(10, 8, 10, 0),
            child: PickupWaitTimer(arrivedAt: order.arrivedAt, freeWaitMinutes: order.cargoWaitingTimeMinutes)),
          if (slider != null) Padding(padding: const EdgeInsets.fromLTRB(10, 10, 10, 6), child: slider),
        ])));
      },
    );
  }
}
