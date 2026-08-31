import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';

class Route39TotalRow extends StatelessWidget {
  final HomeState state;
  final dynamic selectedService;
  final String currency;

  const Route39TotalRow({
    super.key,
    required this.state,
    required this.selectedService,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    final num serviceFee = (selectedService?.cost ?? 0) as num;
    final double totalAmount = ((selectedService?.costAfterCoupon ?? serviceFee) as num).toDouble();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('TOTAL AMOUNT', style: context.bodySmall?.copyWith(color: ColorPalette.neutralVariant50, fontSize: 10)),
        Text(totalAmount.formatCurrency(currency),
            style: context.titleLarge?.copyWith(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 20)),
      ],
    );
  }
}
