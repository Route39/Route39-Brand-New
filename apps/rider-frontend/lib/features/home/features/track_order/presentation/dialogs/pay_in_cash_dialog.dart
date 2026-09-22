import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/enums/order_status.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/enums/order_status.prod.dart';
import 'package:ridy/core/extensions/extensions.dart';

const _cashPaymentPendingBoxName = 'cash_payment_pending';

class PayInCashDialog extends StatefulWidget {
  const PayInCashDialog({super.key});

  @override
  State<PayInCashDialog> createState() => _PayInCashDialogState();
}

class _PayInCashDialogState extends State<PayInCashDialog> {
  bool _isWaiting = false;

  @override
  void initState() {
    super.initState();
    _restorePendingState();
  }

  Future<void> _restorePendingState() async {
    final orderId = locator<HomeBloc>().state.activeOrder?.id;
    if (orderId == null) return;
    final box = await Hive.openBox<bool>(_cashPaymentPendingBoxName);
    if (mounted && box.get(orderId) == true) {
      setState(() => _isWaiting = true);
    }
  }

  Future<void> _markPending(String? orderId) async {
    if (orderId == null) return;
    final box = await Hive.openBox<bool>(_cashPaymentPendingBoxName);
    await box.put(orderId, true);
  }

  Future<void> _clearPending(String? orderId) async {
    if (orderId == null) return;
    final box = await Hive.openBox<bool>(_cashPaymentPendingBoxName);
    await box.delete(orderId);
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<HomeBloc, HomeState>(
      bloc: locator<HomeBloc>(),
      listenWhen: (previous, current) =>
          _isWaiting &&
          previous.activeOrder?.status.toEntity.viewMode ==
              OrderStatusViewMode.waitingForPayment &&
          current.activeOrder?.status.toEntity.viewMode !=
              OrderStatusViewMode.waitingForPayment,
      listener: (context, state) async {
        await _clearPending(state.activeOrder?.id);
        if (!mounted) return;
        Navigator.of(context).maybePop();
context.showSnackBar(
          message: 'Payment received',
          backgroundColor: ColorPalette.primary40,
        );      },
      buildWhen: (previous, current) => previous.activeOrder?.status != current.activeOrder?.status,
      builder: (context, state) {
        return AppResponsiveDialog(          header: _isWaiting
              ? null
              : (
                  Ionicons.cash,
                  context.translate.payInCash,
                  context.translate.payInCashDescription,
                ),
          iconColor: ColorPalette.primary40,
          primaryButton: _isWaiting
              ? null
              : SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    onPressed: () {
                      _markPending(state.activeOrder?.id);
                      setState(() => _isWaiting = true);
                    },
                    child: Text(context.translate.confirm, style: const TextStyle(color: Colors.white)),
                  ),
                ),
          type: context.responsive(
            DialogType.bottomSheet,
            xl: DialogType.dialog,
          ),
          child: _isWaiting
              ? Padding(
                  padding: const EdgeInsets.symmetric(vertical: 32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(
                        width: 32,
                        height: 32,
                        child: CircularProgressIndicator(strokeWidth: 3),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        context.translate.waitingForDriverToConfirmPayment,
                        textAlign: TextAlign.center,
                        style: context.bodyMedium,
                      ),
                    ],
                  ),
                )
              : Container(),        );
      },
    );
  }
}