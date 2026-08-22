import 'package:better_localization/localizations.dart';
import 'package:ridy_driver/core/graphql/fragments/phone_number.fragment.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';

extension PhoneNumberInputGql on Input$PhoneNumberInput {
  Fragment$phoneNumber get toFragment => Fragment$phoneNumber(number: number, countryCode: countryCode);

  (CountryCode, String) get toTuple => (CountryCode.parseByIso(countryCode)!, number);
}

extension PhoneNumberFragmentGql on Fragment$phoneNumber {
  Input$PhoneNumberInput get toInput => Input$PhoneNumberInput(number: number, countryCode: countryCode);
}

extension PhoneNumberTupleX on (CountryCode, String?) {
  Input$PhoneNumberInput get toInput => Input$PhoneNumberInput(number: $2 ?? "", countryCode: $1.iso2CountryCode);
}
