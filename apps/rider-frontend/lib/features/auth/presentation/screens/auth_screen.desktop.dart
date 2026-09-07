import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/features/auth/presentation/blocs/login.bloc.dart';
import 'package:ridy/features/auth/presentation/widgets/login_form_builder.dart';

class AuthScreenDesktop extends StatelessWidget {
  const AuthScreenDesktop({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: ColorPalette.neutralVariant99,
        width: double.infinity,
        height: double.infinity,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: BlocBuilder<LoginBloc, LoginState>(
            builder: (context, state) {
              return Padding(
                padding: const EdgeInsets.all(64),
                child: LoginFormBuilder(loginPage: state.loginPage).footer,
              );
            },
          ),
        ),
      ),
    );
  }
}
