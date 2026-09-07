import 'package:better_localization/localizations.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/features/auth/domain/entities/login_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:flutter_common/features/country_code_dialog/country_code.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';

import '../../blocs/login.bloc.dart';

class EnterNumberForm extends StatelessWidget {
  final GlobalKey<FormState> formKey = GlobalKey();
  final LoginState state;

  EnterNumberForm({super.key, required this.state});

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
                        children: [
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [ColorPalette.primary40, ColorPalette.primary60],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(20),
                                        ),
                                        child: const Text(
                                          '⚡ 100% ELECTRIC AUTO',
                                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: ColorPalette.primary40),
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      const Text(
                                        'Go Green with EV Auto',
                                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Clean, silent & affordable zero-emission rides across the city.',
                                        style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.9)),
                                      ),
                                      const SizedBox(height: 12),
                                      const Wrap(
                                        spacing: 6,
                                        runSpacing: 6,
                                        children: [
                                          _EvPill(label: 'Zero Emission'),
                                          _EvPill(label: 'Noise Free'),
                                          _EvPill(label: 'Low Fare'),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  children: [
                                    Container(
                                      width: 56,
                                      height: 56,
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(16),
                                        child: Image.asset(
                                          'assets/images/route39_auto_photo.png',
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    const Text('EV AUTO', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(
                            context.translate.onboardingDescription,
                            style: context.bodyMedium?.copyWith(color: context.theme.colorScheme.onSurfaceVariant),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          AppPhoneNumberTextField(
                            initalValue: (CountryCode.parseByIso('IN')!, state.mobileNumber),
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
                  ),
                ),
                AppPrimaryButton(
                  isDisabled: state.enterNumberResponse.isLoading,
                  onPressed: () {
                    if (formKey.currentState?.validate() == true) {
                      formKey.currentState?.save();
                      loginBloc.onNumberSubmitted();
                    }
                  },
                  child: Text(context.translate.getOtp),
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

class _EvPill extends StatelessWidget {
  final String label;
  const _EvPill({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w500),
      ),
    );
  }
}
