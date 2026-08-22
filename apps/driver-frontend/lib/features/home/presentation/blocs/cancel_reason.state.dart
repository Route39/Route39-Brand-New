part of 'cancel_reason.bloc.dart';

@freezed
sealed class CancelReasonState with _$CancelReasonState {
  const factory CancelReasonState({
    @Default(ApiResponseInitial()) ApiResponse<List<Fragment$CancelReason>> cancelReasonsState,
  }) = _CancelReasonState;
}
