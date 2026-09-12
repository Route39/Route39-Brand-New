import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/blocs/onboarding_cubit.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/core/presentation/wizard_steps/wizard_steps.dart';
import 'package:ridy_driver/features/auth/domain/entities/login_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/presentation/app_step_slider.dart';
import 'package:flutter_common/core/presentation/buttons/app_back_button.dart';

import '../blocs/login.bloc.dart';
import '../widgets/login_form_builder.dart';

class AuthScreenMobile extends StatelessWidget {
  const AuthScreenMobile({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorPalette.neutralVariant99,
      body: Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: SafeArea(
              bottom: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  BlocBuilder<LoginBloc, LoginState>(
                    builder: (context, state) {
                      if (state.loginPage == LoginPage.enterNumber) {

                        return const SizedBox.shrink();

                      }

                      final showHelp = state.selectedCity == null ||
                          state.selectedVehicleType == null ||
                          !state.documentsChecklistDone;

                      return Padding(
                        padding: const EdgeInsets.only(top: 16, left: 16, right: 16),
                        child: Row(
                          children: [
                            AppBackButton(
                              onPressed: () {
                                locator<LoginBloc>().onBackPressed();
                              },
                            ),
                            const Spacer(),
                            if (showHelp)
                              OutlinedButton.icon(
                                onPressed: () {},
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.black,
                                  side: const BorderSide(color: Colors.black26),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                ),
                                icon: const Icon(Icons.headset_mic_outlined, size: 18),
                                label: const Text('Help'),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          BlocBuilder<LoginBloc, LoginState>(
            buildWhen: (currentState, nextState) =>
                currentState.loginPage != nextState.loginPage ||
                currentState.otp != nextState.otp ||
                currentState.enterOtpResponse != nextState.enterOtpResponse,
            builder: (context, state) {
              return Column(
                children: [
                  // ---- Step indicator (commented out) ----
                  // if (state.loginPage.wizardStep != null)
                  //   Container(
                  //     width: 300,
                  //     padding: const EdgeInsets.all(8),
                  //     child: WizardSteps(count: 5, selectedStep: state.loginPage.wizardStep ?? 0),
                  //   ),
                  Text(state.loginPage.title(context), style: context.titleLarge),
                  const SizedBox(height: 8),
                ],
              );
            },
          ),
          Expanded(
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: BlocBuilder<LoginBloc, LoginState>(
                    builder: (context, state) => LoginFormBuilder(loginState: state).footer,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
