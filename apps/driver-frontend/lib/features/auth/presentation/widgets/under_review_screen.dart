import 'package:flutter/material.dart';

class UnderReviewScreen extends StatelessWidget {
  const UnderReviewScreen();

  Widget _timelineItem({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
    required bool showLine,
  }) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(shape: BoxShape.circle, color: iconBg),
                child: Icon(icon, size: 18, color: iconColor),
              ),
              if (showLine)
                Expanded(
                  child: Container(width: 2, color: Colors.black12),
                ),
            ],
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 20, top: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 13, color: Colors.black54)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 8),
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFFEAF2FF)),
            child: const Icon(Icons.pending_actions, size: 52, color: Color(0xFF3B7DDB)),
          ),
          const SizedBox(height: 20),
          const Text(
            'Your account is under review',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: RichText(
              textAlign: TextAlign.center,
              text: TextSpan(
                style: const TextStyle(fontSize: 14, color: Colors.black54, height: 1.4),
                children: [
                  const TextSpan(
                    text: 'You have completed the registration process successfully. Our team is now verifying your details and documents. This usually takes ',
                  ),
                  const TextSpan(
                    text: '1–3 working days.',
                    style: TextStyle(fontWeight: FontWeight.w700, color: Colors.black87),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.black12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Verification Status', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                _timelineItem(
                  icon: Icons.check,
                  iconColor: Colors.white,
                  iconBg: const Color(0xFF3FAE5A),
                  title: 'Registration Completed',
                  subtitle: 'Your basic details have been submitted.',
                  showLine: true,
                ),
                _timelineItem(
                  icon: Icons.check,
                  iconColor: Colors.white,
                  iconBg: const Color(0xFF3FAE5A),
                  title: 'Documents Uploaded',
                  subtitle: 'Your documents are received and verified.',
                  showLine: true,
                ),
                _timelineItem(
                  icon: Icons.access_time,
                  iconColor: Colors.white,
                  iconBg: const Color(0xFFE8A93B),
                  title: 'Under Review',
                  subtitle: 'Our team is checking your details and documents.',
                  showLine: true,
                ),
                _timelineItem(
                  icon: Icons.circle_outlined,
                  iconColor: Colors.black26,
                  iconBg: Colors.black.withValues(alpha: 0.06),
                  title: 'Account Activation',
                  subtitle: 'You\'ll be notified once your account is approved.',
                  showLine: false,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFEAF2FF),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF3B7DDB)),
                  child: const Icon(Icons.info_outline, size: 16, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Need help?', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      const SizedBox(height: 2),
                      const Text(
                        'If you face any issues or have questions, feel free to contact our support team.',
                        style: TextStyle(fontSize: 12.5, color: Colors.black54, height: 1.3),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: Colors.black38),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
