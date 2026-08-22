import 'package:flutter_common/core/entities/payment_gateway.dart';
import 'package:flutter_common/core/entities/payment_method_union.dart';
import 'package:flutter_common/core/entities/saved_payment_method.dart';
import 'package:flutter_common/core/enums/card_type.dart';
import 'package:flutter_common/core/enums/gateway_link_method.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';

import 'payment_method.fragment.graphql.dart';

extension PaymentMethodX on Fragment$PaymentMethod {
  PaymentMethodUnion get entity => switch (this) {
        Fragment$PaymentMethod$$CashPaymentMethod() => PaymentMethod$Cash(),
        Fragment$PaymentMethod$$WalletPaymentMethod() => PaymentMethod$Wallet(),
        Fragment$OnlinePaymentMethod(:final id, :final name, :final imageUrl, :final linkMethod) => PaymentGateway(
            paymentGateway: PaymentGatewayEntity(
                id: id,
                name: name,
                logoUrl: imageUrl,
                linkMethod: switch (linkMethod) {
                  Enum$GatewayLinkMethod.redirect => GatewayLinkMethod.redirect,
                  Enum$GatewayLinkMethod.manual => GatewayLinkMethod.manual,
                  Enum$GatewayLinkMethod.none => GatewayLinkMethod.none,
                  _ => throw Exception('Unknown gateway link method: $linkMethod'),
                }),
          ),
        Fragment$SavedAccount(:final id, :final name, :final providerBrand) => SavedPaymentMethod(
            savedPaymentMethod: SavedPaymentMethodEntity(
              id: id,
              last4Digits: name,
              expiryDate: '--/--',
              isDefault: false,
              isEnabled: true,
              cardHolderName: name,
              cardType: switch (providerBrand) {
                Enum$ProviderBrand.Visa => CardType.visa,
                Enum$ProviderBrand.Mastercard => CardType.mastercard,
                Enum$ProviderBrand.Amex => CardType.amex,
                Enum$ProviderBrand.Discover => CardType.discover,
                _ => throw Exception('Unknown card brand: $providerBrand'),
              },
            ),
          ),
        Fragment$PaymentMethod() => throw Exception('Unknown payment method type'),
      };
}

extension PaymentMethodListX on List<Fragment$PaymentMethod> {
  List<PaymentMethodUnion> get entities => map((e) => e.entity).toList();

  List<Fragment$PaymentMethod$$OnlinePaymentMethod> get onlineMethods =>
      whereType<Fragment$PaymentMethod$$OnlinePaymentMethod>().toList();

  List<Fragment$SavedAccount> get savedAccounts => whereType<Fragment$SavedAccount>().toList();
}
