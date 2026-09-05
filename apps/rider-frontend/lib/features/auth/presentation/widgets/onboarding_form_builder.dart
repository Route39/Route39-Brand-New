import 'package:better_localization/language_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/features/select_language_dialog/select_language_dialog.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/settings.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/features/auth/domain/entities/onboarding.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';

class OnboardingFormBuilder {
  final int onboardingItemIndex;

  const OnboardingFormBuilder({
    required this.onboardingItemIndex,
  });

  Widget buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Image.asset(
              onBoardingItem(context).imagePath,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          Positioned(
            top: 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.eco, size: 13, color: Colors.green.shade700),
                  const SizedBox(width: 5),
                  Text(
                    '100% ELECTRIC EV',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.green.shade700),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            bottom: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.65),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.access_time, size: 13, color: Colors.white),
                  SizedBox(width: 5),
                  Text(
                    '~3 Min Pickup',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildFooter(BuildContext context) {
    if (onboardingItemIndex < 2) {
      return buildInformationFooter(context);
    } else {
      return buildLanguageSelectionFooter(context);
    }
  }

  Widget buildInformationFooter(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 8),
        Text(
          'WELCOME TO',
          style: context.labelMedium?.copyWith(
            color: context.theme.colorScheme.onSurfaceVariant,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 6),
        Image.asset(
          'assets/images/route39_logo.png',
          height: 40,
        ),
        const SizedBox(height: 14),
        Text(
          onBoardingItem(context).description,
          style: context.bodyMedium?.copyWith(
            color: context.theme.colorScheme.onSurfaceVariant,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: ColorPalette.primary99,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: ColorPalette.primary95),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: ColorPalette.primary40,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.card_giftcard, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'WELCOME GIFT',
                      style: context.labelSmall?.copyWith(
                        color: ColorPalette.primary40,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'First Ride ₹100 FREE',
                      style: context.bodyMedium?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
              Text(
                'SAVE ₹100',
                style: context.labelSmall?.copyWith(
                  color: Colors.orange.shade800,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget buildLanguageSelectionFooter(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          onBoardingItem(context).title,
          style: context.titleLarge,
        ),
        const SizedBox(
          height: 16,
        ),
        SizedBox(
          height: 350,
          child: BlocBuilder<SettingsCubit, SettingsState>(
            builder: (context, state) {
              return LanguageList(
                selectedLanguageCode: state.locale,
                onPressed: (Language language) =>
                    locator<SettingsCubit>().changeLanguage(language.code),
              );
            },
          ),
        )
      ],
    );
  }

  OnBoardingItem onBoardingItem(BuildContext context) =>
      onboardingItems(context)[onboardingItemIndex];
}
