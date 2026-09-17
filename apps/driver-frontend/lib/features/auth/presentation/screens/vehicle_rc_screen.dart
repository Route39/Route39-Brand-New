import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/datasources/upload_datasource.dart';
import 'package:ridy_driver/core/graphql/fragments/media.fragment.graphql.dart';
import '../blocs/login.bloc.dart';
import 'package:ridy_driver/features/auth/domain/repositories/auth_repository.dart';

class VehicleRCScreen extends StatefulWidget {
  final String? initialOwnership;
  final String? initialVehicleNumber;
  final void Function({String? ownership, String? vehicleNumber})? onDraftChanged;
  final void Function(String ownership, String? vehicleNumber) onSubmit;

  const VehicleRCScreen({
    super.key,
    this.initialOwnership,
    this.initialVehicleNumber,
    this.onDraftChanged,
    required this.onSubmit,
  });

  @override
  State<VehicleRCScreen> createState() => _VehicleRCScreenState();
}

class _VehicleRCScreenState extends State<VehicleRCScreen> {
  static const List<String> ownershipOptions = ['Self Owned', 'Rental'];

  String? ownership;
  late final TextEditingController vehicleNumberController;
  Uint8List? frontImageBytes;
  Uint8List? backImageBytes;
  Fragment$Media? frontMedia;
  Fragment$Media? backMedia;
  bool uploadingFront = false;
  bool uploadingBack = false;
  bool submitting = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    ownership = widget.initialOwnership;
    vehicleNumberController = TextEditingController(text: widget.initialVehicleNumber ?? '');
  }

  @override
  void dispose() {
    vehicleNumberController.dispose();
    super.dispose();
  }

  bool get vehicleNumberRequired => ownership == 'Self Owned';

  bool get canSubmit =>
      ownership != null &&
      (!vehicleNumberRequired || vehicleNumberController.text.trim().isNotEmpty) &&
      !submitting;

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
                        isFront ? 'Upload front side of RC' : 'Upload back side of RC',
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
      if (isFront) {
        frontImageBytes = bytes;
        uploadingFront = true;
      } else {
        backImageBytes = bytes;
        uploadingBack = true;
      }
    });

    try {
      final media = await locator<UploadDatasource>().uploadDocument(picked.name, bytes);
      await locator<AuthRepository>().attachDriverDocument(
        driverDocumentId: 4,
        mediaId: int.parse(media.id),
      );
      if (!mounted) return;
      setState(() {
        if (isFront) {
          frontMedia = media;
          uploadingFront = false;
        } else {
          backMedia = media;
          uploadingBack = false;
        }
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        if (isFront) {
          frontImageBytes = null;
          uploadingFront = false;
        } else {
          backImageBytes = null;
          uploadingBack = false;
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Upload failed. Please try again.')),
        );
      }
    }
  }

  Widget _rcUploadTile({
    required String label,
    required Uint8List? imageBytes,
    required bool uploading,
    required VoidCallback onTap,
  }) {
    final uploaded = imageBytes != null;
    return Expanded(
      child: InkWell(
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
      ),
    );
  }

  Future<void> _handleSubmit() async {
    setState(() => submitting = true);
    final loginBloc = locator<LoginBloc>();
    final vehicleNumber = vehicleNumberController.text.trim().isEmpty ? null : vehicleNumberController.text.trim();
    if (vehicleNumber != null) {
      loginBloc.onPlateNumberChanged(vehicleNumber);
    }
    final newDocs = [if (frontMedia != null) frontMedia!, if (backMedia != null) backMedia!];
    if (newDocs.isNotEmpty) {
      loginBloc.setDocuments([...loginBloc.state.documents, ...newDocs]);
    }
    widget.onSubmit(ownership!, vehicleNumber);
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
                const Text('Vehicle Ownership', style: TextStyle(fontSize: 14, color: Colors.black54)),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  initialValue: ownership,
                  isExpanded: true,
                  hint: const Text('Select ownership', style: TextStyle(color: Colors.black38)),
                  icon: const Icon(Icons.keyboard_arrow_down, color: Colors.black),
                  decoration: InputDecoration(
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
                  items: ownershipOptions
                      .map((o) => DropdownMenuItem(value: o, child: Text(o)))
                      .toList(),
                  onChanged: (value) {
                    setState(() => ownership = value);
                    widget.onDraftChanged?.call(ownership: value);
                  },
                ),
                const SizedBox(height: 20),
                Text(
                  vehicleNumberRequired ? 'Enter vehicle number' : 'Enter vehicle number (optional)',
                  style: const TextStyle(fontSize: 14, color: Colors.black54),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: vehicleNumberController,
                  onChanged: (value) {
                    setState(() {});
                    widget.onDraftChanged?.call(vehicleNumber: value);
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
                const SizedBox(height: 20),
                const Text('Upload RC Images (Optional)', style: TextStyle(fontSize: 14, color: Colors.black54)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _rcUploadTile(
                      label: 'Front',
                      imageBytes: frontImageBytes,
                      uploading: uploadingFront,
                      onTap: () => _pickImage(isFront: true),
                    ),
                    const SizedBox(width: 12),
                    _rcUploadTile(
                      label: 'Back',
                      imageBytes: backImageBytes,
                      uploading: uploadingBack,
                      onTap: () => _pickImage(isFront: false),
                    ),
                  ],
                ),
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
            onPressed: canSubmit ? _handleSubmit : null,
            child: submitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Submit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
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
