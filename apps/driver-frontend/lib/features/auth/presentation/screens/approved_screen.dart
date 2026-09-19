import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/router/app_router.dart';
import 'package:ridy_driver/core/blocs/onboarding_cubit.dart';
import '../blocs/login.bloc.dart';

class ApprovedScreen extends StatelessWidget {
  const ApprovedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 40),
        Container(
          width: 140,
          height: 140,
          decoration: const BoxDecoration(
            color: Color(0xFFE6F7EC),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.check_circle, color: Color(0xFF34A853), size: 90),
        ),
        const SizedBox(height: 28),
        const Text(
          'Account Approved!',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black),
        ),
        const SizedBox(height: 12),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'Your documents have been verified successfully. You can now start using the Route39 app.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Colors.black54, height: 1.4),
          ),
        ),
        const SizedBox(height: 36),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: ColorPalette.primary40,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              locator<OnboardingCubit>().skip();
              locator<LoginBloc>().clear();
              locator<LoginBloc>().reset();
              context.router.replaceAll([const HomeRoute()]);
            },
            child: const Text('Go to Home', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () async {
            final uri = Uri(scheme: 'tel', path: '9626499399');
            await launchUrl(uri);
          },
          child: Text('Need help?', style: TextStyle(color: ColorPalette.primary40, fontWeight: FontWeight.w600)),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
