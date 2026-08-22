import 'package:dlibphonenumber/enums/phone_number_format.dart';
import 'package:dlibphonenumber/phone_number_util.dart';

extension PhoneNumberFormatX on String {
  String formatPhoneNumber(String? countryIso) {
    if (countryIso == null || countryIso.isEmpty) {
      final sanitized = replaceAll(RegExp(r'\D'), '');
      final match = RegExp(
        r'^(\d)(\d{3})(\d{3})(\d{4})$',
      ).firstMatch(sanitized);
      if (match != null) {
        return '+${match.group(1)} (${match.group(2)}) ${match.group(3)}-${match.group(4)}';
      }
      return "+" + this;
    }
    final instance = PhoneNumberUtil.instance;
    final parsed = instance.parse(this, countryIso);
    return instance.format(parsed, PhoneNumberFormat.international);
  }
}
