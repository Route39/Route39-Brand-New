import 'package:ridy/core/graphql/fragments/point.mock.dart';
import 'package:ridy/core/graphql/fragments/payment_method.mock.dart';
import 'package:ridy/core/graphql/fragments/service_category.mock.dart';

import 'calculate_fare.graphql.dart';

final mockCalculateFare = Query$CalculateFare(
  paymentMethods: [mockPaymentMethod],
  riderWallets: [],
  getFares: Query$CalculateFare$getFares(
    services: mockServiceCategories,
    directions: [mockPoint1, mockPoint2],
    currency: "USD",
    distance: 60000,
    duration: 5410,
  ),
);
