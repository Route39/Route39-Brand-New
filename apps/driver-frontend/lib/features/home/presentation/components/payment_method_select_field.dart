import 'package:ridy_driver/core/graphql/fragments/current_order.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ionicons/ionicons.dart';

class PaymentMethodSelectField extends StatelessWidget {
  final Fragment$ActiveOrder order;
  final Function()? onPressed;

  PaymentMethodSelectField({
    super.key,
    required this.order,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return CupertinoButton(
      padding: EdgeInsets.zero,
      onPressed: onPressed,
      minimumSize: Size(0, 0),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: backgroundColor,
          border: Border.all(color: borderColor),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            icon(context),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                order.paymentMethod.mode == Enum$PaymentMode.Cash
                    ? context.translate.cash
                    : context.translate.online,
                style: context.labelMedium,
              ),
            ),
            Text(
              order.totalCost.formatCurrency(order.currency),
              style: context.labelMedium?.copyWith(
                color: const Color(0xFFE00000),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color get borderColor => const Color(0xFFFFE5E5);
  Color get backgroundColor => Colors.transparent;

  Color get textColor => ColorPalette.neutral10;

  Color get chevronColor => ColorPalette.neutral70;

  Color get iconColor => const Color(0xFFB30000);

  Widget icon(BuildContext context) =>
      order.paymentMethod.mode == Enum$PaymentMode.Cash
      ? Icon(Ionicons.cash, color: iconColor)
      : Icon(Ionicons.card, color: iconColor);
}
