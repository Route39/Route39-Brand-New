import 'package:api_response/api_response.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/presentation/empty_list_state.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_top_bar.dart';
import 'package:flutter_common/core/theme/animation_duration.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/features/profile/presentation/blocs/favorite_drivers.bloc.dart';
import 'package:ridy/features/profile/presentation/components/favorite_driver_item.dart';
import 'package:ridy/gen/assets.gen.dart';
import 'package:flutter_common/gen/assets.gen.dart' as common_assets;

@RoutePage()
class FavoriteDriversScreen extends StatefulWidget {
  const FavoriteDriversScreen({super.key});

  @override
  State<FavoriteDriversScreen> createState() => _FavoriteDriversScreenState();
}

class _FavoriteDriversScreenState extends State<FavoriteDriversScreen> {
  bool editMode = false;

  @override
  void initState() {
    locator<FavoriteDriversCubit>().fetchFavoriteDrivers();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: locator<FavoriteDriversCubit>(),
      child: Container(
        color: ColorPalette.neutralVariant99,
        padding: context.responsive(const EdgeInsets.all(16), xl: const EdgeInsets.all(16).copyWith(top: 100)),
        child: BlocBuilder<FavoriteDriversCubit, FavoriteDriversState>(
          builder: (context, state) {
            return SafeArea(
              child: Column(
                children: [
                  AppTopBar(
                    title: context.translate.favoriteDrivers,
                    trailing: state.favoriteDriversState.data?.favoriteDrivers.isNotEmpty == true
                        ? CupertinoButton(
                            padding: EdgeInsets.zero,
                            onPressed: () => setState(() => editMode = !editMode),
                            minimumSize: Size(0, 0),
                            child: const Icon(Ionicons.create, color: ColorPalette.neutral70),
                          )
                        : null,
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: AnimatedSwitcher(
                      duration: AnimationDuration.pageStateTransitionMobile,
                      child: switch (state.favoriteDriversState) {
                        ApiResponseInitial() => const SizedBox(),
                        ApiResponseLoading() => Assets.lottie.loading.lottie(
                          width: double.infinity,
                          height: double.infinity,
                        ),
                        ApiResponseLoaded(:final data) =>
                          data.favoriteDrivers.isEmpty
                              ? EmptyListState(
                                  imagePath: common_assets.Assets.images.rideHistoryEmptyState.path,
                                  title: context.translate.noFavoriteDrivers,
                                  subTitle: context.translate.noFavoriteDriversDescription,
                                  imagePackage: "flutter_common",
                                )
                              : ListView.separated(
                                  padding: EdgeInsets.zero,
                                  itemCount: data.favoriteDrivers.length,
                                  itemBuilder: (context, index) {
                                    return FavoriteDriverItem(
                                      entity: data.favoriteDrivers[index],
                                      editMode: editMode,
                                      onDeletePressed: () {
                                        locator<FavoriteDriversCubit>().deleteFavoriteDriver(
                                          data.favoriteDrivers[index].id,
                                        );
                                      },
                                    );
                                  },
                                  separatorBuilder: (context, index) => const SizedBox(height: 16),
                                ),
                        ApiResponseError(:final message) => Text(message),
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
