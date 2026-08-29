import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' show Colors;
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/enums/order_status.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/enums/order_status.prod.dart';
import 'package:ridy/core/extensions/extensions.dart';

class NoticeBar extends StatelessWidget {
  const NoticeBar({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<HomeBloc, HomeState>(
      builder: (context, state) {
        if (state.mode != HomeMode.rideInProgress || state.activeOrder == null) {
          return SizedBox();
        }
        final order = state.activeOrder!;
        return switch (order.status.toEntity) {
          OrderStatus.driverAccepted => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  const Icon(
                    Ionicons.time,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: StreamBuilder(
                      stream: Stream.periodic(const Duration(seconds: 1)),
                      builder: (BuildContext context, AsyncSnapshot<dynamic> snapshot) {
                        return Text(
                          order.pickupEta?.isAfter(DateTime.now()) ?? false
                              ? context.translate.driverShouldArriveInNotice
                              : context.translate.driverShouldHaveArrivedNotice,
                          style: context.labelMedium?.copyWith(
                            color: ColorPalette.neutral99,
                          ),
                        );
                      },
                    ),
                  ),
                  StreamBuilder(
                    stream: Stream.periodic(const Duration(seconds: 1)),
                    builder: (BuildContext context, AsyncSnapshot<dynamic> snapshot) {
                      if (order.pickupEta?.isBefore(DateTime.now()) ?? true) {
                        return const SizedBox();
                      }
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: ColorPalette.neutralVariant99,
                          borderRadius: BorderRadius.circular(
                            16,
                          ),
                        ),
                        child: Text(
                          _timeFromNow(
                            context,
                            order.pickupEta ?? DateTime.now(),
                          ),
                          style: context.labelSmall,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          OrderStatus.arrived => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  const Icon(
                    Ionicons.time,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      context.translate.driverArrivedNotice,
                      style: context.labelMedium?.copyWith(
                        color: ColorPalette.neutral99,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          OrderStatus.started => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  const Icon(
                    Ionicons.time,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      context.translate.headingToDestination,
                      style: context.labelMedium?.copyWith(
                        color: ColorPalette.neutral99,
                      ),
                    ),
                  ),
                  if (order.pickupEta != null)
                    StreamBuilder(
                      stream: Stream.periodic(const Duration(seconds: 1)),
                      builder: (context, state) {
                        final arrivalTime = order.pickupEta!.add(
                          Duration(
                            minutes: order.estimatedDuration ~/ 60,
                          ),
                        );
                        if (arrivalTime.isBefore(DateTime.now())) {
                          return const SizedBox();
                        }
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: ColorPalette.neutralVariant99,
                            borderRadius: BorderRadius.circular(
                              16,
                            ),
                          ),
                          child: Text(
                            _timeFromNow(
                              context,
                              arrivalTime,
                            ),
                            style: context.labelSmall,
                          ),
                        );
                      },
                    )
                ],
              ),
            ),
          _ => const SizedBox(),
        };
      },
    );
  }

  String _timeFromNow(BuildContext context, DateTime dateTime) {
    final difference = dateTime.difference(DateTime.now());
    if (difference.inMinutes > 0) {
      return context.translate.minutesRange(difference.inMinutes.toString());
    } else {
      return context.translate.secondsRange(difference.inSeconds.toString());
    }
  }
}
