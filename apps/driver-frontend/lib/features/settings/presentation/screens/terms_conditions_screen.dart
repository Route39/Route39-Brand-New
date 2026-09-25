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
                    'ROUTE39 PILOT',
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
              'Last updated: September 23, 2026',
              style: TextStyle(color: Colors.grey[600], fontSize: 13),
            ),
            const SizedBox(height: 20),
            const _Paragraph(
              'These Terms & Conditions ("Terms") govern your access to and '
              'use of the Route39 Pilot mobile application ("the App"), '
              'operated by Attendy Technologies Pvt Ltd ("Route39", "we", '
              '"us", "our"). By registering as a driver and using the App, '
              'you agree to be bound by these Terms.',
            ),

            const _SectionTitle('1. Eligibility'),
            const _Bullets([
              'You must be at least 18 years of age',
              'You must hold a valid driving license and vehicle registration',
              'You must complete KYC verification (Aadhaar, PAN, RC, and other documents as required)',
              'You must own or have authorised access to a vehicle that meets Route39\'s requirements',
            ]),

            const _SectionTitle('2. Driver Responsibilities'),
            const _Bullets([
              'Provide accurate, current, and complete information during registration',
              'Maintain a valid driving license, vehicle insurance, and permits at all times',
              'Operate your vehicle safely and comply with all applicable traffic laws',
              'Complete accepted trips professionally and in good faith',
              'Keep the App and your account credentials secure',
            ]),

            const _SectionTitle('3. Earnings & Payments'),
            const _Paragraph(
              'Earnings are calculated based on completed trips as shown in '
              'the App. Payouts are processed to your registered bank/UPI '
              'account on the schedule communicated within the App. Route39 '
              'may deduct applicable platform fees, commissions, or '
              'statutory deductions as disclosed in the App.',
            ),

            const _SectionTitle('4. Account Suspension & Termination'),
            const _Paragraph(
              'Route39 may suspend or terminate your driver account for '
              'violations of these Terms, fraudulent activity, repeated '
              'customer complaints, failure to maintain required documents, '
              'or any conduct that compromises rider safety or platform '
              'integrity. You may also request account deletion at any time '
              'through the App.',
            ),

            const _SectionTitle('5. Vehicle & Documentation'),
            const _Paragraph(
              'You are responsible for ensuring your vehicle remains '
              'roadworthy and that all documents (RC, insurance, license, '
              'permits) remain valid and up to date. Expired or invalid '
              'documents may result in suspension of your ability to accept '
              'trips.',
            ),

            const _SectionTitle('6. Limitation of Liability'),
            const _Paragraph(
              'Route39 acts as a technology platform connecting drivers with '
              'riders. Route39 is not liable for accidents, damages, or '
              'disputes arising from your use of a personal vehicle, subject '
              'to applicable law. Drivers operate as independent service '
              'providers.',
            ),

            const _SectionTitle('7. Changes to These Terms'),
            const _Paragraph(
              'We may update these Terms from time to time. Continued use of '
              'the App after changes are posted constitutes your acceptance '
              'of the revised Terms.',
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
                    '8. Contact Us',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: brandRed,
                    ),
                  ),
                  SizedBox(height: 10),
                  Text('Company: Attendy Technologies Pvt Ltd'),
                  Text('App: Route39 Pilot'),
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
