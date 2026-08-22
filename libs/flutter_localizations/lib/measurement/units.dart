import 'package:better_localization/localizations.dart';
import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';

enum MeasurementSystem {
  /// Metric system (meters, kilometers)
  metric,

  /// Imperial system (feet, miles)
  imperial,
}

MeasurementSystem measurementSystemFromString(String? system) =>
    switch (system?.toLowerCase()) {
      'metric' => MeasurementSystem.metric,
      'imperial' => MeasurementSystem.imperial,
      _ => MeasurementSystem.metric, // Default to metric if unknown
    };

extension DistanceFormatterX on BuildContext {
  String formatDistance(double meters, {int precision = 1}) {
    final measurementSystem =
        this
            .dependOnInheritedWidgetOfExactType<LocalizationConfig>()
            ?.effectiveMeasurementSystem ??
        MeasurementSystem.metric;

    if (measurementSystem == MeasurementSystem.imperial) {
      final miles = meters / 1609.344;

      return miles >= 0.1
          ? this.tr.distanceInMiles(miles)
          : this.tr.distanceInFeets(miles * 5280);
    } else {
      final kilometers = meters / 1000;
      return meters >= 1000
          ? this.tr.distanceInKilometers(kilometers)
          : this.tr.distanceInMeters(meters);
    }
  }

  /// Formats a percentage value according to the current locale. Like "50%"
  String formatPercentage(double value) {
    final locale = Localizations.localeOf(this).toString(); // e.g. "fr_FR"
    final formatter = NumberFormat.percentPattern(locale);
    return formatter.format(value);
  }

  String formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);

    if (hours > 0) {
      return '$hours:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    } else {
      return '${minutes}:${seconds.toString().padLeft(2, '0')}';
    }
  }

  String formatDurationFromSeconds(double seconds) {
    final duration = Duration(seconds: seconds.toInt());
    return formatDuration(duration);
  }
}
