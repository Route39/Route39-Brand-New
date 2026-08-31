import 'package:ridy_driver/config/env.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/features/home/presentation/blocs/home.bloc.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/theme/animation_duration.dart';
import 'package:ionicons/ionicons.dart';

import '../../components/notice_bar_content.dart';

class OnlineOfflineSheet extends StatefulWidget {
  final HomeState state;

  const OnlineOfflineSheet({
    super.key,
    required this.state,
  });

  @override
  State<OnlineOfflineSheet> createState() => _OnlineOfflineSheetState();
}

class _OnlineOfflineSheetState extends State<OnlineOfflineSheet> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  static const Color liteRed = Color(0xFFE05C5C);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: liteRed,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedSwitcher(
            duration: AnimationDuration.pageStateTransitionMobile,
            child: switch (widget.state.driverStatus) {
              HomeStateDriverStatus.online => const SizedBox(),
              HomeStateDriverStatus.offline => NoticeBarContent(
                  icon: Ionicons.car,
                  text: context.translate.driverOfflineTitle,
                ),
              _ => const SizedBox(),
            },
          ),
          Container(
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                color: ColorPalette.neutralVariant99,
              ),
              child: SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (widget.state.driverStatus == HomeStateDriverStatus.offline)
                        BlocBuilder<AuthBloc, AuthState>(
                          builder: (context, authState) {
                            return FadeTransition(
                              opacity: _fadeAnimation,
                              child: SlideTransition(
                                position: _slideAnimation,
                                child: Padding(
                                  padding: const EdgeInsets.only(bottom: 16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(10),
                                            decoration: BoxDecoration(
                                              color: liteRed.withValues(alpha: 0.12),
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(
                                              Ionicons.handLeft,
                                              color: liteRed,
                                              size: 22,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Hi ${authState.profile?.firstName ?? ''}',
                                                style: context.titleLarge,
                                              ),
                                              Text(
                                                _greeting(),
                                                style: context.labelLarge,
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                    ],
                  ),
                ),
              )),
        ],
      ),
    );
  }
}
