import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/presentation/avatars/app_avatar.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy_driver/features/profile/presentation/dialogs/select_profile_image_dialog.dart';
import 'package:ridy_driver/gen/assets.gen.dart';

import 'package:ridy_driver/config/env.dart';

class AvatarSelectButton extends StatelessWidget {
  final String? avatar;

  const AvatarSelectButton({
    super.key,
    required this.avatar,
  });

  @override
  Widget build(BuildContext context) {
    return CupertinoButton(
      padding: const EdgeInsets.all(0),
      onPressed: () {
        showDialog(
            context: context,
            useSafeArea: false,
            builder: (context) {
              return const SelectProfileImageDialog();
            });
      },
      minimumSize: Size(0, 0),
      child: Column(
        children: [
          AppAvatar(
            url: avatar != null
                ? (avatar!.startsWith('http') ? avatar : '${Env.serverUrl}$avatar')
                : null,
            defaultAvatarPath: Assets.avatars.a1.path,
            size: 80,
          ),
          Transform.translate(
            offset: const Offset(32, -32),
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: ColorPalette.primary99,
                border: Border.all(
                  color: ColorPalette.primary95,
                ),
              ),
              child: const Icon(
                Ionicons.add,
                color: ColorPalette.neutral70,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
