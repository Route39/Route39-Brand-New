import 'package:auto_route/auto_route.dart';
import 'package:better_localization/country_code/phone_number.extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/profile.extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:flutter/cupertino.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/buttons/app_back_button.dart';
import 'package:ridy_driver/gen/assets.gen.dart';
import 'package:ridy_driver/core/router/app_router.dart';
import 'package:ridy_driver/features/home/presentation/screens/home_screen.mobile.dart';

import 'action_buttons.dart';
import 'user_info_hero.dart';

class ProfileHeader extends StatelessWidget {
  final Fragment$Profile profile;
  final Fragment$DriverPerformance aggregationsInfo;

  const ProfileHeader({super.key, required this.profile, required this.aggregationsInfo});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: 54),
          decoration: BoxDecoration(
            borderRadius: context.responsive(BorderRadius.zero, xl: BorderRadius.circular(20)),
            image: DecorationImage(image: Assets.images.walletHeaderBackground.provider(), fit: BoxFit.cover),
          ),
          child: SafeArea(
            top: context.responsive(true, xl: false),
            bottom: false,
            child: Column(
              children: [
                context.responsive(
                  Align(
                    alignment: Alignment.centerLeft,
                    child: AppBackButton(
                      onPressed: () {
                        SelectedTabNotifier.instance.goToHome();
                        context.router.navigate(const HomeRoute());
                      },
                    ),
                  ),
                  xl: const SizedBox(height: 36),
                ),
                UserInfoHero(
                  name: profile.fullName,
                  avatar: profile.profileImageUrl,
                  phoneNumber: profile.mobileNumber.formatPhoneNumber(null),
                ),
                SizedBox(height: context.responsive(16, xl: 48)),
              ],
            ),
          ),
        ),
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Center(
            child: ActionButtons(
              totalRides: aggregationsInfo.totalRides,
              totalDistanceTraveled: aggregationsInfo.distanceTraveled,
              rating: aggregationsInfo.rating?.toInt(),
            ),
          ),
        ),
      ],
    );
  }
}
