import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/datasources/upload_datasource.dart';
import 'package:ridy_driver/core/graphql/fragments/media.fragment.graphql.dart';
import '../blocs/login.bloc.dart';
import 'package:ridy_driver/features/auth/domain/repositories/auth_repository.dart';

class AadhaarPanScreen extends StatefulWidget {
  final String? initialAadhaarNumber;
  final String? initialPanNumber;
  final void Function({String? aadhaarNumber, String? panNumber})? onDraftChanged;
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
  Uint8List? panImageBytes;
  Fragment$Media? aadhaarFrontMedia;
  Fragment$Media? aadhaarBackMedia;
  Fragment$Media? panMedia;
  bool uploadingAadhaarFront = false;
  bool uploadingAadhaarBack = false;
  bool uploadingPan = false;
  bool submitting = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    aadhaarController = TextEditingController(text: widget.initialAadhaarNumber ?? '');
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
      panController.text.trim().isNotEmpty &&
      !submitting;

  Future<void> _pickImage({
    required String title,
    required int driverDocumentId,
    required Uint8List? Function() getBytes,
    required void Function(Uint8List) setBytes,
    required void Function(Fragment$Media?) setMedia,
    required void Function(bool) setUploading,
  }) async {
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
                        title,
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
      setBytes(bytes);
      setUploading(true);
    });

    try {
      final media = await locator<UploadDatasource>().uploadDocument(picked.name, bytes);
      await locator<AuthRepository>().attachDriverDocument(
        driverDocumentId: driverDocumentId,
        mediaId: int.parse(media.id),
      );
      if (!mounted) return;
      setState(() {
        setMedia(media);
        setUploading(false);
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        setUploading(false);
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Upload failed. Please try again.')),
        );
      }
    }
  }

  Widget _uploadTile({
    required String label,
    required Uint8List? imageBytes,
    required bool uploading,
    required VoidCallback onTap,
  }) {
    final uploaded = imageBytes != null;
    return InkWell(
        onTap: uploading ? null : onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          height: 90,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.black26),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              uploaded
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.memory(imageBytes, fit: BoxFit.cover, width: double.infinity, height: double.infinity),
                    )
                  : Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.add_photo_alternate_outlined, color: ColorPalette.primary40),
                          const SizedBox(height: 4),
                          Text(label, style: TextStyle(color: ColorPalette.primary40, fontWeight: FontWeight.w600, fontSize: 13)),
                        ],
                      ),
                    ),
              if (uploading)
                Container(
                  decoration: BoxDecoration(color: Colors.black45, borderRadius: BorderRadius.circular(12)),
                  child: const Center(child: CircularProgressIndicator(color: Colors.white)),
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

  Future<void> _handleSubmit() async {
    setState(() => submitting = true);
    final loginBloc = locator<LoginBloc>();
    final newDocs = [
      if (aadhaarFrontMedia != null) aadhaarFrontMedia!,
      if (aadhaarBackMedia != null) aadhaarBackMedia!,
      if (panMedia != null) panMedia!,
    ];
    if (newDocs.isNotEmpty) {
      loginBloc.setDocuments([...loginBloc.state.documents, ...newDocs]);
    }
    widget.onSubmit(aadhaarController.text.trim(), panController.text.trim());
    // Trigger the actual backend save now that all steps are collected.
    loginBloc.onConfirmDocumentsPressed();
  }

  Widget _buildBody(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
                const SizedBox(height: 8),
                const Text('Aadhaar Card', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.black)),
                const SizedBox(height: 10),
                const Text('Upload Aadhaar Images', style: TextStyle(fontSize: 14, color: Colors.black54)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: _uploadTile(
                        label: 'Front',
                        imageBytes: aadhaarFrontBytes,
                        uploading: uploadingAadhaarFront,
                        onTap: () => _pickImage(
                          title: 'Upload front side of Aadhaar',
                        driverDocumentId: 1,
                          getBytes: () => aadhaarFrontBytes,
                          setBytes: (b) => aadhaarFrontBytes = b,
                          setMedia: (m) => aadhaarFrontMedia = m,
                          setUploading: (v) => uploadingAadhaarFront = v,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _uploadTile(
                        label: 'Back',
                        imageBytes: aadhaarBackBytes,
                        uploading: uploadingAadhaarBack,
                        onTap: () => _pickImage(
                          title: 'Upload back side of Aadhaar',
                        driverDocumentId: 1,
                          getBytes: () => aadhaarBackBytes,
                          setBytes: (b) => aadhaarBackBytes = b,
                          setMedia: (m) => aadhaarBackMedia = m,
                          setUploading: (v) => uploadingAadhaarBack = v,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text('Enter Aadhaar Number', style: TextStyle(fontSize: 14, color: Colors.black54)),
                const SizedBox(height: 6),
                TextField(
                  controller: aadhaarController,
                  onChanged: (value) {
                    setState(() {});
                    widget.onDraftChanged?.call(aadhaarNumber: value);
                  },
                  decoration: _fieldDecoration('Eg: 1234 5678 9012'),
                ),
                const SizedBox(height: 28),
                const Divider(),
                const SizedBox(height: 16),
                const Text('PAN Card', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.black)),
                const SizedBox(height: 10),
                const Text('Upload PAN Image', style: TextStyle(fontSize: 14, color: Colors.black54)),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: _uploadTile(
                    label: 'PAN Card',
                    imageBytes: panImageBytes,
                    uploading: uploadingPan,
                    onTap: () => _pickImage(
                      title: 'Upload PAN card image',
                      driverDocumentId: 2,
                      getBytes: () => panImageBytes,
                      setBytes: (b) => panImageBytes = b,
                      setMedia: (m) => panMedia = m,
                      setUploading: (v) => uploadingPan = v,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Enter PAN Number', style: TextStyle(fontSize: 14, color: Colors.black54)),
                const SizedBox(height: 6),
                TextField(
                  controller: panController,
                  onChanged: (value) {
                    setState(() {});
                    widget.onDraftChanged?.call(panNumber: value);
                  },
                  decoration: _fieldDecoration('Eg: ABCDE1234F'),
                ),
              ],
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
              onPressed: canSubmit ? _handleSubmit : null,
              child: submitting
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Submit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return _buildBody(context);
  }
}
