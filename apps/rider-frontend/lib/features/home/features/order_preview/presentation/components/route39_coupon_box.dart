import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:ridy/features/home/features/apply_coupon/presentation/dialogs/enter_coupon_dialog.dart';

class Route39CouponBox extends StatefulWidget {
  const Route39CouponBox({super.key});

  @override
  State<Route39CouponBox> createState() => _Route39CouponBoxState();
}

class _Route39CouponBoxState extends State<Route39CouponBox> {
  final couponController = TextEditingController();

  @override
  void dispose() {
    couponController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: ColorPalette.neutralVariant99, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('HAVE A COUPON CODE?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: couponController,
                  style: const TextStyle(fontSize: 11),
                  decoration: const InputDecoration(
                    hintText: 'ENTER COUPON CODE',
                    hintStyle: TextStyle(fontSize: 10),
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: ColorPalette.primary40),
                onPressed: () async {
                  await showDialog<String>(
                    context: context,
                    useSafeArea: false,
                    builder: (context) => EnterCouponDialog(calculateFareArgs: Input$CalculateFareInput(points: [])),
                  );
                },
                child: const Text('Apply', style: TextStyle(fontSize: 11)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
