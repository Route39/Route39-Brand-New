import 'package:better_localization/localizations.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/features/auth/domain/entities/login_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:flutter_common/features/country_code_dialog/country_code.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:ionicons/ionicons.dart';

import '../../blocs/login.bloc.dart';

class EnterNumberForm extends StatefulWidget {
  final LoginState state;

  const EnterNumberForm({super.key, required this.state});

  @override
  State<EnterNumberForm> createState() => _EnterNumberFormState();
}

class _EnterNumberFormState extends State<EnterNumberForm> with SingleTickerProviderStateMixin {
  final GlobalKey<FormState> formKey = GlobalKey();
  late final AnimationController _controller;

  Animation<double> _fadeSlide(double start, double end) {
    return CurvedAnimation(
      parent: _controller,
      curve: Interval(start, end, curve: Curves.easeOutCubic),
    );
  }

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Widget _animated(Widget child, double start, double end) {
    final animation = _fadeSlide(start, end);
    return AnimatedBuilder(
      animation: animation,
      builder: (context, _) {
        return Opacity(
          opacity: animation.value.clamp(0.0, 1.0),
          child: Transform.translate(
            offset: Offset(0, (1 - animation.value) * 24),
            child: child,
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final loginBloc = locator<LoginBloc>();
    return BlocConsumer<LoginBloc, LoginState>(
      listenWhen: (previous, current) =>
          previous.enterNumberResponse.errorMessage != current.enterNumberResponse.errorMessage &&
          current.enterNumberResponse.errorMessage != null,
      listener: (context, state) {
        context.showSnackBar(message: state.enterNumberResponse.errorMessage ?? context.tr.somethingWentWrong);
      },
      builder: (context, state) {
        switch (state.loginPage) {
          case LoginPage.enterNumber:
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    child: Form(
                      key: formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _animated(_EvHeroBanner(), 0.0, 0.55),
                          SizedBox(height: context.responsive(20, xl: 28)),
                          _animated(
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Container(
                                  width: 4,
                                  height: context.responsive(28, xl: 34),
                                  decoration: BoxDecoration(
                                    color: ColorPalette.primary40,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        "Welcome back!",
                                        style: (context.responsive(context.titleMedium, xl: context.titleLarge))
                                            ?.copyWith(fontWeight: FontWeight.w800, color: ColorPalette.neutral20),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        context.translate.onboardingDescription,
                                        style: context.bodySmall?.copyWith(color: ColorPalette.neutral60),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            0.15,
                            0.65,
                          ),
                          SizedBox(height: context.responsive(20, xl: 28)),
                          _animated(
                            Container(
                              padding: const EdgeInsets.all(18),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: ColorPalette.neutral90),
                                boxShadow: [
                                  BoxShadow(
                                    color: ColorPalette.neutral20.withValues(alpha: 0.05),
                                    blurRadius: 16,
                                    offset: const Offset(0, 6),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(Ionicons.call, size: 16, color: ColorPalette.primary40),
                                      const SizedBox(width: 6),
                                      Text(
                                        "Mobile number",
                                        style: context.labelMedium?.copyWith(
                                          fontWeight: FontWeight.w700,
                                          color: ColorPalette.neutral40,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  AppPhoneNumberTextField(
                                    initalValue: (CountryCode.parseByIso('IN')!, widget.state.mobileNumber),
                                    showCountryPicker: false,
                                    validator: (value) => value?.$2 != null ? null : context.translate.fieldIsRequired,
                                    onSaved: (value) {
                                      if (value != null && value.$2 != null) {
                                        loginBloc.onNumberChanged(value.$1, value.$2!);
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ),
                            0.3,
                            0.8,
                          ),
                          const SizedBox(height: 16),
                          _animated(
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                _TrustBadge(icon: Ionicons.shieldCheckmark, label: "Secure"),
                                SizedBox(width: 16),
                                _TrustBadge(icon: Ionicons.time, label: "24/7 Support"),
                                SizedBox(width: 16),
                                _TrustBadge(icon: Ionicons.people, label: "Trusted Drivers"),
                              ],
                            ),
                            0.45,
                            0.9,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _animated(
                  AppPrimaryButton(
                    isDisabled: state.enterNumberResponse.isLoading,
                    onPressed: () {
                      if (formKey.currentState?.validate() == true) {
                        formKey.currentState?.save();
                        loginBloc.onNumberSubmitted();
                      }
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(context.translate.getOtp),
                        const SizedBox(width: 8),
                        const Icon(Ionicons.arrowForward, size: 18, color: Colors.white),
                      ],
                    ),
                  ),
                  0.55,
                  1.0,
                ),
              ],
            );
          default:
            return const SizedBox();
        }
      },
    );
  }
}

class _EvHeroBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.all(context.responsive(18, xl: 24)),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [ColorPalette.primary30, ColorPalette.primary50],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned(
              right: -30,
              top: -30,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.08),
                ),
              ),
            ),
            Positioned(
              right: 20,
              bottom: -40,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.06),
                ),
              ),
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Ionicons.flash, size: 12, color: ColorPalette.primary40),
                            const SizedBox(width: 4),
                            Text(
                              '100% ELECTRIC AUTO',
                              style: context.labelSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: ColorPalette.primary40,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: context.responsive(12, xl: 16)),
                      Text(
                        'Go Green with EV Auto',
                        style: (context.responsive(context.titleMedium, xl: context.titleLarge))
                            ?.copyWith(fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Clean, silent & affordable zero-emission rides across the city.',
                        style: context.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.92)),
                      ),
                      SizedBox(height: context.responsive(12, xl: 16)),
                      const Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          _EvPill(icon: Ionicons.leaf, label: 'Zero Emission'),
                          _EvPill(icon: Ionicons.volumeMute, label: 'Noise Free'),
                          _EvPill(icon: Ionicons.pricetag, label: 'Low Fare'),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  children: [
                    Container(
                      width: context.responsive(60, xl: 72),
                      height: context.responsive(60, xl: 72),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(18),
                        child: Image.asset(
                          'assets/images/route39_auto_photo.png',
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'EV AUTO',
                      style: context.labelSmall?.copyWith(fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _EvPill extends StatelessWidget {
  final IconData icon;
  final String label;
  const _EvPill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _TrustBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  const _TrustBadge({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: ColorPalette.neutral60),
        const SizedBox(width: 4),
        Text(
          label,
          style: context.labelSmall?.copyWith(color: ColorPalette.neutral60, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
