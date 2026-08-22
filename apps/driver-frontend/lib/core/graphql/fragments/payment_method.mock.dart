import 'package:ridy_driver/core/graphql/fragments/payment_method.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';
import 'package:image_faker/image_faker.dart';

final mockSavedPaymentMethod1 = Fragment$PaymentMethod$$SavedAccount(
  id: '1',
  name: 'Visa **** 4242',
  nullableId: "1",
  providerBrand: Enum$ProviderBrand.Visa,
  mode: Enum$PaymentMode.PaymentGateway,
);

final mockPaymentMethods = [mockSavedPaymentMethod1];

final mockPaymentMethod = Fragment$PaymentMethod$$OnlinePaymentMethod(
  id: '1',
  nullableId: "2",
  imageUrl: ImageFaker().paymentGateway.paypal,
  name: 'Visa **** 4242',
  linkMethod: Enum$GatewayLinkMethod.redirect,
  mode: Enum$PaymentMode.PaymentGateway,
);
