import 'package:collection/collection.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ionicons/ionicons.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/extensions/extensions.dart' as fc_ext;
import 'package:ridy/config/locator/locator.dart';
import 'package:flutter_common/core/entities/payment_method_union.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/blocs/location.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/buttons/app_back_button.dart';
import 'package:flutter_common/core/presentation/app_card_sheet.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/card_handle.dart';
import 'package:ridy/core/graphql/fragments/ride_option.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/service_category.fragment.graphql.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:ridy/features/home/features/apply_coupon/presentation/dialogs/enter_coupon_dialog.dart';

import '../dialogs/reserve_time_dialog.dart';
import '../dialogs/ride_preferences_dialog.dart';

class ServicesSelectionSheet extends StatefulWidget {
  final List<PaymentMethodUnion> paymentMethods;
  final List<Fragment$ServiceCategory> serviceCategories;
  final double walletCredit;
  final String currency;

  const ServicesSelectionSheet({
    super.key,
    required this.paymentMethods,
    required this.serviceCategories,
    required this.walletCredit,
    required this.currency,
  });

  @override
  State<ServicesSelectionSheet> createState() => _ServicesSelectionSheetState();
}

class _ServicesSelectionSheetState extends State<ServicesSelectionSheet> {
  final homeBloc = locator<HomeBloc>();
  final couponController = TextEditingController();
  late final DateTime _weekStart;
  int _selectedDayIndex = DateTime.now().weekday - 1;
  bool _showFareBreakdown = false;
  static const _dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _weekStart = now.subtract(Duration(days: now.weekday - 1));
    if (homeBloc.state.selectedPaymentMethod == null) {
      homeBloc.onPaymentMethodSelected(const PaymentMethod$Cash());
    }
  }

  @override
  void dispose() {
    couponController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppCardSheet(
      isFullScreen: true,
      child: BlocBuilder<HomeBloc, HomeState>(
        builder: (context, state) {
          final selectedService = state.selectedService ??
              widget.serviceCategories.firstOrNull?.services.firstOrNull;
          final pickup = state.waypoints.firstOrNull ?? locator<LocationCubit>().state.place;
          final dropoff = state.waypoints.length > 1 ? state.waypoints.last : null;
          return SafeArea(
            top: false,
            child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 8),
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 8),
                          _buildBookingSummaryHero(context),
                          const SizedBox(height: 20),
                          _buildDateStrip(context),
                          const SizedBox(height: 20),
                          if (selectedService != null) _buildServiceCard(context, selectedService, widget.serviceCategories.firstOrNull?.name),
                          const SizedBox(height: 16),
                          _buildRouteSection(context, pickup, dropoff),
                          const SizedBox(height: 16),
                          _buildRidePreferencesRow(context, selectedService),
                          const SizedBox(height: 16),
                          _buildCouponBox(context),
                        ],
                      ),
                    ),
                  ),
                  Container(
                    height: 16,
                    decoration: BoxDecoration(
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 10,
                          offset: const Offset(0, -5),
                        )
                      ],
                      color: ColorPalette.neutralVariant99,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildTotalRow(context, state, selectedService),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            AppPrimaryButton(
                              isDisabled: !state.canSubmitOrder,
                              color: PrimaryButtonColor.error,
                              onPressed: () async {
                                final result = await showDialog<DateTime>(
                                  context: context,
                                  useSafeArea: false,
                                  builder: (context) =>
                                      const ReserveTimeDialog(),
                                );
                                if (result != null) {
                                  homeBloc.add(
                                    HomeEvent.submitOrder(
                                      selectedDateTime: result,
                                    ),
                                  );
                                }
                              },
                              child: const Icon(
                                Ionicons.calendar,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: AppPrimaryButton(
                                isDisabled: !state.canSubmitOrder,
                                color: PrimaryButtonColor.error,
                                onPressed: () {
                                  homeBloc.add(
                                    HomeEvent.submitOrder(
                                      selectedDateTime: DateTime.now(),
                                    ),
                                  );
                                },
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(context.translate.bookNow),
                                    const SizedBox(width: 8),
                                    const Icon(Icons.arrow_forward, size: 18, color: Colors.white),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  )
                ],
              ),
          );
        },
      ),
    );
  }

  Widget _buildBookingSummaryHero(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.red,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Stack(
        children: [
          Positioned(
            top: 0,
            right: 0,
            child: Opacity(
              opacity: 0.35,
              child: Row(
                children: const [
                  Icon(Icons.location_on, color: Colors.white, size: 16),
                  SizedBox(width: 6),
                  Icon(Icons.location_on, color: Colors.white, size: 22),
                ],
              ),
            ),
          ),
          Positioned(
            top: 26,
            right: 30,
            child: Opacity(
              opacity: 0.35,
              child: Row(
                children: const [
                  Icon(Icons.location_on, color: Colors.white, size: 14),
                  SizedBox(width: 20),
                  Icon(Icons.location_on, color: Colors.white, size: 20),
                ],
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Booking',
                style: context.titleLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              Text(
                'Summary',
                style: context.titleLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              Text(
                'Safe & Comfortable',
                style: context.bodyMedium?.copyWith(color: Colors.white70),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDateStrip(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(7, (index) {
        final date = _weekStart.add(Duration(days: index));
        final isSelected = index == _selectedDayIndex;
        return GestureDetector(
          onTap: () => setState(() => _selectedDayIndex = index),
          child: Column(
            children: [
              Text(_dayLabels[index], style: context.bodySmall?.copyWith(color: ColorPalette.neutralVariant50)),
              const SizedBox(height: 6),
              Container(
                width: 32,
                height: 32,
                alignment: Alignment.center,
                decoration: isSelected
                    ? BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.red, width: 2))
                    : null,
                child: Text(
                  date.day.toString(),
                  style: context.labelLarge?.copyWith(
                    color: isSelected ? Colors.red : ColorPalette.neutral20,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildServiceCard(BuildContext context, dynamic selectedService, String? categoryName) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: ColorPalette.neutralVariant99, borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: (selectedService.media?.address == null || (selectedService.media.address as String).isEmpty)
                ? Image.asset(
                    'assets/images/route39_auto_photo.png',
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                  )
                : CachedNetworkImage(
                    imageUrl: selectedService.media.address,
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                    fadeInDuration: Duration.zero,
                    fadeOutDuration: Duration.zero,
                    placeholder: (context, url) => Image.asset(
                      'assets/images/route39_auto_photo.png',
                      width: 56,
                      height: 56,
                      fit: BoxFit.cover,
                    ),
                    errorWidget: (context, url, error) => Image.asset(
                      'assets/images/route39_auto_photo.png',
                      width: 56,
                      height: 56,
                      fit: BoxFit.cover,
                    ),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text((categoryName ?? selectedService.name).toString().toUpperCase(),
                    style: context.bodySmall?.copyWith(color: Colors.red, fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(selectedService.name, style: context.titleMedium),
                if (selectedService.personCapacity != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Ionicons.people, size: 16, color: ColorPalette.neutralVariant50),
                      const SizedBox(width: 4),
                      Text('${selectedService.personCapacity} Seats', style: context.bodySmall),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRouteSection(BuildContext context, dynamic pickup, dynamic dropoff) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('ROUTE', style: context.bodySmall?.copyWith(color: Colors.red, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: ColorPalette.neutralVariant99, borderRadius: BorderRadius.circular(12)),
          child: Column(
            children: [
              _buildRouteRow(context, _placeLabel(pickup)),
              const Divider(height: 20, color: ColorPalette.neutral95),
              _buildRouteRow(context, _placeLabel(dropoff)),
            ],
          ),
        ),
      ],
    );
  }

  String _placeLabel(dynamic place) {
    final title = place?.title as String?;
    if (title != null && title.trim().isNotEmpty) return title;
    final address = place?.address as String?;
    if (address != null && address.trim().isNotEmpty) return address;
    return '—';
  }

  Widget _buildRouteRow(BuildContext context, String label) {
    return Row(
      children: [
        const Icon(Icons.location_on, size: 18, color: ColorPalette.neutralVariant50),
        const SizedBox(width: 8),
        Expanded(child: Text(label, style: context.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis)),
      ],
    );
  }

  Widget _buildRidePreferencesRow(BuildContext context, dynamic selectedService) {
    final baseFare = ((selectedService?.cost ?? 0) as num).toDouble();
    final total = ((selectedService?.costAfterCoupon ?? selectedService?.cost ?? 0) as num).toDouble();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(color: ColorPalette.neutralVariant99, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('SINGLE RIDE', style: TextStyle(fontWeight: FontWeight.bold)),
              TextButton.icon(
                onPressed: () {
                  setState(() => _showFareBreakdown = !_showFareBreakdown);
                },
                icon: const Text('View Details', style: TextStyle(color: Colors.red)),
                label: Icon(
                  _showFareBreakdown ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                  size: 16,
                  color: Colors.red,
                ),
              ),
            ],
          ),
          if (_showFareBreakdown) ...[
            const Divider(height: 20, color: ColorPalette.neutral95),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Base Fare', style: context.bodyMedium?.copyWith(color: ColorPalette.neutralVariant50)),
                Text(baseFare.formatCurrency(widget.currency), style: context.bodyMedium),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total', style: TextStyle(fontWeight: FontWeight.bold)),
                Text(
                  total.formatCurrency(widget.currency),
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCouponBox(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: ColorPalette.neutralVariant99, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('HAVE A COUPON CODE?', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: couponController,
                  decoration: const InputDecoration(hintText: 'ENTER COUPON CODE', isDense: true, border: OutlineInputBorder()),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                onPressed: () async {
                  await showDialog<String>(
                    context: context,
                    useSafeArea: false,
                    builder: (context) => EnterCouponDialog(calculateFareArgs: Input$CalculateFareInput(points: [])),
                  );
                },
                child: const Text('Apply', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTotalRow(BuildContext context, HomeState state, dynamic selectedService) {
    final serviceFee = selectedService?.cost ?? 0;
    final double totalAmount = ((selectedService?.costAfterCoupon ?? serviceFee) as num).toDouble();
    return Align(
      alignment: Alignment.centerLeft,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('TOTAL AMOUNT', style: context.bodySmall?.copyWith(color: ColorPalette.neutralVariant50)),
          Text(totalAmount.formatCurrency(widget.currency),
              style: context.titleLarge?.copyWith(color: Colors.black, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
