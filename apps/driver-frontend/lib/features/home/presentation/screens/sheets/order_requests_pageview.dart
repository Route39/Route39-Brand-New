import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/graphql/fragments/ride_offer.fragment.graphql.dart';
import 'package:ridy_driver/features/home/presentation/components/order_request_item.dart';
import 'package:flutter/material.dart';

import '../../blocs/home.bloc.dart';

class OrderRequestsPageView extends StatelessWidget {
  final List<Fragment$RideOffer> requests;

  const OrderRequestsPageView({
    super.key,
    required this.requests,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: SizedBox(
          height: 420,
          child: PageView.builder(
            controller: PageController(viewportFraction: 0.9),
            onPageChanged: (value) => locator<HomeBloc>().add(
              HomeEvent.onOrderRequestPageChanged(
                request: requests[value],
              ),
            ),
            itemCount: requests.length,
            itemBuilder: (context, index) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OrderRequestItem(request: requests[index]),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
