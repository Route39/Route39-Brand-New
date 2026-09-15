import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:image_picker/image_picker.dart';

class DrivingLicenseUploadScreen extends StatefulWidget {
  final VoidCallback onBack;
  final VoidCallback onSubmit;
  final String? initialLicenseNumber;
  final void Function(String number)? onLicenseNumberChanged;

  const DrivingLicenseUploadScreen({
    super.key,
    required this.onBack,
    required this.onSubmit,
    this.initialLicenseNumber,
    this.onLicenseNumberChanged,
  });

  @override
  State<DrivingLicenseUploadScreen> createState() => _DrivingLicenseUploadScreenState();
}

class _DrivingLicenseUploadScreenState extends State<DrivingLicenseUploadScreen> {
  Uint8List? frontImageBytes;
  Uint8List? backImageBytes;
  late final TextEditingController licenseNumberController =
      TextEditingController(text: widget.initialLicenseNumber ?? '');
  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    licenseNumberController.dispose();
    super.dispose();
  }

  bool get canSubmit =>
      frontImageBytes != null && backImageBytes != null && licenseNumberController.text.trim().isNotEmpty;

  Future<void> _pickImage({required bool isFront}) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return SizedBox(
          height: MediaQuery.of(sheetContext).size.height * 0.45,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: Colors.black12, borderRadius: BorderRadius.circular(2)),
                  ),
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        isFront ? 'Upload front side of DL' : 'Upload back side of DL',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(color: ColorPalette.primary95, borderRadius: BorderRadius.circular(10)),
                      child: Icon(Icons.camera_alt, color: ColorPalette.primary40),
                    ),
                    title: const Text('Take Photo', style: TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: const Text('Use your camera'),
                    onTap: () => Navigator.pop(sheetContext, ImageSource.camera),
                  ),
                  ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(color: ColorPalette.primary95, borderRadius: BorderRadius.circular(10)),
                      child: Icon(Icons.photo_library, color: ColorPalette.primary40),
                    ),
                    title: const Text('Choose from Gallery', style: TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: const Text('Pick an existing photo'),
                    onTap: () => Navigator.pop(sheetContext, ImageSource.gallery),
                  ),
                  const Spacer(),
                ],
              ),
            ),
          ),
        );
      },
    );

    if (source == null) return;

    final XFile? picked = await _picker.pickImage(source: source, imageQuality: 85);
    if (picked == null) return;

    final bytes = await picked.readAsBytes();
    setState(() {
      if (isFront) {
        frontImageBytes = bytes;
      } else {
        backImageBytes = bytes;
      }
    });
  }

  Widget _uploadBox({
    required String label,
    String? subLabel,
    required Uint8List? imageBytes,
    required bool enabled,
    required VoidCallback onUpload,
  }) {
    final uploaded = imageBytes != null;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.black26),
      ),
      child: Column(
        children: [
          if (uploaded) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.memory(imageBytes, height: 140, width: double.infinity, fit: BoxFit.cover),
            ),
            const SizedBox(height: 12),
          ] else ...[
            Text(
              label,
              style: TextStyle(fontSize: 15, color: enabled ? Colors.black : Colors.black38),
            ),
            if (subLabel != null) ...[
              const SizedBox(height: 6),
              Text(
                subLabel,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Colors.black45),
              ),
            ],
            const SizedBox(height: 16),
          ],
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: enabled ? onUpload : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: uploaded ? Colors.green : (enabled ? ColorPalette.primary40 : Colors.black12),
                foregroundColor: enabled ? Colors.white : Colors.black38,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              ),
              icon: Icon(uploaded ? Icons.check_circle_outline : Icons.add_photo_alternate_outlined),
              label: Text(
                uploaded ? 'Retake / Change Photo' : 'Upload Photo',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.max,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                _uploadBox(
                  label: 'Front side of your DL',
                  imageBytes: frontImageBytes,
                  enabled: true,
                  onUpload: () => _pickImage(isFront: true),
                ),
                _uploadBox(
                  label: 'Back side of your DL',
                  subLabel: 'Upload the back side even if it is blank.',
                  imageBytes: backImageBytes,
                  enabled: frontImageBytes != null,
                  onUpload: () => _pickImage(isFront: false),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Enter Driving License number',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: licenseNumberController,
                  onChanged: (value) {
                    setState(() {});
                    widget.onLicenseNumberChanged?.call(value);
                  },
                  decoration: InputDecoration(
                    suffixIcon: const Icon(Icons.info_outline, color: Colors.blue),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.black26),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.black26),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: ColorPalette.primary40),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                const Text('Eg: KA12345677899029', style: TextStyle(fontSize: 12, color: Colors.black45)),
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
              backgroundColor: canSubmit ? ColorPalette.primary40 : ColorPalette.primary80,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: canSubmit ? widget.onSubmit : null,
            child: const Text('Submit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return _buildBody(context);
  }
}
