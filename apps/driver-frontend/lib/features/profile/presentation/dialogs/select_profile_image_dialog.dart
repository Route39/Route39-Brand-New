import 'package:flutter/material.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ridy_driver/config/env.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/datasources/upload_datasource.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';

class SelectProfileImageDialog extends StatefulWidget {
  const SelectProfileImageDialog({super.key});
  @override
  State<SelectProfileImageDialog> createState() => _SelectProfileImageDialogState();
}

class _SelectProfileImageDialogState extends State<SelectProfileImageDialog> {
  final _picker = ImagePicker();
  String? avatarRemoteUrl;
  bool isUploading = false;
  String? error;

  @override
  void initState() {
    avatarRemoteUrl = locator<AuthBloc>().state.profile?.profileImageUrl;
    super.initState();
  }

  String _full(String url) => url.startsWith('http') ? url : '${Env.serverUrl}$url';

  Future<void> _pick(ImageSource source) async {
    final picked = await _picker.pickImage(
      source: source, imageQuality: 85, maxWidth: 1024, preferredCameraDevice: CameraDevice.front);
    if (picked == null) return;
    setState(() { isUploading = true; error = null; });
    try {
      final bytes = await picked.readAsBytes();
      final media = await locator<UploadDatasource>().uploadProfilePicture(picked.name, bytes);
      if (mounted) setState(() => avatarRemoteUrl = media.address);
    } catch (_) {
      if (mounted) setState(() => error = 'Upload failed. Please try again.');
    } finally {
      if (mounted) setState(() => isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final url = avatarRemoteUrl;
    return AppResponsiveDialog(
      type: context.responsive(DialogType.bottomSheet, xl: DialogType.dialog),
      header: (Icons.account_circle, context.translate.selectProfileImage, null),
      primaryButton: AppPrimaryButton(
        isDisabled: isUploading || url == null,
        onPressed: () async {
          await locator<AuthBloc>().refreshProfileSilently();
          if (context.mounted) Navigator.of(context).pop();
        },
        child: Text(context.translate.saveChanges),
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        CircleAvatar(
          radius: 56,
          backgroundColor: Colors.grey.shade200,
          backgroundImage: url != null && !isUploading ? NetworkImage(_full(url)) : null,
          child: isUploading
              ? const CircularProgressIndicator()
              : (url == null ? const Icon(Icons.person, size: 56, color: Colors.grey) : null),
        ),
        const SizedBox(height: 12),
        if (error != null) Text(error!, style: const TextStyle(color: Colors.red)),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: OutlinedButton.icon(
            onPressed: isUploading ? null : () => _pick(ImageSource.camera),
            icon: const Icon(Icons.photo_camera), label: const Text('Camera'))),
          const SizedBox(width: 12),
          Expanded(child: OutlinedButton.icon(
            onPressed: isUploading ? null : () => _pick(ImageSource.gallery),
            icon: const Icon(Icons.photo_library), label: const Text('Gallery'))),
        ]),
      ]),
    );
  }
}
