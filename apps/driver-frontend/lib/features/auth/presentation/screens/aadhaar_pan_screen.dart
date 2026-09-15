import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:image_picker/image_picker.dart';

class AadhaarPanScreen extends StatefulWidget {
  final String? initialAadhaarNumber;
  final String? initialPanNumber;
  final void Function({String? aadhaarNumber, String? panNumber})?
  onDraftChanged;
  final void Function(String aadhaarNumber, String panNumber) onSubmit;

  const AadhaarPanScreen({
    super.key,
    this.initialAadhaarNumber,
    this.initialPanNumber,
    this.onDraftChanged,
    required this.onSubmit,
  });

  @override
  State<AadhaarPanScreen> createState() => _AadhaarPanScreenState();
}

class _AadhaarPanScreenState extends State<AadhaarPanScreen> {
  late final TextEditingController aadhaarController;
  late final TextEditingController panController;
  Uint8List? aadhaarFrontBytes;
  Uint8List? aadhaarBackBytes;
  Uint8List? panFrontBytes;
  Uint8List? panBackBytes;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    aadhaarController = TextEditingController(
      text: widget.initialAadhaarNumber ?? '',
    );
    panController = TextEditingController(text: widget.initialPanNumber ?? '');
  }

  @override
  void dispose() {
    aadhaarController.dispose();
    panController.dispose();
    super.dispose();
  }

  bool get canSubmit =>
      aadhaarController.text.trim().isNotEmpty &&
      panController.text.trim().isNotEmpty;

  Future<void> _pickImage({
    required String title,
    required void Function(Uint8List) onPicked,
  }) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return FractionallySizedBox(
          heightFactor: 0.48,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
              child: Column(
                children: [
                  Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.black26,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.black,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 18),
                  ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                    leading: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.camera_alt_outlined,
                        color: Colors.red.shade700,
                      ),
                    ),
                    title: const Text(
                      'Take Photo',
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    onTap: () =>
                        Navigator.pop(sheetContext, ImageSource.camera),
                  ),
                  ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                    leading: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.photo_library_outlined,
                        color: Colors.red.shade700,
                      ),
                    ),
                    title: const Text(
                      'Choose from Gallery',
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    onTap: () =>
                        Navigator.pop(sheetContext, ImageSource.gallery),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );

    if (source == null) return;

    final picked = await _picker.pickImage(source: source, imageQuality: 85);

    if (picked == null) return;

    onPicked(await picked.readAsBytes());
  }

  Widget _uploadTile({
    required String label,
    required Uint8List? imageBytes,
    required VoidCallback onTap,
  }) {
    final uploaded = imageBytes != null;

    return Expanded(
      child: Container(
        height: 118,
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: uploaded ? Colors.red.shade400 : Colors.black26,
          ),
        ),
        child: Column(
          children: [
            Expanded(
              child: uploaded
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.memory(
                        imageBytes,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    )
                  : Center(
                      child: Text(
                        label,
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
            ),
            const SizedBox(height: 6),
            SizedBox(
              width: double.infinity,
              height: 32,
              child: ElevatedButton(
                onPressed: onTap,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade700,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  uploaded ? 'Retake / Change Photo' : 'Upload Photo',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _fieldDecoration(String hint) => InputDecoration(
    hintText: hint,
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
  );

  Widget _buildBody(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),

                const Text(
                  'Aadhaar',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 8),

                const Text(
                  'Upload Aadhaar Images',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 8),

                Row(
                  children: [
                    _uploadTile(
                      label: 'FRONT',
                      imageBytes: aadhaarFrontBytes,
                      onTap: () => _pickImage(
                        title: 'Upload Aadhaar Front',
                        onPicked: (bytes) =>
                            setState(() => aadhaarFrontBytes = bytes),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _uploadTile(
                      label: 'BACK',
                      imageBytes: aadhaarBackBytes,
                      onTap: () => _pickImage(
                        title: 'Upload Aadhaar Back',
                        onPicked: (bytes) =>
                            setState(() => aadhaarBackBytes = bytes),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                const Text(
                  'Aadhaar Number',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 5),

                TextField(
                  controller: aadhaarController,
                  keyboardType: TextInputType.number,
                  onChanged: (value) {
                    setState(() {});
                    widget.onDraftChanged?.call(aadhaarNumber: value);
                  },
                  decoration: _fieldDecoration('Eg: 1234 5678 9012'),
                ),

                const SizedBox(height: 16),

                const Text(
                  'PAN',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 8),

                const Text(
                  'Upload PAN Images',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 8),

                Row(
                  children: [
                    _uploadTile(
                      label: 'FRONT',
                      imageBytes: panFrontBytes,
                      onTap: () => _pickImage(
                        title: 'Upload PAN Front',
                        onPicked: (bytes) =>
                            setState(() => panFrontBytes = bytes),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _uploadTile(
                      label: 'BACK',
                      imageBytes: panBackBytes,
                      onTap: () => _pickImage(
                        title: 'Upload PAN Back',
                        onPicked: (bytes) =>
                            setState(() => panBackBytes = bytes),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                const Text(
                  'PAN Number',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 5),

                TextField(
                  controller: panController,
                  textCapitalization: TextCapitalization.characters,
                  onChanged: (value) {
                    setState(() {});
                    widget.onDraftChanged?.call(panNumber: value);
                  },
                  decoration: _fieldDecoration('Eg: ABCDE1234F'),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 8),

        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              foregroundColor: Colors.white,
              disabledBackgroundColor: Colors.red.shade200,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: canSubmit
                ? () => widget.onSubmit(
                    aadhaarController.text.trim(),
                    panController.text.trim(),
                  )
                : null,
            child: const Text(
              'Submit',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return _buildBody(context);
  }
}
