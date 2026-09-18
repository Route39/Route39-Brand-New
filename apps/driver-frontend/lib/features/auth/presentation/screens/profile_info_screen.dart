import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/enums/gender.dart' as gender_enum;
import 'package:image_picker/image_picker.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/datasources/upload_datasource.dart';
import 'package:ridy_driver/core/graphql/fragments/media.fragment.graphql.dart';
import '../blocs/login.bloc.dart';

class ProfileInfoScreen extends StatefulWidget {
  final String? initialFirstName;
  final String? initialLastName;
  final String? initialDob;
  final String? initialGender;
  final void Function({String? firstName, String? lastName, String? dob, String? gender})? onDraftChanged;
  final void Function(String firstName, String lastName, String dob, String gender) onSubmit;

  const ProfileInfoScreen({
    super.key,
    this.initialFirstName,
    this.initialLastName,
    this.initialDob,
    this.initialGender,
    this.onDraftChanged,
    required this.onSubmit,
  });

  @override
  State<ProfileInfoScreen> createState() => _ProfileInfoScreenState();
}

class _ProfileInfoScreenState extends State<ProfileInfoScreen> {
  late final TextEditingController firstNameController;
  late final TextEditingController lastNameController;
  DateTime? dob;
  String? gender;
  Uint8List? profilePhotoBytes;
  Fragment$Media? profileMedia;
  bool uploadingPhoto = false;
  bool submitting = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    firstNameController = TextEditingController(text: widget.initialFirstName ?? '');
    lastNameController = TextEditingController(text: widget.initialLastName ?? '');
    gender = widget.initialGender;
    if (widget.initialDob != null && widget.initialDob!.isNotEmpty) {
      dob = DateTime.tryParse(widget.initialDob!);
    }
  }

  @override
  void dispose() {
    firstNameController.dispose();
    lastNameController.dispose();
    super.dispose();
  }

  bool get canSubmit =>
      firstNameController.text.trim().isNotEmpty &&
      lastNameController.text.trim().isNotEmpty &&
      dob != null &&
      gender != null &&
      profileMedia != null &&
      !submitting;

  String _formatDob(DateTime d) => '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  Future<void> _pickProfilePhoto() async {
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
                        'Update profile photo',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black),
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
      profilePhotoBytes = bytes;
      uploadingPhoto = true;
    });

    try {
      final media = await locator<UploadDatasource>().uploadProfilePicture(picked.name, bytes);
      if (!mounted) return;
      setState(() {
        profileMedia = media;
        uploadingPhoto = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        profilePhotoBytes = null;
        uploadingPhoto = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo upload failed. Please try again.')),
        );
      }
    }
  }

  Future<void> _pickDob() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: dob ?? DateTime(2000, 1, 1),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(primary: ColorPalette.primary40),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => dob = picked);
      widget.onDraftChanged?.call(dob: picked.toIso8601String());
    }
  }

  gender_enum.Gender _mapGender(String value) {
    switch (value) {
      case 'Male':
        return gender_enum.Gender.male;
      case 'Female':
        return gender_enum.Gender.female;
      default:
        return gender_enum.Gender.unknown;
    }
  }

  Future<void> _handleSubmit() async {
    setState(() => submitting = true);
    final loginBloc = locator<LoginBloc>();
    loginBloc.onFirstNameChanged(firstNameController.text.trim());
    loginBloc.onLastNameChanged(lastNameController.text.trim());
    loginBloc.onGenderChanged(_mapGender(gender!));
    loginBloc.onProfilePhotoChanged(profileMedia);
    widget.onSubmit(
      firstNameController.text.trim(),
      lastNameController.text.trim(),
      dob!.toIso8601String(),
      gender!,
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
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 8),
                Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      clipBehavior: Clip.antiAlias,
                      decoration: const BoxDecoration(color: Colors.black12, shape: BoxShape.circle),
                      child: profilePhotoBytes != null
                          ? Image.memory(profilePhotoBytes!, fit: BoxFit.cover)
                          : const Icon(Icons.person, size: 56, color: Colors.black38),
                    ),
                    if (uploadingPhoto)
                      Container(
                        width: 100,
                        height: 100,
                        decoration: const BoxDecoration(color: Colors.black45, shape: BoxShape.circle),
                        child: const Center(child: CircularProgressIndicator(color: Colors.white)),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: uploadingPhoto ? null : _pickProfilePhoto,
                  child: Text('Edit', style: TextStyle(color: ColorPalette.primary40, fontWeight: FontWeight.w600)),
                ),
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text('First name', style: TextStyle(fontSize: 14, color: Colors.black54)),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: firstNameController,
                  onChanged: (value) {
                    setState(() {});
                    widget.onDraftChanged?.call(firstName: value);
                  },
                  decoration: InputDecoration(
                    hintText: 'Enter first name',
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
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Last name', style: TextStyle(fontSize: 14, color: Colors.black54)),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: lastNameController,
                  onChanged: (value) {
                    setState(() {});
                    widget.onDraftChanged?.call(lastName: value);
                  },
                  decoration: InputDecoration(
                    hintText: 'Enter last name',
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
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Date of Birth', style: TextStyle(fontSize: 14, color: Colors.black54)),
                ),
                const SizedBox(height: 6),
                InkWell(
                  onTap: _pickDob,
                  child: InputDecorator(
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
                    ),
                    child: Text(
                      dob != null ? _formatDob(dob!) : 'DD/MM/YYYY',
                      style: TextStyle(color: dob != null ? Colors.black : Colors.black38),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Gender', style: TextStyle(fontSize: 14, color: Colors.black54)),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    _genderChip('Male'),
                    const SizedBox(width: 10),
                    _genderChip('Female'),
                    const SizedBox(width: 10),
                    _genderChip('Other'),
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

  Widget _genderChip(String value) {
    final selected = gender == value;
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () {
          setState(() => gender = value);
          widget.onDraftChanged?.call(gender: value);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? ColorPalette.primary40 : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: selected ? ColorPalette.primary40 : Colors.black26),
          ),
          alignment: Alignment.center,
          child: Text(
            value,
            style: TextStyle(color: selected ? Colors.white : Colors.black, fontWeight: FontWeight.w600),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return _buildBody(context);
  }
}
