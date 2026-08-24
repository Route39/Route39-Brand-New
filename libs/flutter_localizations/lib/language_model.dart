import 'package:better_localization/gen/assets.gen.dart';

class Language {
  final AssetGenImage image;
  final String name;
  final String code;

  Language({required this.image, required this.name, required this.code});
}

extension LanguageListX on List<Language> {
  Language getLanguageByCode(String code) {
    return firstWhere((element) => element.code == code);
  }
}

List<Language> supportedLanguages = [
  Language(image: LocaleAssets.countries.usSvg, name: 'English', code: 'en'),
  Language(image: LocaleAssets.countries.inSvg, name: 'Tamil', code: 'ta'),
];

