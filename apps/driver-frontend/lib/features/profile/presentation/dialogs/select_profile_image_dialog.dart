import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/datasources/upload_datasource.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/upload_image_field.dart';
import 'package:ridy_driver/config/env.dart';

class SelectProfileImageDialog extends StatefulWidget {
  const SelectProfileImageDialog({super.key});

  @override
  State<SelectProfileImageDialog> createState() => _SelectProfileImageDialogState();
}

class _SelectProfileImageDialogState extends State<SelectProfileImageDialog> {
  // After the user picks an image the remote URL is stored here after upload.
  String? avatarRemoteUrl;
  final GlobalKey<FormState> formKey = GlobalKey<FormState>();
  bool isSaving = false;

  @override
  void initState() {
    avatarRemoteUrl = locator<AuthBloc>().state.profile?.profileImageUrl;
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return AppResponsiveDialog(
      type: context.responsive(DialogType.bottomSheet, xl: DialogType.dialog),
      header: (Icons.account_circle, context.translate.selectProfileImage, null),
      primaryButton: AppPrimaryButton(
        isDisabled: isSaving || avatarRemoteUrl == null,
        onPressed: () {
          Navigator.of(context).pop();
        },
        child: Text(context.translate.saveChanges),
      ),
      child: Form(
        key: formKey,
        child: UploadImageField<String>(
          initialValue: avatarRemoteUrl,
          uploadButtonText: context.translate.uploadImage,
          // Upload immediately on pick; store the returned remote URL.
          fileUploader: (filename, bytes) async {
            final media = await locator<UploadDatasource>()
                .uploadProfilePicture(filename, bytes);
            if (mounted) {
              setState(() => avatarRemoteUrl = media.address);
            }
            return media.address;
          },
          displayValue: (url) {
            if (url.startsWith('http')) return url;
            return '${Env.serverUrl}$url';
          },
        ),
      ),
    );
  }
}
