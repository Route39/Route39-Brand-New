import 'package:better_localization/localizations.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/features/auth/domain/entities/login_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
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
                          Text(
                            context.translate.onboardingDescription,
                            style: context.bodyMedium?.copyWith(color: context.theme.colorScheme.onSurfaceVariant),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          AppPhoneNumberTextField(
                            initalValue: (state.countryCode ?? Constants.defaultCountry, state.mobileNumber),
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
                  child: Text(context.translate.confirm),
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
