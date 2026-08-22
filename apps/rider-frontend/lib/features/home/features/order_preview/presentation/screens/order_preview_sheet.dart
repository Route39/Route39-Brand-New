import 'package:api_response/api_response.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:generic_map/interfaces/place.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:flutter_common/core/presentation/app_card_sheet.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/blocs/payment_methods.bloc.dart';
import 'package:ridy/core/graphql/fragments/payment_method.extensions.dart';
import 'package:ridy/features/home/features/order_preview/presentation/dialogs/reserve_success_dialog.dart';
import 'package:ridy/features/home/features/order_preview/presentation/screens/service_selection_sheet.dart';
import 'package:ridy/gen/assets.gen.dart';

class OrderPreviewSheet extends StatefulWidget {
  final List<Place> wayPoints;

  const OrderPreviewSheet({
    super.key,
    required this.wayPoints,
  });

  @override
  State<OrderPreviewSheet> createState() => _OrderPreviewSheetState();
}

class _OrderPreviewSheetState extends State<OrderPreviewSheet> with TickerProviderStateMixin {
  @override
  void initState() {
    super.initState();
    locator<PaymentMethodsBloc>().load();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: locator<PaymentMethodsBloc>(),
      child: BlocConsumer<HomeBloc, HomeState>(
        listenWhen: (previous, current) =>
            (previous.scheduledRidesResponse.data?.length ?? 0) > (current.scheduledRidesResponse.data?.length ?? 0),
        listener: (context, state) {
          if (state.createOrderResponse.isLoaded) {
            showDialog(context: context, useSafeArea: false, builder: (context) => const ReserveSuccessDialog());
          }
        },
        builder: (context, state) {
          return AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: switch (state.ridePreviewFareResponse) {
              ApiResponseInitial() => const SizedBox.shrink(),
              ApiResponseError(:final errorMessage) => Text(errorMessage ?? 'An error occurred'),
              ApiResponseLoading() => AppCardSheet(
                  child: Assets.lottie.loading.lottie(
                    width: double.infinity,
                    height: 400,
                  ),
                ),
              ApiResponseLoaded(
                :final data,
              ) =>
                BlocBuilder<PaymentMethodsBloc, PaymentMethodsState>(
                  builder: (context, statePaymentMethod) {
                    return ServicesSelectionSheet(
                      paymentMethods: statePaymentMethod.paymentMethods.mapData((data) => data.entities).data ?? [],
                      serviceCategories: data.getFares.services,
                      currency: data.getFares.currency,
                      walletCredit: data.riderWallets
                              .firstWhereOrNull(
                                (wallet) => wallet.currency == data.getFares.currency,
                              )
                              ?.balance ??
                          0,
                    );
                  },
                ),
            },
          );
        },
      ),
    );
  }
}
