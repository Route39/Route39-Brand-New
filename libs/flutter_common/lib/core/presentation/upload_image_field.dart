import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_common/core/extensions/extensions.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/extensions/extensions.dart';
import 'package:ionicons/ionicons.dart';

class UploadImageField<T> extends StatelessWidget {
  final T? initialValue;
  final void Function(T?)? onSaved;
  final void Function(T?)? onChanged;
  final String? Function(T?)? validator;
  final Future<T> Function(String filename, List<int> bytes) fileUploader;
  final String Function(T) displayValue;
  final BoxShape shape;
  final double? borderRadius;
  final String uploadButtonText;

  const UploadImageField({
    super.key,
    this.initialValue,
    this.onSaved,
    this.validator,
    required this.fileUploader,
    this.shape = BoxShape.circle,
    this.borderRadius,
    required this.uploadButtonText,
    this.onChanged,
    required this.displayValue,
  });

  @override
  Widget build(BuildContext context) {
    return FormField<T>(
      validator: validator,
      initialValue: initialValue,
      onSaved: onSaved,
      builder: (state) {
        return Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: shape,
                borderRadius: borderRadius != null ? BorderRadius.circular(borderRadius!) : null,
                border: Border.all(color: const Color(0xffe2e8f0), width: 8),
              ),
              child:
                  state.value != null
                      ? Container(
                        clipBehavior: Clip.antiAlias,
                        decoration: BoxDecoration(
                          shape: shape,
                          borderRadius: borderRadius != null ? BorderRadius.circular(borderRadius! * 0.5) : null,
                        ),
                        child: CachedNetworkImage(
                          imageUrl: displayValue.call(state.value!).toImageUrl,
                          width: 60,
                          height: 60,
                          fit: BoxFit.cover,
                          errorWidget:
                              (context, url, error) =>
                                  const Icon(Ionicons.image, color: ColorPalette.primary30, size: 40),
                        ),
                      )
                      : Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          shape: shape,
                          borderRadius: borderRadius != null ? BorderRadius.circular(borderRadius! * 0.5) : null,
                          color: const Color(0xfff4f5fe),
                        ),
                        child: const Icon(Icons.cloud_upload, color: ColorPalette.primary30),
                      ),
            ),
            const SizedBox(height: 16),
            CupertinoButton(
              padding: const EdgeInsets.all(0),
              onPressed: () async {
                final result =
                    await ImagePicker().pickImage(source: ImageSource.gallery);
                if (result != null && state.mounted) {
                  // Read raw bytes — works on both web (blob URLs) and native.
                  final bytes = await result.readAsBytes();
                  final filename = result.name;
                  final media = await fileUploader(filename, bytes);
                  if (state.mounted) {
                    state.didChange(media);
                    onChanged?.call(media);
                  }
                }
              },

              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: ColorPalette.primary99,
                  border: Border.all(color: ColorPalette.primary95, width: 1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  uploadButtonText,
                  style: context.labelMedium?.copyWith(color: context.theme.colorScheme.onSurfaceVariant),
                ),
              ),
              minimumSize: Size(0, 0),
            ),
            if (state.hasError) ...[
              const SizedBox(height: 8),
              Text(state.errorText!, style: context.bodyMedium?.copyWith(color: context.theme.colorScheme.error)),
            ],
          ],
        );
      },
    );
  }
}
