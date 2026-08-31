import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';

class Route39RidePreferencesRow extends StatefulWidget {
  final String currency;
  final dynamic selectedService;

  const Route39RidePreferencesRow({super.key, required this.currency, required this.selectedService});

  @override
  State<Route39RidePreferencesRow> createState() => _Route39RidePreferencesRowState();
}

class _Route39RidePreferencesRowState extends State<Route39RidePreferencesRow> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final homeBloc = locator<HomeBloc>();
    final num baseFare = (widget.selectedService?.cost ?? 0) as num;
    final num? afterCoupon = widget.selectedService?.costAfterCoupon as num?;
    final selectedOptions = homeBloc.state.rideOptions;
    final num optionsTotal = selectedOptions.fold<num>(0, (sum, o) => sum + ((o.additionalFee ?? 0) as num));
    final num total = (afterCoupon ?? (baseFare + optionsTotal));

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(color: ColorPalette.neutralVariant99, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('SINGLE RIDE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              TextButton.icon(
                onPressed: () => setState(() => _expanded = !_expanded),
                icon: const Text('View Details', style: TextStyle(fontSize: 12, color: ColorPalette.primary40)),
                label: Icon(_expanded ? Icons.expand_less : Icons.expand_more, size: 16, color: ColorPalette.primary40),
              ),
            ],
          ),
          if (_expanded) ...[
            const Divider(height: 20, color: ColorPalette.neutral95),
            _row(context, 'Base Fare', baseFare.toDouble().formatCurrency(widget.currency)),
            if (selectedOptions.isNotEmpty)
              ...selectedOptions.map(
                (o) => Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: _row(context, o.name, ((o.additionalFee ?? 0) as num).toDouble().formatCurrency(widget.currency)),
                ),
              ),
            if (afterCoupon != null && afterCoupon != baseFare)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: _row(
                  context,
                  'Coupon Discount',
                  '- ${(baseFare + optionsTotal - afterCoupon).toDouble().formatCurrency(widget.currency)}',
                  valueColor: Colors.green,
                ),
              ),
            const Divider(height: 20, color: ColorPalette.neutral95),
            _row(context, 'Total', total.toDouble().formatCurrency(widget.currency), isBold: true),
          ],
        ],
      ),
    );
  }

  Widget _row(BuildContext context, String label, String value, {bool isBold = false, Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: isBold
              ? context.bodyMedium?.copyWith(fontWeight: FontWeight.bold, fontSize: 13)
              : context.bodyMedium?.copyWith(color: ColorPalette.neutralVariant50, fontSize: 12),
        ),
        Text(
          value,
          style: isBold
              ? context.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: Colors.black, fontSize: 15)
              : context.bodyMedium?.copyWith(color: valueColor, fontSize: 12),
        ),
      ],
    );
  }
}
