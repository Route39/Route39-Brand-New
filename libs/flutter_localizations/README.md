# better_localization

A shared localization library for BetterSuite Flutter applications.

## Features

- Multi-language support (30+ languages)
- Country code utilities with phone number parsing
- Measurement unit conversions
- Easy-to-use `BuildContext` extension for translations

## Usage

```dart
import 'package:better_localization/localizations.dart';

// Access translations via context extension
Text(context.tr.someTranslationKey);

// Parse country codes
final country = CountryCode.parseByIso('US');

// Get all country codes
final allCountries = CountryCode.getAll();
```

## Supported Languages

Arabic, Bengali, German, English, Spanish, Estonian, Persian, Finnish, French, Hindi, Armenian, Indonesian, Italian, Japanese, Korean, Malay, Dutch, Norwegian, Polish, Portuguese, Romanian, Russian, Swedish, Thai, Turkish, Ukrainian, Urdu, Vietnamese, Chinese.
