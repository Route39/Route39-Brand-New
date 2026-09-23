import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/datasources/upload_datasource.dart';
import 'package:ridy_driver/core/graphql/fragments/media.fragment.graphql.dart';
import '../blocs/login.bloc.dart';
import 'package:ridy_driver/features/auth/domain/repositories/auth_repository.dart';

enum DocSlot { rcFront, rcBack, vehicleFront, vehicleBack, vehicleLeft, vehicleRight }

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
  static const List<String> ownershipOptions = ['Self Owned'];

  // driver_document table IDs (bettersuite DB)
  static const Map<DocSlot, int> _documentIds = {
    DocSlot.rcFront: 6,
    DocSlot.rcBack: 7,
    DocSlot.vehicleFront: 8,
    DocSlot.vehicleBack: 9,
    DocSlot.vehicleLeft: 10,
    DocSlot.vehicleRight: 11,
  };

  static const Map<DocSlot, String> _labels = {
    DocSlot.rcFront: 'RC Front',
    DocSlot.rcBack: 'RC Back',
    DocSlot.vehicleFront: 'Vehicle Front',
    DocSlot.vehicleBack: 'Vehicle Back',
    DocSlot.vehicleLeft: 'Vehicle Left',
    DocSlot.vehicleRight: 'Vehicle Right',
  };

  String? ownership;
  late final TextEditingController vehicleNumberController;

  final Map<DocSlot, Uint8List> _previews = {};
  final Map<DocSlot, Fragment$Media> _medias = {};
  final Set<DocSlot> _uploading = {};

  bool submitting = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    ownership = ownershipOptions.contains(widget.initialOwnership) ? widget.initialOwnership : ownershipOptions.first;
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
      DocSlot.values.every((s) => _medias.containsKey(s)) &&
      _uploading.isEmpty &&
      (!vehicleNumberRequired || vehicleNumberController.text.trim().isNotEmpty) &&
      !submitting;

  Future<void> _pickImage(DocSlot slot) async {
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
                        'Upload ${_labels[slot]}',
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
      _previews[slot] = bytes;
      _uploading.add(slot);
    });

    try {
      final media = await locator<UploadDatasource>().uploadDocument(picked.name, bytes);
      await locator<AuthRepository>().attachDriverDocument(
        driverDocumentId: _documentIds[slot]!,
        mediaId: int.parse(media.id),
      );
      if (!mounted) return;
      setState(() {
        _medias[slot] = media;
        _uploading.remove(slot);
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _previews.remove(slot);
        _uploading.remove(slot);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Upload failed. Please try again.')),
      );
    }
  }

  Widget _uploadTile(DocSlot slot) {
    final bytes = _previews[slot];
    final uploading = _uploading.contains(slot);
    return Expanded(
      child: InkWell(
        onTap: uploading ? null : () => _pickImage(slot),
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
              bytes != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.memory(bytes, fit: BoxFit.cover, width: double.infinity, height: double.infinity),
                    )
                  : Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.add_photo_alternate_outlined, color: ColorPalette.primary40),
                          const SizedBox(height: 4),
                          Text(
                            _labels[slot]!,
                            style: TextStyle(color: ColorPalette.primary40, fontWeight: FontWeight.w600, fontSize: 13),
                          ),
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

  Widget _tileRow(DocSlot a, DocSlot b) {
    return Row(children: [_uploadTile(a), const SizedBox(width: 12), _uploadTile(b)]);
  }

  InputDecoration _inputDecoration({Widget? suffixIcon}) {
    OutlineInputBorder border(Color c) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: c),
        );
    return InputDecoration(
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: border(Colors.black26),
      enabledBorder: border(Colors.black26),
      focusedBorder: border(ColorPalette.primary40),
    );
  }

  Future<void> _handleSubmit() async {
    setState(() => submitting = true);
    final loginBloc = locator<LoginBloc>();
    final vehicleNumber = vehicleNumberController.text.trim().isEmpty ? null : vehicleNumberController.text.trim();
    if (vehicleNumber != null) {
      loginBloc.onPlateNumberChanged(vehicleNumber);
    }
    final newDocs = DocSlot.values.map((s) => _medias[s]).whereType<Fragment$Media>().toList();
    if (newDocs.isNotEmpty) {
      loginBloc.setDocuments([...loginBloc.state.documents, ...newDocs]);
    }
    widget.onSubmit(ownership!, vehicleNumber);
  }

  Widget _buildBody(BuildContext context) {
    const sectionStyle = TextStyle(fontSize: 14, color: Colors.black54);
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
                const Text('Vehicle Ownership', style: sectionStyle),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  initialValue: ownership,
                  isExpanded: true,
                  hint: const Text('Select ownership', style: TextStyle(color: Colors.black38)),
                  icon: const Icon(Icons.keyboard_arrow_down, color: Colors.black),
                  decoration: _inputDecoration(),
                  items: ownershipOptions.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
                  onChanged: (value) {
                    setState(() => ownership = value);
                    widget.onDraftChanged?.call(ownership: value);
                  },
                ),
                const SizedBox(height: 20),
                Text(
                  vehicleNumberRequired ? 'Enter vehicle number' : 'Enter vehicle number (optional)',
                  style: sectionStyle,
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: vehicleNumberController,
                  onChanged: (value) {
                    setState(() {});
                    widget.onDraftChanged?.call(vehicleNumber: value);
                  },
                  decoration: _inputDecoration(
                    suffixIcon: const Icon(Icons.info_outline, color: Colors.blue),
                  ),
                ),
                const SizedBox(height: 20),
                const Text('Upload RC (Required)', style: sectionStyle),
                const SizedBox(height: 8),
                _tileRow(DocSlot.rcFront, DocSlot.rcBack),
                const SizedBox(height: 20),
                const Text('Upload Vehicle Images (Required)', style: sectionStyle),
                const SizedBox(height: 8),
                _tileRow(DocSlot.vehicleFront, DocSlot.vehicleBack),
                const SizedBox(height: 12),
                _tileRow(DocSlot.vehicleLeft, DocSlot.vehicleRight),
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
