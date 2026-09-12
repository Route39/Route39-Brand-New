import 'package:ridy_driver/config/env.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/datasources/upload_datasource.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/core/graphql/fragments/media.fragment.graphql.dart';
import 'package:ridy_driver/features/auth/presentation/blocs/login.bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:image_picker/image_picker.dart';

class DocumentsForm extends StatefulWidget {
  final LoginState state;

  const DocumentsForm({
    super.key,
    required this.state,
  });

  @override
  State<DocumentsForm> createState() => _DocumentsFormState();
}

class _DocumentsFormState extends State<DocumentsForm> {
  Fragment$Media? aadhar;
  Fragment$Media? pan;
  Fragment$Media? rc;
  Fragment$Media? license;

  bool rcOptionSelected = false;
  bool rcSkipped = false;

  @override
  void initState() {
    super.initState();

    final documents = widget.state.documents;

    if (documents.isNotEmpty) {
      aadhar = documents.length > 0 ? documents[0] : null;
      pan = documents.length > 1 ? documents[1] : null;
      license = documents.length > 2 ? documents[2] : null;
      rc = documents.length > 3 ? documents[3] : null;

      if (rc != null) {
        rcOptionSelected = true;
      }
    }
  }

  String imageUrl(Fragment$Media media) {
    return media.address.startsWith('http')
        ? media.address
        : '${Env.serverUrl}${media.address}';
  }

  Future<Fragment$Media?> pickDocument({
    required bool profilePicture,
  }) async {
    final result = await ImagePicker().pickImage(
      source: ImageSource.gallery,
    );

    if (result == null) return null;

    final bytes = await result.readAsBytes();
    final filename = result.name;

    if (profilePicture) {
      return locator<UploadDatasource>().uploadProfilePicture(
        filename,
        bytes,
      );
    }

    return locator<UploadDatasource>().uploadDocument(
      filename,
      bytes,
    );
  }

  Future<void> uploadProfilePicture() async {
    final media = await pickDocument(profilePicture: true);

    if (!mounted || media == null) return;

    setState(() {
      locator<LoginBloc>().onProfilePhotoChanged(media);
    });
  }

  Future<void> uploadDocument(
    void Function(Fragment$Media media) onUploaded,
  ) async {
    final media = await pickDocument(profilePicture: false);

    if (!mounted || media == null) return;

    setState(() {
      onUploaded(media);
    });
  }

  Future<void> selectRcOption() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Do you have RC?'),
          content: const Text(
            'Do you have the RC (Vehicle Registration Certificate) for this vehicle?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('NO — Skip'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text('YES — Upload'),
            ),
          ],
        );
      },
    );

    if (!mounted || result == null) return;

    setState(() {
      rcOptionSelected = true;

      if (result) {
        rcSkipped = false;
      } else {
        rc = null;
        rcSkipped = true;
      }
    });
  }

  void saveDocuments() {
    final documents = <Fragment$Media>[
      if (aadhar != null) aadhar!,
      if (pan != null) pan!,
      if (rc != null) rc!,
      if (license != null) license!,
    ];

    locator<LoginBloc>().setDocuments(documents);
  }

  Widget uploadButton({
    required String text,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      height: 34,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(9),
          ),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget documentCard({
    required String number,
    required String title,
    required String subtitle,
    required Fragment$Media? value,
    required VoidCallback onUpload,
    bool optional = false,
    bool skipped = false,
    VoidCallback? onOptionalTap,
  }) {
    final showOptionalChoice =
        optional && !rcOptionSelected && value == null;

    return Container(
      height: 66,
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 7,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(
          color: const Color(0xffe2e8f0),
        ),
        borderRadius: BorderRadius.circular(13),
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: const Color(0xfff4f5fe),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Text(
              number,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  skipped
                      ? 'Skipped • Optional'
                      : value != null
                          ? 'Uploaded'
                          : subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    color: skipped
                        ? Colors.grey
                        : value != null
                            ? Colors.green
                            : Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (value != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                imageUrl(value),
                width: 48,
                height: 48,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) {
                  return Container(
                    width: 48,
                    height: 48,
                    alignment: Alignment.center,
                    color: const Color(0xfff4f5fe),
                    child: const Icon(
                      Icons.description_outlined,
                      size: 22,
                    ),
                  );
                },
              ),
            )
          else if (skipped)
            const Icon(
              Icons.check_circle_outline,
              size: 24,
              color: Colors.grey,
            )
          else if (showOptionalChoice)
            uploadButton(
              text: 'Add RC',
              onPressed: onOptionalTap!,
            )
          else
            uploadButton(
              text: 'Upload',
              onPressed: onUpload,
            ),
        ],
      ),
    );
  }

  Widget profileSection() {
    final profile = widget.state.profilePicture;

    return Column(
      children: [
        Text(
          'Your face should be recognizable in the image',
          style: context.bodyMedium,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 5),
        GestureDetector(
          onTap: uploadProfilePicture,
          child: Container(
            width: 70,
            height: 70,
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: const Color(0xffe2e8f0),
                width: 5,
              ),
            ),
            child: ClipOval(
              child: profile != null
                  ? Image.network(
                      imageUrl(profile),
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) {
                        return const Icon(
                          Icons.person,
                          size: 32,
                        );
                      },
                    )
                  : Container(
                      color: const Color(0xfff4f5fe),
                      child: const Icon(
                        Icons.cloud_upload,
                        color: Colors.red,
                        size: 25,
                      ),
                    ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        uploadButton(
          text: profile == null ? 'Upload Image' : 'Change Image',
          onPressed: uploadProfilePicture,
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final loginBloc = locator<LoginBloc>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              profileSection(),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Required documents',
                  style: context.titleLarge?.copyWith(
                    fontSize: 19,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              documentCard(
                number: '1',
                title: 'Aadhar Card',
                subtitle: 'Required',
                value: aadhar,
                onUpload: () {
                  uploadDocument((media) => aadhar = media);
                },
              ),
              documentCard(
                number: '2',
                title: 'PAN Card',
                subtitle: 'Required',
                value: pan,
                onUpload: () {
                  uploadDocument((media) => pan = media);
                },
              ),
              documentCard(
                number: '3',
                title: 'RC / Vehicle Registration',
                subtitle: 'Optional',
                value: rc,
                optional: true,
                skipped: rcSkipped,
                onUpload: () {
                  uploadDocument((media) => rc = media);
                },
                onOptionalTap: selectRcOption,
              ),
              documentCard(
                number: '4',
                title: 'Original Driving License',
                subtitle: 'Required',
                value: license,
                onUpload: () {
                  uploadDocument((media) => license = media);
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        AppPrimaryButton(
          onPressed: () {
            if (loginBloc.state.profilePicture == null) {
              context.showSnackBar(
                message: 'Please upload your profile picture',
              );
              return;
            }

            if (aadhar == null ||
                pan == null ||
                license == null) {
              context.showSnackBar(
                message:
                    'Please upload Aadhar, PAN and Original Driving License',
              );
              return;
            }

            saveDocuments();
            loginBloc.onConfirmDocumentsPressed();
          },
          child: Text(context.translate.confirm),
        ),
      ],
    );
  }
}
