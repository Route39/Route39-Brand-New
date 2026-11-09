import 'package:flutter/material.dart';
import 'package:flutter_common/core/extensions/extensions.dart';
import 'package:pinput/pinput.dart';

class OtpTextField extends StatelessWidget {
  final int length;
  final Function(String)? onChanged;
  final Function(String)? onCompleted;
  final TextEditingController? controller;
  final FocusNode? focusNode;
  final bool hasError;
  final String? errorText;

  const OtpTextField({
    required this.length,
    this.onChanged,
    super.key,
    this.onCompleted,
    this.controller,
    this.focusNode,
    this.hasError = false,
    this.errorText,
  });

  PinTheme _theme(BuildContext context, Color border) => PinTheme(
        padding: const EdgeInsets.symmetric(horizontal: 19, vertical: 16),
        decoration: BoxDecoration(
          color: context.theme.inputDecorationTheme.fillColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: border),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final errorColor = context.theme.colorScheme.error;
    return Pinput(
      length: 6,
      autofocus: true,
      controller: controller,
      focusNode: focusNode,
      forceErrorState: hasError,
      errorText: errorText,
      errorTextStyle: TextStyle(color: errorColor, fontSize: 13),
      defaultPinTheme: _theme(context, context.theme.inputDecorationTheme.border!.borderSide.color),
      focusedPinTheme: _theme(context, context.theme.inputDecorationTheme.focusedBorder!.borderSide.color),
      errorPinTheme: _theme(context, errorColor),
      onCompleted: onCompleted,
      onChanged: onChanged,
    );
  }
}
