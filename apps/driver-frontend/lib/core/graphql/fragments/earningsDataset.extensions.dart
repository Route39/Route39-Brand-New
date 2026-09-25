import 'package:collection/collection.dart';
import 'package:ridy_driver/config/theme/fonts.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/core/graphql/documents/earnings.graphql.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';

extension EarningsdatasetX on Query$Earnings {
  double get totalEarnings => getStatsNew.dataset.fold(
    0,
    (previousValue, element) => previousValue + element.earning,
  );

  double get totalRides => getStatsNew.dataset.fold(
    0,
    (previousValue, element) => previousValue + element.count,
  );

  double get totalTimeSpent => getStatsNew.dataset.fold(
    0,
    (previousValue, element) => previousValue + element.time,
  );

  double get totalDistanceTraveled => getStatsNew.dataset.fold(
    0,
    (previousValue, element) => previousValue + element.distance,
  );

  BarChartData get barChartData {
    final barGroups = getStatsNew.dataset
        .mapIndexed(
          (index, e) => BarChartGroupData(
            x: index,
            barRods: [
              BarChartRodData(
                toY: e.earning,
                color: ColorPalette.primary30,
                width: 16,
              ),
            ],
          ),
        )
        .toList();

    final maxEarning = barGroups.isEmpty
        ? 0.0
        : barGroups
              .map((g) => g.barRods.first.toY)
              .reduce((a, b) => a > b ? a : b);
    // Aim for ~5 labels on the Y axis regardless of the data's scale,
    // instead of a fixed interval that produces far too many labels
    // (and garbled, overlapping text) once earnings run into the
    // hundreds or thousands.
    final leftInterval = maxEarning <= 0 ? 1.0 : (maxEarning / 5).ceilToDouble();

    return BarChartData(
      barTouchData: BarTouchData(enabled: false),
      titlesData: FlTitlesData(
        show: true,
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 40,
            getTitlesWidget: (value, meta) {
              return Transform.rotate(
                angle: -45 * 3.14 / 180,
                child: Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    getStatsNew.dataset[value.toInt()].name,
                    style: const TextStyle(
                      color: Color(0xFF73777F),
                      fontSize: 10,
                      fontFamily: Fonts.secondary,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        rightTitles: const AxisTitles(
          sideTitles: SideTitles(showTitles: false),
        ),
        topTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 28,
            getTitlesWidget: (value, meta) => const SizedBox.shrink(),
          ),
        ),
        leftTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 52,
            interval: leftInterval,
            getTitlesWidget: (value, meta) {
              return Padding(
                padding: const EdgeInsets.only(right: 2),
                child: Text(
                  value.formatCurrency(getStatsNew.currency),
                  textAlign: TextAlign.right,
                  softWrap: false,
                  overflow: TextOverflow.clip,
                  style: const TextStyle(
                    color: Color(0xFF73777F),
                    fontSize: 9,
                    fontFamily: Fonts.secondary,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              );
            },
          ),
        ),
      ),
      gridData: const FlGridData(show: false),
      borderData: FlBorderData(show: false),
      barGroups: barGroups,
    );
  }
}
