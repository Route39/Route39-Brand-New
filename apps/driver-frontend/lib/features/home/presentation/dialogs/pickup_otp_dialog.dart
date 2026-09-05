import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:api_response/api_response.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/presentation/buttons/app_bordered_button.dart';

import '../blocs/home.bloc.dart';
import '../components/waiting_time_button.dart';

class PickupOtpDialog extends StatefulWidget {
  final String orderId;

  const PickupOtpDialog({super.key, required this.orderId});

  @override
  State<PickupOtpDialog> createState() => _PickupOtpDialogState();
}

class _PickupOtpDialogState extends State<PickupOtpDialog> {
  final List<TextEditingController> _controllers = List.generate(4, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(4, (_) => FocusNode());
  String? _errorMessage;
  final _service = WaitingTimeService();

  @override
  void initState() {
    super.initState();
    if (!_service.isWaiting) {
      _service.toggle();
    }
  }


  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String get _otp => _controllers.map((c) => c.text).join();

  void _submit() {
    if (_otp.length != 4) {
      setState(() => _errorMessage = 'Enter the 4-digit OTP');
      return;
    }
    locator<HomeBloc>().add(
      HomeEvent.onVerifyPickupOtp(orderId: widget.orderId, otp: _otp),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: locator<HomeBloc>(),
      child: BlocListener<HomeBloc, HomeState>(
        listener: (context, state) {
          if (state.updateStatusResponse is ApiResponseLoaded) {
            _service.freeze();
            Navigator.of(context).pop();
          } else if (state.updateStatusResponse is ApiResponseError) {
            final err = state.updateStatusResponse as ApiResponseError;
            // ignore: avoid_print
            print('[OTP-DEBUG] Real error: ${err.error}');
            setState(() {
              _errorMessage = 'Incorrect OTP, please try again';
            });
            for (final c in _controllers) {
              c.clear();
            }
            _focusNodes.first.requestFocus();
          }
        },
        child: PopScope(
          canPop: false,
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 6, sigmaY: 6),
            child: Dialog(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.password, color: Color(0xFFB71C1C), size: 36),
                    const SizedBox(height: 12),
                    const Text(
                      'Enter Pickup OTP',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Ask the rider for the 4-digit code',
                      style: TextStyle(fontSize: 13, color: Colors.grey),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(4, (index) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 6),
                          child: SizedBox(
                            width: 50,
                            height: 56,
                            child: TextField(
                              controller: _controllers[index],
                              focusNode: _focusNodes[index],
                              textAlign: TextAlign.center,
                              textAlignVertical: TextAlignVertical.center,
                              keyboardType: TextInputType.number,
                              maxLength: 1,
                              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                              decoration: InputDecoration(
                                counterText: '',
                                isCollapsed: true,
                                contentPadding: const EdgeInsets.symmetric(vertical: 16),
                                filled: true,
                                fillColor: const Color(0xFFFDECEA),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: const BorderSide(color: Color(0xFFB71C1C)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: const BorderSide(color: Color(0xFFB71C1C), width: 2),
                                ),
                              ),
                              onChanged: (value) {
                                setState(() => _errorMessage = null);
                                if (value.isNotEmpty && index < 3) {
                                  _focusNodes[index + 1].requestFocus();
                                } else if (value.isEmpty && index > 0) {
                                  _focusNodes[index - 1].requestFocus();
                                }
                                if (index == 3 && value.isNotEmpty) {
                                  _focusNodes[index].unfocus();
                                }
                              },
                            ),
                          ),
                        );
                      }),
                    ),
                    if (_errorMessage != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _errorMessage!,
                        style: const TextStyle(color: Color(0xFFB71C1C), fontSize: 13),
                      ),
                    ],
                    const SizedBox(height: 20),
                    BlocBuilder<HomeBloc, HomeState>(
                      builder: (context, state) {
                        return SizedBox(
                          width: double.infinity,
                          child: AppBorderedButton(
                            isDisabled: state.updateStatusResponse.isLoading,
                            onPressed: _submit,
                            title: context.translate.confirm,
                            textColor: const Color(0xFFB71C1C),
                            isPrimary: true,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}