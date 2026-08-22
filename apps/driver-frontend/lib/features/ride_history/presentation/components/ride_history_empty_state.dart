import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:flutter/widgets.dart';
import 'package:ridy_driver/gen/assets.gen.dart';
import 'package:flutter_common/core/presentation/empty_list_state.dart';

class RideHistoryEmptyState extends StatelessWidget {
  const RideHistoryEmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    return EmptyListState(
      imagePath: Assets.images.rideHistoryEmptyState.path,
      title: context.translate.noRidesYet,
    );
  }
}
