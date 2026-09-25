import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

@RoutePage()
class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

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
          'Privacy Policy',
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
              'Privacy Policy',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Last updated: September 23, 2026',
              style: TextStyle(color: Colors.grey[600], fontSize: 13),
            ),
            const SizedBox(height: 20),
            const _Paragraph(
              'Route39 Rider App is developed and operated by Attendy '
              'Technologies Pvt Ltd ("we", "us", "our"). This Privacy Policy '
              'explains what information we collect from riders using the '
              'Route39 Rider App ("the App"), how we use it, and your rights '
              'regarding that information.',
            ),
            const _Paragraph(
              'By using the Route39 Rider App, you agree to the collection '
              'and use of information as described in this policy.',
            ),

            const _SectionTitle('1. Information We Collect'),

            const _SubTitle('1.1 Personal Identification Information'),
            const _Bullets([
              'Name',
              'Phone number (used for OTP-based sign-in and account verification)',
            ]),

            const _SubTitle('1.2 Location Information'),
            const _Paragraph(
              'Real-time GPS location, collected while the app is in use — '
              'used to determine your pickup point, track your ride to the '
              'drop location, match you with nearby drivers, and calculate '
              'fare and route.',
            ),

            const _SubTitle('1.3 Ride History'),
            const _Paragraph(
              'We store details of your past rides, including pickup and '
              'drop locations, ride date/time, fare, and driver assigned, to '
              'provide trip history, support, and service improvement.',
            ),

            const _SectionTitle('2. How We Use Your Information'),
            const _Bullets([
              'Verify rider identity via OTP-based sign-in',
              'Match riders with nearby available drivers',
              'Enable live ride tracking and accurate fare calculation',
              'Maintain ride history for your reference and customer support',
              'Improve app performance, safety, and service quality',
              'Communicate important service updates, alerts, and notifications',
            ]),

            const _SectionTitle('3. Data Sharing and Disclosure'),
            const _Paragraph(
              'We do not sell your personal information. We may share it '
              'with the driver assigned to your ride (name, phone number, '
              'and location, only for the duration of the ride), service '
              'providers who help operate the App (cloud hosting, OTP/SMS '
              'providers), and regulatory or government authorities where '
              'required by law.',
            ),

            const _SectionTitle('4. Data Storage and Security'),
            const _Paragraph(
              'Your data is stored on secure servers with industry-standard '
              'encryption and access controls. We retain your data only for '
              'as long as necessary to provide our services, or as required '
              'by applicable law.',
            ),

            const _SectionTitle('5. Your Rights'),
            const _Bullets([
              'Access the personal data we hold about you',
              'Request correction of inaccurate data',
              'Request deletion of your account and associated data (subject to legal retention requirements)',
              'Withdraw location permission anytime via device settings (note: this will limit core app functionality)',
            ]),

            const _SectionTitle('6. Location Permission'),
            const _Paragraph(
              'The App requests location access solely to provide core '
              'ride-booking functionality (pickup detection, live tracking, '
              'driver matching). You can disable this permission in your '
              'device settings at any time, though this may prevent you from '
              'booking rides.',
            ),

            const _SectionTitle("7. Children's Privacy"),
            const _Paragraph(
              'The Route39 Rider App is intended for use by individuals aged '
              '18 and above. We do not knowingly collect information from '
              'children.',
            ),

            const _SectionTitle('8. Changes to This Policy'),
            const _Paragraph(
              'We may update this policy periodically. Changes will be '
              'posted here with a revised "Last updated" date. Continued use '
              'of the App after changes means you accept the revised policy.',
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
                    '9. Contact Us',
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

class _SubTitle extends StatelessWidget {
  final String text;
  const _SubTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 10, bottom: 4),
      child: Text(
        text,
        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
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
