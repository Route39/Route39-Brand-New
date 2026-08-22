import 'package:api_response/api_response.dart';
import 'package:auto_route/auto_route.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/core/repositories/profile_repository.dart';
import 'package:ridy_driver/core/router/app_router.dart';
import 'package:ridy_driver/features/auth/presentation/blocs/login.bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_common/core/presentation/buttons/app_bordered_button.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:flutter_common/core/presentation/responsive_dialog/app_responsive_dialog.dart';
import 'package:flutter_common/core/presentation/snackbar/snackbar.dart';
import 'package:ionicons/ionicons.dart';

class DeleteAccountDialog extends StatelessWidget {
  const DeleteAccountDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return AppResponsiveDialog(
      header: (
        Icons.delete,
        context.translate.deleteAccount,
        context.translate.deleteAccountNotice,
      ),
      type: context.responsive(
        DialogType.bottomSheet,
        xl: DialogType.dialog,
      ),
      primaryButton: AppBorderedButton(
        onPressed: () {
          Navigator.pop(context);
        },
        title: context.translate.cancel,
      ),
      secondaryButton: AppPrimaryButton(
        onPressed: () async {
          final deleteAccountResponse =
              await locator<ProfileRepository>().deleteAccount();

          switch (deleteAccountResponse) {
            case ApiResponseLoaded():
              context.showSnackBar(
                message: context.translate.accountDeleted,
              );
              await context.router.replaceAll([const AuthRoute()]);

              locator<AuthBloc>().onLoggedOut();
              locator<LoginBloc>().clear();
            case ApiResponseError(:final message):
              context.showSnackBar(
                message: message,
              );

            case _:
          }
        },
        color: PrimaryButtonColor.error,
        child: Text(context.translate.confirmAndDeleteAccount),
      ),
      child: const SizedBox(),
    );
  }
}
