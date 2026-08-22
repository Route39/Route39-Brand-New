import 'package:api_response/api_response.dart';
import 'package:dartz/dartz.dart' as dartz;
import 'package:flutter/material.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/auth_bloc.dart';
import 'package:ridy/core/datasources/upload_datasource.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/upload_image_field.dart';

class SelectProfileImageDialog extends StatefulWidget {
  const SelectProfileImageDialog({super.key});

  @override
  State<SelectProfileImageDialog> createState() => _SelectProfileImageDialogState();
}

class _SelectProfileImageDialogState extends State<SelectProfileImageDialog> {
  final GlobalKey<FormState> formKey = GlobalKey<FormState>();
  late dartz.Option<String> avatar;
  bool isSaving = false;

  @override
  void initState() {
    avatar = switch (locator<AuthBloc>().state) {
      AuthState$Authenticated(:final profile) =>
        profile.profileImageUrl != null ? dartz.Some(profile.profileImageUrl!) : dartz.none(),
      AuthState$Unauthenticated() => throw Exception('Unauthenticated user'),
    };

    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return AppResponsiveDialog(
      type: context.responsive(DialogType.bottomSheet, xl: DialogType.dialog),
      header: (Icons.account_circle, context.translate.selectProfileImage, null),
      primaryButton: AppPrimaryButton(
        isDisabled: isSaving,
        onPressed: () async {
          formKey.currentState?.save();
          setState(() {
            isSaving = true;
          });
          final update = await locator<UploadDatasource>().uploadProfilePicture(
            avatar.fold(() => throw Exception('Avatar is not selected'), (a) => a),
          );
          setState(() {
            isSaving = false;
          });

          switch (update) {
            case ApiResponseLoaded(:final data):
              locator<AuthBloc>().profileUpdated(data.updateOneRider);
            case ApiResponseError():
              throw Exception('Error updating profile');

            case _:
          }
        },
        child: Text(context.translate.saveChanges),
      ),
      child: Form(
        key: formKey,
        child: FormField<String>(
          initialValue: avatar.fold(() => null, (a) => a),
          onSaved: (newValue) => avatar = dartz.some(newValue!),
          builder: (state) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                UploadImageField<String>(
                  displayValue: (p0) => p0,
                  initialValue: state.value,
                  onChanged: (media) {
                    state.didChange(media!);
                  },
                  uploadButtonText: context.translate.uploadImage,
                  fileUploader: (path, bytes) async {
                    return (await locator<UploadDatasource>().uploadProfilePicture(path)).address;
                  },
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
