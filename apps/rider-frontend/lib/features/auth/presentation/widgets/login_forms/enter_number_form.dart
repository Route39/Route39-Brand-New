import 'package:better_localization/country_code/country_code.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:flutter_common/features/country_code_dialog/country_code.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/buttons/app_text_button.dart';
import 'package:ridy/features/auth/presentation/blocs/login.bloc.dart';
import 'package:ridy/features/auth/presentation/blocs/onboarding_cubit.dart';
import 'package:flutter/services.dart';


class EnterNumberForm extends StatefulWidget {
  const EnterNumberForm({super.key});

  @override
  State<EnterNumberForm> createState() => _EnterNumberFormState();
}

class _EnterNumberFormState extends State<EnterNumberForm> {
  static final CountryCode _indiaCountryCode = CountryCode.parseByIso('IN')!;
  (CountryCode, String) phoneNumber = (_indiaCountryCode, "");
  @override
  Widget build(BuildContext context) {
    return BlocConsumer<LoginBloc, LoginState>(
      listener: (context, state) {
        switch (state.loginPage) {
          case LoginPage$EnterNumber(:final state):
            switch (state) {
              case PageState$Error(:final errorMessage):
                context.showSnackBar(message: errorMessage);
              case _:
            }
          case _:
        }
      },
      builder: (context, stateAuth) {
        switch (stateAuth.loginPage) {
          case LoginPage$EnterNumber(:final state):
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        Text(context.translate.signInSignUp, style: context.titleLarge, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        Text(
                          context.translate.onboardingDescription,
                          style: context.bodyMedium?.copyWith(color: context.theme.colorScheme.onSurfaceVariant),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: context.theme.inputDecorationTheme.contentPadding,
                              decoration: BoxDecoration(
                                color: context.theme.inputDecorationTheme.fillColor,
                                border: Border.all(
                                  color: context.theme.inputDecorationTheme.enabledBorder!.borderSide.color,
                                  width: 1,
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Image.asset(
                                    _indiaCountryCode.image,
                                    width: 20,
                                    height: 20,
                                    filterQuality: FilterQuality.high,
                                    isAntiAlias: true,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(_indiaCountryCode.e164CountryCode, style: context.bodyMedium),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: TextFormField(
                                keyboardType: TextInputType.phone,
                                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                                decoration: const InputDecoration(hintText: "Enter phone number"),
                          onChanged: (value) {
                            setState(() {
                              phoneNumber = (_indiaCountryCode, value);
                            });
                          },
                          ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                AppPrimaryButton(
                  isDisabled: state.isLoading || phoneNumber.$2.length < 6,
                  onPressed: () {
                    locator<LoginBloc>().onNumberVerificationRequested(
                      mobileNumber: phoneNumber.$2,
                      countryCode: phoneNumber.$1.iso2CountryCode,
                    );
                  },
                  child: Text(context.translate.signInSignUp),
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
