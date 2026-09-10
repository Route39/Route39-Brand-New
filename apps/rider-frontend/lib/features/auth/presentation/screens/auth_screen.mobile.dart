import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/features/auth/presentation/widgets/login_form_builder.dart';

import '../blocs/login.bloc.dart';

class AuthScreenMobile extends StatelessWidget {
  const AuthScreenMobile({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorPalette.neutralVariant99,
      body: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: BlocBuilder<LoginBloc, LoginState>(
                  builder: (context, state) {
                    return LoginFormBuilder(loginPage: state.loginPage).footer;
                  },
                ),
              ),
            ),
          ),
        ),
      ]),
    );
  }
}
