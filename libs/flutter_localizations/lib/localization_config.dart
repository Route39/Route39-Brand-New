import 'package:better_localization/measurement/units.dart';
import 'package:flutter/widgets.dart';

class LocalizationConfig extends InheritedWidget {
  const LocalizationConfig({
    super.key,
    required this.measurementSystem,
    required this.defaultCurrency,
    required this.defaultLanguage,
    required this.defaultLatitude,
    required this.defaultLongitude,
    required this.is24HourFormat,
    required super.child,
  });

  /// The measurement system to use for localization. defaults to metric
  final MeasurementSystem? measurementSystem;

  /// The default currency to use for localization. defaults to USD
  final String? defaultCurrency;

  /// The default language to use for localization. defaults to English
  final String? defaultLanguage;

  /// The default latitude to use for localization. defaults to 37.3875
  final double? defaultLatitude;

  /// The default longitude to use for localization. defaults to -122.0575
  final double? defaultLongitude;

  /// The default value for 24-hour format to use for localization. defaults to false
  final bool? is24HourFormat;

  // Getters with fallback to defaults
  MeasurementSystem get effectiveMeasurementSystem =>
      measurementSystem ?? MeasurementSystem.metric;

  String get effectiveDefaultCurrency => defaultCurrency ?? 'USD';
  String get effectiveDefaultLanguage => defaultLanguage ?? 'en';
  double get effectiveDefaultLatitude => defaultLatitude ?? 37.3875;
  double get effectiveDefaultLongitude => defaultLongitude ?? -122.0575;
  bool get effectiveIs24HourFormat => is24HourFormat ?? false;

  static LocalizationConfig? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<LocalizationConfig>();
  }

  @override
  bool updateShouldNotify(LocalizationConfig oldWidget) {
    return measurementSystem != oldWidget.measurementSystem ||
        defaultCurrency != oldWidget.defaultCurrency ||
        defaultLanguage != oldWidget.defaultLanguage ||
        defaultLatitude != oldWidget.defaultLatitude ||
        defaultLongitude != oldWidget.defaultLongitude ||
        is24HourFormat != oldWidget.is24HourFormat;
  }
}
