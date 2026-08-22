import 'package:ridy_driver/core/graphql/fragments/cancel_reason.fragment.graphql.dart';
import 'package:flutter_common/core/entities/cancel_reason.dart';
import 'package:ridy_driver/core/graphql/fragments/cancel_reason.extensions.dart';

extension CancelReasonX on Fragment$CancelReason {
  CancelReasonEntity get toEntity => CancelReasonEntity(
        id: id,
        name: title,
      );
}

extension CancelReasonQueryX on List<Fragment$CancelReason> {
  List<CancelReasonEntity> get toEntity => map((e) => e.toEntity).toList();
}
