import 'package:flutter/material.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/gen/assets.gen.dart';

@immutable
class OnBoardingItem {
  final AssetGenImage image;
  final String title;
  final String description;

  const OnBoardingItem({required this.image, required this.title, required this.description});
}

List<OnBoardingItem> onboardingItems(BuildContext context) => [
  OnBoardingItem(
    image: Assets.images.onboarding1,
    title: context.translate.welcomeTitle,
    description: context.translate.welcomeSubtitle,
  ),
  OnBoardingItem(
    image: Assets.images.onboarding2,
    title: context.translate.onboardingRewardTitle,
    description: context.translate.onboardingRewardSubtitle,
  ),
  OnBoardingItem(image: Assets.images.language, title: context.translate.selectLanguage, description: ''),
];
