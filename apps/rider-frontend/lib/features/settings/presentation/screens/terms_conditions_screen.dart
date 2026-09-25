import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

@RoutePage()
class TermsConditionsScreen extends StatelessWidget {
  const TermsConditionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const brandRed = Color(0xFFE02020);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        title: const Text(
          'Terms & Conditions',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.w600),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: brandRed.withOpacity(0.08),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: brandRed,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'ROUTE39 RIDER',
                    style: TextStyle(
                      color: brandRed,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Terms & Conditions',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Last updated: September 24, 2026',
              style: TextStyle(color: Colors.grey[600], fontSize: 13),
            ),
            const SizedBox(height: 20),
            const _Paragraph(
              'These Terms & Conditions govern your use of the Route39 Rider '
              'App ("the App"), developed and operated by Attendy '
              'Technologies Pvt Ltd ("we", "us", "our"). By creating an '
              'account and booking rides through the App, you agree to these '
              'terms.',
            ),

            const _SectionTitle('1. Eligibility & Account'),
            const _Bullets([
              'You must be at least 18 years old to use the App',
              'You must register with a valid mobile number verified via OTP',
              'You are responsible for all activity on your account',
              'Provide accurate information and keep it up to date',
            ]),

            const _SectionTitle('2. Booking Rides'),
            const _Bullets([
              'Rides are subject to driver availability in your area',
              'Set an accurate pickup and drop location before booking',
              'Be present at the pickup point on time; waiting charges may apply',
              'Scheduled rides are subject to availability at the scheduled time',
            ]),

            const _SectionTitle('3. Fares & Payments'),
            const _Paragraph(
              'The estimated fare is shown before you confirm a booking. The '
              'final fare may vary based on actual distance, route changes, '
              'waiting time, tolls, or applicable taxes. You agree to pay the '
              'final fare using cash, wallet, or any payment method available '
              'in the App.',
            ),

            const _SectionTitle('4. Cancellations'),
            const _Paragraph(
              'You may cancel a ride through the App. A cancellation fee may '
              'apply if you cancel after a driver has been assigned or has '
              'arrived at the pickup point, as shown in the App at the time '
              'of cancellation.',
            ),

            const _SectionTitle('5. Rider Conduct'),
            const _Bullets([
              'Treat drivers with respect; abusive or unsafe behaviour is not allowed',
              'Do not carry illegal, hazardous, or prohibited items',
              'Do not damage the vehicle; you may be charged for damage caused',
              'Follow safety instructions, including seat belts where available',
            ]),

            const _SectionTitle('6. Account Suspension'),
            const _Paragraph(
              'We may suspend or terminate your account for violation of '
              'these terms, fraudulent activity, non-payment, or misconduct '
              'reported by drivers or detected by our systems.',
            ),

            const _SectionTitle('7. Limitation of Liability'),
            const _Paragraph(
              'Route39 acts as a technology platform connecting riders with '
              'drivers. To the extent permitted by law, we are not liable for '
              'indirect losses, delays, or lost items. Report any issue or '
              'lost item to support promptly.',
            ),

            const _SectionTitle('8. Privacy'),
            const _Paragraph(
              'Your use of the App is also governed by our Privacy Policy, '
              'which explains how we collect and use your information.',
            ),

            const _SectionTitle('9. Changes to These Terms'),
            const _Paragraph(
              'We may update these terms periodically. Changes will be posted '
              'here with a revised "Last updated" date. Continued use of the '
              'App means you accept the revised terms.',
            ),

            const _SectionTitle('10. Governing Law'),
            const _Paragraph(
              'These terms are governed by the laws of India. Disputes are '
              'subject to the jurisdiction of the courts of Tamil Nadu.',
            ),

            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: brandRed.withOpacity(0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: brandRed.withOpacity(0.2)),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '11. Contact Us',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: brandRed,
                    ),
                  ),
                  SizedBox(height: 10),
                  Text('Company: Attendy Technologies Pvt Ltd'),
                  Text('App: Route39 Rider App'),
                  Text('Email: support@route39.in'),
                  Text('Website: theroute39.com'),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.bold,
          color: Color(0xFFE02020),
        ),
      ),
    );
  }
}

class _Paragraph extends StatelessWidget {
  final String text;
  const _Paragraph(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: const TextStyle(fontSize: 14, height: 1.5)),
    );
  }
}

class _Bullets extends StatelessWidget {
  final List<String> items;
  const _Bullets(this.items);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: items
          .map(
            (e) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '•  ',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFFE02020),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      e,
                      style: const TextStyle(fontSize: 14, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}
