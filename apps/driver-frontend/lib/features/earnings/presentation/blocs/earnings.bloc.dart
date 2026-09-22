import 'package:api_response/api_response.dart';
import 'package:ridy_driver/core/graphql/documents/earnings.graphql.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';

import 'package:ridy_driver/features/earnings/domain/repositories/earnings_repository.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:injectable/injectable.dart';

part 'earnings.state.dart';
part 'earnings.bloc.freezed.dart';

@lazySingleton
class EarningsBloc extends Cubit<EarningsState> {
  final EarningsRepository _repository;

  EarningsBloc(this._repository) : super(EarningsState.initial());

  void fetchEarningsDataset() async {
    emit(
      state.copyWith(
        earningsState: ApiResponse.loading(),
      ),
    );

    final earningsDatasetResponse = await _repository.getEarningsDataset(
      timeFrame: state.timeframe,
      startDate: state.startDate,
      endDate: state.endDate,
    );

    emit(state.copyWith(
      earningsState: earningsDatasetResponse,
    ));
  }

  Duration _windowFor(Enum$TimeQuery timeFrame) => switch (timeFrame) {
        Enum$TimeQuery.Daily => const Duration(days: 1),
        Enum$TimeQuery.Weekly => const Duration(days: 7),
        Enum$TimeQuery.Monthly => const Duration(days: 180),
        _ => const Duration(days: 180),
      };

  void setTimeFrame(Enum$TimeQuery timeFrame) {
    final now = DateTime.now();
    emit(state.copyWith(
      timeframe: timeFrame,
      endDate: now,
      startDate: timeFrame == Enum$TimeQuery.Daily ? now : now.subtract(_windowFor(timeFrame)),
    ));
    fetchEarningsDataset();
  }

  void previousTimeframe() {
    final isDaily = state.timeframe == Enum$TimeQuery.Daily;
    final newStart = state.startDate.subtract(_windowFor(state.timeframe));
    emit(state.copyWith(
      startDate: newStart,
      endDate: isDaily ? newStart : state.startDate,
    ));
    fetchEarningsDataset();
  }

  void nextTimeframe() {
    final isDaily = state.timeframe == Enum$TimeQuery.Daily;
    final newEnd = state.endDate.add(_windowFor(state.timeframe));
    emit(state.copyWith(
      startDate: isDaily ? newEnd : state.endDate,
      endDate: newEnd,
    ));
    fetchEarningsDataset();
  }
}
