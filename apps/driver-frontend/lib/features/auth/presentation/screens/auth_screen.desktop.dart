import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/core/presentation/wizard_steps/wizard_steps.dart';
import 'package:ridy_driver/features/auth/domain/entities/login_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';

import '../blocs/login.bloc.dart';
import '../widgets/login_form_builder.dart';

class AuthScreenDesktop extends StatelessWidget {
  const AuthScreenDesktop({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: ColorPalette.primary99,
        padding: const EdgeInsets.all(80),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: Container(
              decoration: BoxDecoration(color: ColorPalette.neutralVariant99, borderRadius: BorderRadius.circular(16)),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: BlocBuilder<LoginBloc, LoginState>(
                  buildWhen: (currentState, nextState) =>
                      currentState.loginPage != nextState.loginPage ||
                      currentState.otp != nextState.otp ||
                      currentState.enterOtpResponse != nextState.enterOtpResponse,
                  builder: (context, state) => Padding(
                    padding: const EdgeInsets.all(64),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(state.loginPage.title(context), style: context.titleLarge),
                        const SizedBox(height: 16),
                        // ---- Step indicator (commented out) ----
                        // if (state.loginPage.wizardStep != null) ...[
                        //   SizedBox(
                        //     width: 300,
                        //     child: WizardSteps(count: 5, selectedStep: state.loginPage.wizardStep!),
                        //   ),
                        // ],
                        if (state.loginPage.wizardStep == null || state.loginPage.wizardStep == 1) ...[
                          Expanded(
                            child: Container(
                              height: state.desktopHeight,
                              constraints: const BoxConstraints(maxWidth: 600),
                              child: LoginFormBuilder(loginState: state).footer,
                            ),
                          ),
                        ],
                        if (state.loginPage.wizardStep != null && state.loginPage.wizardStep! > 1) ...[
                          Expanded(
                            child: Container(
                              height: state.desktopHeight,
                              constraints: const BoxConstraints(maxWidth: 600),
                              child: LoginFormBuilder(loginState: state).footer,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
