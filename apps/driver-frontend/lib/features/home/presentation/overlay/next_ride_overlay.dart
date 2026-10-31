import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/features/home/domain/repositories/home_repository.dart';
import 'package:ridy_driver/core/enums/ride_option_icon.prod.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/coordinate.extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/ride_offer.fragment.graphql.dart';
import 'package:ridy_driver/features/home/presentation/blocs/home.bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/enums/ride_option_icon.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/waypoints_view/waypoints_view.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/presentation/small_chip.dart';
import 'package:ridy_driver/features/home/presentation/blocs/home.bloc.dart';

class NextRideOverlay extends StatelessWidget {
  final Fragment$RideOffer request;
  const NextRideOverlay({super.key, required this.request});

  static const _red = Color(0xFFB71C1C);

  String _addr(int i) {
    final places = request.waypoints.toPlaces as List;
    if (places.isEmpty) return '-';
    final p = i < 0 ? places.last : (i < places.length ? places[i] : null);
    return ((p as dynamic)?.address ?? '-').toString();
  }

  Widget _stop(IconData icon, Color c, String label, String addr) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(padding: const EdgeInsets.only(top: 3), child: Icon(icon, size: 14, color: c)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600)),
              Text(addr, maxLines: 2, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            ]),
          ),
        ]),
      );

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black26,
      child: SafeArea(
        child: Align(
          alignment: Alignment.topCenter,
          child: SingleChildScrollView(
            child: Container(
              margin: const EdgeInsets.fromLTRB(12, 16, 12, 0),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 20, offset: Offset(0, 4))],
              ),
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: Colors.orange.shade700, borderRadius: BorderRadius.circular(8)),
                    child: const Text('NEXT RIDE',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white)),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xFFF2F2F2), borderRadius: BorderRadius.circular(8)),
                    child: Text(request.serviceName,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                  ),
                ]),
                const SizedBox(height: 6),
                const Text('Pickup after your current trip',
                    style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Text(request.fareEstimate.formatCurrency(request.currency),
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900)),
                Text('${request.distance.toFormattedDistance(context)}  •  ${request.duration ~/ 60} min',
                    style: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                _stop(Icons.circle, Colors.green, 'Pickup', _addr(0)),
                _stop(Icons.arrow_downward, _red, 'Drop', _addr(-1)),
                const SizedBox(height: 6),
                Row(children: [
                  SizedBox(
                    width: 56, height: 56,
                    child: IconButton(
                      style: IconButton.styleFrom(side: const BorderSide(color: _red, width: 2)),
                      icon: const Icon(Icons.close),
                      onPressed: () => locator<HomeRepository>().rejectOrderRequest(requestId: request.id),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: SizedBox(
                      height: 56,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _red, foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                        ),
                        onPressed: () => locator<HomeBloc>().onAcceptOrder(request),
                        child: const Text('Accept', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                      ),
                    ),
                  ),
                ]),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
