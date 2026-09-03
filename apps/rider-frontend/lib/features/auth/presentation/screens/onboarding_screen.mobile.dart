import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/features/auth/presentation/blocs/onboarding_cubit.dart';
import 'package:ridy/features/auth/domain/entities/onboarding.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final onboardingCubit = locator<OnboardingCubit>();
    final item = onboardingItems(context).first;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
              child: Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => onboardingCubit.skip(),
                  child: Text(
                    context.translate.skip,
                    style: const TextStyle(
                      color: ColorPalette.primary40,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
              // Image card with badges
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: Image.asset(
                      item.imagePath,
                      width: double.infinity,
                      height: 230,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: _Badge(
                      icon: Icons.eco,
                      label: '100% ELECTRIC EV',
                      background: Colors.white,
                      foreground: Colors.green.shade700,
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    right: 12,
                    child: _Badge(
                      icon: Icons.access_time,
                      label: '~3 Min Pickup',
                      background: Colors.black.withValues(alpha: 0.65),
                      foreground: Colors.white,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              Text(
                'WELCOME TO',
                textAlign: TextAlign.center,
                style: context.labelMedium?.copyWith(
                  color: ColorPalette.neutralVariant50,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),

              const SizedBox(height: 6),

              Center(
                child: Image.asset(
                  'assets/images/route39_logo.png',
                  height: 42,
                ),
              ),

              const SizedBox(height: 12),

              Text(
                item.description,
                textAlign: TextAlign.center,
                style: context.bodyMedium?.copyWith(
                  color: ColorPalette.neutralVariant50,
                  height: 1.4,
                ),
              ),

              const SizedBox(height: 20),

              // Promo card
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
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'SAVE ₹100',
                          style: context.labelSmall?.copyWith(
                            color: Colors.orange.shade800,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        InkWell(
                          onTap: () {
                            Clipboard.setData(const ClipboardData(text: 'FIRSTRIDE'));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Code copied')),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: ColorPalette.primary95),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'FIRSTRIDE',
                                  style: context.labelSmall?.copyWith(fontWeight: FontWeight.w800),
                                ),
                                const SizedBox(width: 4),
                                Icon(Icons.copy, size: 12, color: ColorPalette.neutralVariant50),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // CTA button
              SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: () => onboardingCubit.nextPage(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ColorPalette.primary40,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Get Started with ₹100 Free',
                        style: context.bodyLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward, size: 18, color: Colors.white),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),

              Text(
                'No Surge  •  100% Electric EV  •  Safe & Verified',
                textAlign: TextAlign.center,
                style: context.labelSmall?.copyWith(color: ColorPalette.neutralVariant50),
              ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color background;
  final Color foreground;

  const _Badge({
    required this.icon,
    required this.label,
    required this.background,
    required this.foreground,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: foreground),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: foreground),
          ),
        ],
      ),
    );
  }
}
