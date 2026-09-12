import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';

class DocumentChecklistScreen extends StatefulWidget {
  final VoidCallback onConfirm;
  final bool embedded;

  const DocumentChecklistScreen({super.key, required this.onConfirm, this.embedded = false});

  @override
  State<DocumentChecklistScreen> createState() => _DocumentChecklistScreenState();
}

class _DocumentChecklistScreenState extends State<DocumentChecklistScreen> {
  bool? hasDrivingLicense;

  Future<void> _showLicenseSheet(BuildContext context) async {
    bool? tempAnswer = hasDrivingLicense;

    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Do you have a Driving License?',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black),
                  ),
                  const SizedBox(height: 16),
                  RadioListTile<bool>(
                    contentPadding: EdgeInsets.zero,
                    value: true,
                    groupValue: tempAnswer,
                    activeColor: ColorPalette.primary40,
                    title: const Text('Yes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black)),
                    subtitle: const Text('Get Bike Taxi + Delivery orders', style: TextStyle(color: Colors.black54)),
                    onChanged: (value) => setSheetState(() => tempAnswer = value),
                  ),
                  const Divider(height: 1),
                  RadioListTile<bool>(
                    contentPadding: EdgeInsets.zero,
                    value: false,
                    groupValue: tempAnswer,
                    activeColor: ColorPalette.primary40,
                    title: const Text('No', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black)),
                    subtitle: const Text('Get only Delivery orders', style: TextStyle(color: Colors.black54)),
                    onChanged: (value) => setSheetState(() => tempAnswer = value),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: tempAnswer == null ? ColorPalette.primary80 : ColorPalette.primary40,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: tempAnswer == null ? null : () => Navigator.pop(sheetContext, tempAnswer),
                      child: const Text('Continue', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );

    if (result != null) {
      setState(() => hasDrivingLicense = result);
    }
  }

  Widget _helpButton() {
    return OutlinedButton.icon(
      onPressed: () {},
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.black,
        side: const BorderSide(color: Colors.black26),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      ),
      icon: const Icon(Icons.headset_mic_outlined, size: 18),
      label: const Text('Help'),
    );
  }

  Widget _documentRow({
    required String title,
    required bool unlocked,
    String? actionLabel,
    VoidCallback? onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: unlocked ? onTap : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.black12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: unlocked ? Colors.black : Colors.black38,
                    ),
                  ),
                  if (actionLabel != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      actionLabel,
                      style: TextStyle(fontSize: 13, color: ColorPalette.primary40, fontWeight: FontWeight.w600),
                    ),
                  ],
                ],
              ),
            ),
            Icon(
              unlocked ? Icons.chevron_right : Icons.lock_outline,
              color: unlocked ? Colors.black45 : Colors.black26,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    final licenseActionLabel = hasDrivingLicense == null
        ? 'Upload Now'
        : (hasDrivingLicense! ? 'Yes selected — tap to change' : 'No selected — tap to change');

    return Column(
      mainAxisSize: MainAxisSize.max,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: ColorPalette.primary40,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Please complete all the steps to activate your account',
                          style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w600),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: Colors.white24,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.badge_outlined, color: Colors.white, size: 28),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                _documentRow(
                  title: 'Driving License',
                  unlocked: true,
                  actionLabel: licenseActionLabel,
                  onTap: () => _showLicenseSheet(context),
                ),
                _documentRow(title: 'Profile Info', unlocked: false),
                _documentRow(title: 'Vehicle RC', unlocked: false),
                _documentRow(title: 'Aadhaar/PAN card', unlocked: false),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: ColorPalette.primary40,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: widget.onConfirm,
            child: const Text(
              'Continue',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        SizedBox(height: widget.embedded ? 8 : 24),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.embedded) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: _buildBody(context),
          );
        },
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: _buildBody(context),
        ),
      ),
    );
  }
}
