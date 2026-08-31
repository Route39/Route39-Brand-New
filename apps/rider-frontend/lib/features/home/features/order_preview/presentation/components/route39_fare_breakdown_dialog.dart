import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';

class Route39FareBreakdownDialog extends StatelessWidget {
  final dynamic selectedService;
  final String currency;

  const Route39FareBreakdownDialog({super.key, required this.selectedService, required this.currency});

  @override
  Widget build(BuildContext context) {
    final homeBloc = locator<HomeBloc>();
    final num baseFare = (selectedService?.cost ?? 0) as num;
    final num? afterCoupon = selectedService?.costAfterCoupon as num?;
    final selectedOptions = homeBloc.state.rideOptions;
    final num optionsTotal = selectedOptions.fold<num>(0, (sum, o) => sum + ((o.additionalFee ?? 0) as num));
    final num total = (afterCoupon ?? (baseFare + optionsTotal));

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Fare Breakdown', style: context.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _row(context, 'Base Fare', baseFare.toDouble().formatCurrency(currency)),
            if (selectedOptions.isNotEmpty) ...[
              const SizedBox(height: 8),
              ...selectedOptions.map(
                (o) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _row(context, o.name, ((o.additionalFee ?? 0) as num).toDouble().formatCurrency(currency)),
                ),
              ),
            ],
            if (afterCoupon != null && afterCoupon != baseFare) ...[
              const SizedBox(height: 8),
              _row(
                context,
                'Coupon Discount',
                '- ${(baseFare + optionsTotal - afterCoupon).toDouble().formatCurrency(currency)}',
                valueColor: Colors.green,
              ),
            ],
            const Divider(height: 24),
            _row(
              context,
              'Total',
              total.toDouble().formatCurrency(currency),
              isBold: true,
            ),
          ],
        ),
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
              ? context.bodyMedium?.copyWith(fontWeight: FontWeight.bold)
              : context.bodyMedium?.copyWith(color: ColorPalette.neutralVariant50),
        ),
        Text(
          value,
          style: isBold
              ? context.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: ColorPalette.primary40)
              : context.bodyMedium?.copyWith(color: valueColor),
        ),
      ],
    );
  }
}
