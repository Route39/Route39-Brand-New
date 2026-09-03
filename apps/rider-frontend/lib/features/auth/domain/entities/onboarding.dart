import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/gen/assets.gen.dart' as rider_assets;

part 'onboarding.freezed.dart';

@freezed
sealed class OnBoardingItem with _$OnBoardingItem {
  const factory OnBoardingItem({
    required String imagePath,
    required String title,
    required String description,
  }) = _OnBoardItem;
}

List<OnBoardingItem> onboardingItems(BuildContext context) => [
      OnBoardingItem(
        imagePath: dotenv.maybeGet('ONBOARDING_IMAGE_1') ??
            rider_assets.Assets.images.onboarding1.path,
        title: dotenv.maybeGet('ONBOARDING_TITLE_1') ??
            context.translate.welcomeTitle,
        description: dotenv.maybeGet('ONBOARDING_DESCRIPTION_1') ??
            context.translate.welcomeSubtitle,
      ),
    ];
