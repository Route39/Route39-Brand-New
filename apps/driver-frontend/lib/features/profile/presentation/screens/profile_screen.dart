import 'package:api_response/api_response.dart';
import 'package:auto_route/auto_route.dart';
import 'package:ridy_driver/core/router/app_router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:flutter_common/core/theme/animation_duration.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/app_menu_item.dart';
import 'package:ridy_driver/features/profile/presentation/components/profile_header.dart';
import 'package:ridy_driver/gen/assets.gen.dart';

import '../blocs/profile.bloc.dart';
import 'package:ridy_driver/core/router/nav_item.dart';
import 'package:ridy_driver/features/auth/domain/repositories/auth_repository.dart';

@RoutePage()
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    locator<ProfileBloc>().fetchProfileAggregationsInfo();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: locator<ProfileBloc>(),
      child: BlocBuilder<ProfileBloc, ProfileState>(
        builder: (context, state) {
          return Container(
            color: context.theme.scaffoldBackgroundColor,
            child: AnimatedSwitcher(
              duration: AnimationDuration.pageStateTransitionMobile,
              child: switch (state.profileAggregationsState) {
                ApiResponseInitial() => const SizedBox(),
                ApiResponseLoading() => Assets.lottie.loading.lottie(
                    width: double.infinity,
                    height: double.infinity,
                  ),
                ApiResponseLoaded(:final data) => Container(
                    padding: context.responsive(
                      null,
                      xl: const EdgeInsets.only(top: 104, left: 24, right: 24, bottom: 24),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        context.responsive(
                          const SizedBox(),
                          xl: SafeArea(
                            bottom: false,
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 24),
                              child: Text(
                                context.translate.profile,
                                style: context.headlineSmall,
                              ),
                            ),
                          ),
                        ),
                        BlocBuilder<AuthBloc, AuthState>(
                          builder: (context, stateAuth) {
                            final profile = stateAuth.profile;
                            if (profile == null) {
                              return const SizedBox();
                            }
                            return ProfileHeader(
                              profile: profile,
                              aggregationsInfo: data.driverPerformance,
                            );
                          },
                        ),
                        const SizedBox(height: 24),
                        Expanded(
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                AppMenuItem(
                                  icon: Ionicons.person,
                                  title: context.translate.profileInfo,
                                  onPressed: () {
                                    context.router.push(const ProfileInfoRoute());
                                  },
                                ),
                                const SizedBox(height: 16),
                                AppMenuItem(
                                  icon: Ionicons.business,
                                  title: context.translate.payoutMethods,
                                  onPressed: () {
                                    context.router.pushAll([
                                      const PayoutAccountsRoute(),
                                    ]);
                                  },
                                ),
                                const SizedBox(height: 16),
                                AppMenuItem(
                                  icon: Ionicons.wallet,
                                  title: context.translate.wallet,
                                  onPressed: () {
                                    context.router.push(const WalletParentRoute());
                                  },
                                ),
                                const SizedBox(height: 16),
                                AppMenuItem(
                                  icon: Ionicons.card,
                                  title: context.translate.paymentMethods,
                                  onPressed: () {
                                    context.router.pushAll([
                                      const WalletParentRoute(),
                                      const PaymentMethodsRoute(),
                                    ]);
                                  },
                                ),
                                const SizedBox(height: 16),
                                AppMenuItem(
                                  icon: Ionicons.settings,
                                  title: context.translate.appSettings,
                                  onPressed: () {
                                    context.router.push(const SettingsParentRoute());
                                  },
                                ),
                                const SizedBox(height: 16),
                                AppMenuItem(
                                  icon: Icons.privacy_tip_outlined,
                                  title: 'Privacy Policy',
                                  onPressed: () {
                                    context.router.push(const PrivacyPolicyRoute());
                                  },
                                ),
                                const SizedBox(height: 16),
                                AppMenuItem(
                                  icon: Icons.description_outlined,
                                  title: 'Terms & Conditions',
                                  onPressed: () {
                                    context.router.push(const TermsConditionsRoute());
                                  },
                                ),
                                const SizedBox(height: 16),
                                AppMenuItem(
                                  icon: Icons.logout,
                                  title: context.translate.logout,
                                  onPressed: () => NavItem.logout.onPressed(context),
                                ),
                                const SizedBox(height: 16),
                                AppMenuItem(
                                  icon: Icons.delete_forever,
                                  title: 'Delete Account',
                                  onPressed: () => _confirmAndDeleteAccount(context),
                                ),
                                const SizedBox(height: 16),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ApiResponseError(:final message) => Center(
                    child: Text(message),
                  ),
              },
            ),
          );
        },
      ),
    );
  }
}

Future<void> _confirmAndDeleteAccount(BuildContext context) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: const Text('Delete Account'),
      content: const Text(
        'Are you sure you want to delete your account? This will deactivate your driver account and you will no longer be able to accept rides.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(true),
          child: const Text('Delete', style: TextStyle(color: Colors.red)),
        ),
      ],
    ),
  );

  if (confirmed != true) return;

  final response = await locator<AuthRepository>().deleteAccount();
  if (!context.mounted) return;

  if (response.isLoaded) {
    locator<AuthBloc>().onLoggedOut();
    context.router.replaceAll([const AuthRoute()]);
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Failed to delete account. Please try again.')),
    );
  }
}
