import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/graphql/schema.gql.dart';

import 'approved_screen.dart';
import 'rejected_screen.dart';

class UnderReviewScreen extends StatefulWidget {
  const UnderReviewScreen({super.key});

  @override
  State<UnderReviewScreen> createState() => _UnderReviewScreenState();
}

class _UnderReviewScreenState extends State<UnderReviewScreen> {
  Timer? _pollTimer;
  StreamSubscription<AuthState>? _authSubscription;
  bool _approved = false;
  bool _rejected = false;

  @override
  void initState() {
    super.initState();

    // React the moment AuthBloc's state updates (from any requestUserInfo call).
    _authSubscription = locator<AuthBloc>().stream.listen(_onAuthStateChanged);
    _onAuthStateChanged(locator<AuthBloc>().state);

    // Kick off an immediate check, then poll periodically.
    locator<AuthBloc>().requestUserInfo();
    _pollTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      locator<AuthBloc>().requestUserInfo();
    });
  }

  void _onAuthStateChanged(AuthState state) {
    if (_approved || _rejected) return;
    final status = state.profile?.status;
    if (status == Enum$DriverStatus.SoftReject || status == Enum$DriverStatus.HardReject) {
      _pollTimer?.cancel();
      _authSubscription?.cancel();
      if (mounted) {
        setState(() => _rejected = true);
      }
      return;
    }
    if (status != null &&
        status != Enum$DriverStatus.PendingApproval &&
        status != Enum$DriverStatus.WaitingDocuments) {
      _pollTimer?.cancel();
      _authSubscription?.cancel();
      if (mounted) {
        setState(() => _approved = true);
      }
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _authSubscription?.cancel();
    super.dispose();
  }

  Widget _statusStep({
    required String title,
    required String subtitle,
    required bool completed,
    required bool inProgress,
    required bool isLast,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: completed
                    ? Colors.green
                    : (inProgress ? Colors.orange.withValues(alpha: 0.15) : Colors.white),
                shape: BoxShape.circle,
                border: Border.all(
                  color: completed ? Colors.green : (inProgress ? Colors.orange : Colors.black26),
                  width: 2,
                ),
              ),
              child: completed
                  ? const Icon(Icons.check, size: 16, color: Colors.white)
                  : (inProgress ? Icon(Icons.access_time, size: 14, color: Colors.orange) : null),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 40,
                color: Colors.black12,
              ),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.black),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 13, color: Colors.black54),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildContent(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        Center(
          child: Container(
            width: 140,
            height: 140,
            decoration: BoxDecoration(
              color: ColorPalette.primary95,
              shape: BoxShape.circle,
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(Icons.assignment_ind_outlined, size: 64, color: ColorPalette.primary40),
                Positioned(
                  right: 20,
                  bottom: 20,
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(color: Colors.orange, shape: BoxShape.circle),
                    child: const Icon(Icons.access_time, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Your account is under review',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black),
        ),
        const SizedBox(height: 12),
        const Text(
          'You have completed the registration process successfully. Our team is now verifying your details and documents. This usually takes 1-3 working days.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 14, color: Colors.black54, height: 1.4),
        ),
        const SizedBox(height: 28),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.black12),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Verification Status',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black),
              ),
              const SizedBox(height: 20),
              _statusStep(
                title: 'Registration Completed',
                subtitle: 'Your basic details have been submitted.',
                completed: true,
                inProgress: false,
                isLast: false,
              ),
              _statusStep(
                title: 'Documents Uploaded',
                subtitle: 'Your documents are received and verified.',
                completed: true,
                inProgress: false,
                isLast: false,
              ),
              _statusStep(
                title: 'Under Review',
                subtitle: 'Our team is checking your details and documents.',
                completed: false,
                inProgress: true,
                isLast: false,
              ),
              _statusStep(
                title: 'Account Activation',
                subtitle: "You'll be notified once your account is approved.",
                completed: false,
                inProgress: false,
                isLast: true,
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: ColorPalette.primary95,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(color: ColorPalette.primary40, shape: BoxShape.circle),
                child: const Icon(Icons.info_outline, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Need help?',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'If you face any issues or have questions, feel free to contact our support team.',
                      style: TextStyle(fontSize: 13, color: Colors.black54),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.black45),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_rejected) {
      return const RejectedScreen();
    }
    if (_approved) {
      return const ApprovedScreen();
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _buildContent(context),
            ),
          ),
        );
      },
    );
  }
}
