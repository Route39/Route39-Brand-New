import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';

class LookingForDriverSheet extends StatefulWidget {
  const LookingForDriverSheet({super.key});

  @override
  State<LookingForDriverSheet> createState() => _LookingForDriverSheetState();
}

class _LookingForDriverSheetState extends State<LookingForDriverSheet> with TickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Alignment> _position;
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200));
    _position = AlignmentTween(
      begin: const Alignment(-1.15, 1.0),
      end: const Alignment(1.15, 1.0),
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.linear));
    _pulseController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))..repeat();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await Future.wait([
        precacheImage(const AssetImage('assets/images/ev_auto_icon.png'), context),
        precacheImage(const AssetImage('assets/images/city_bg.png'), context),
      ]);
      if (mounted) {
        _controller.repeat();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: Colors.white,
      child: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AspectRatio(
                aspectRatio: 1376 / 768,
                child: Stack(
                  fit: StackFit.expand,
                  alignment: Alignment.bottomCenter,
                  children: [
                    Image.asset(
                      'assets/images/city_bg.png',
                      fit: BoxFit.contain,
                    ),
                    AnimatedBuilder(
                      animation: _controller,
                      builder: (context, child) {
                        return Align(
                          alignment: _position.value,
                          child: child,
                        );
                      },
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 40),
                        child: Image.asset(
                          'assets/images/ev_auto_icon.png',
                          width: (MediaQuery.of(context).size.width * 0.12).clamp(90.0, 220.0),
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Looking for a driver',
                      style: context.titleMedium?.copyWith(color: Colors.black, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: 100,
                      height: 100,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          AnimatedBuilder(
                            animation: _pulseController,
                            builder: (context, child) {
                              final t = _pulseController.value;
                              return Opacity(
                                opacity: (1 - t).clamp(0.0, 1.0) * 0.35,
                                child: Transform.scale(
                                  scale: 1 + t * 1.1,
                                  child: Container(
                                    width: 60,
                                    height: 60,
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Color(0xFFE53935),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                          AnimatedBuilder(
                            animation: _pulseController,
                            builder: (context, child) {
                              final t = (_pulseController.value + 0.5) % 1.0;
                              return Opacity(
                                opacity: (1 - t).clamp(0.0, 1.0) * 0.25,
                                child: Transform.scale(
                                  scale: 1 + t * 1.1,
                                  child: Container(
                                    width: 60,
                                    height: 60,
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Color(0xFFE53935),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                          Container(
                            width: 48,
                            height: 48,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFFE53935), width: 1.5),
                            ),
                            child: const Icon(Ionicons.location, color: Color(0xFFE53935), size: 22),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF2F2F2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Ionicons.time, size: 14, color: Colors.black54),
                              const SizedBox(width: 6),
                              Text('USUALLY < 60S', style: context.labelSmall?.copyWith(color: Colors.black54, letterSpacing: 0.5)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF2F2F2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Ionicons.shield, size: 14, color: Color(0xFF388E3C)),
                              const SizedBox(width: 6),
                              Text('VERIFIED DRIVERS', style: context.labelSmall?.copyWith(color: const Color(0xFF388E3C), letterSpacing: 0.5)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 40),
                    SizedBox(
                      width: double.infinity,
                      child: TextButton.icon(
                        style: TextButton.styleFrom(
                          backgroundColor: const Color(0xFFF2F2F2),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                        ),
                        onPressed: () {
                          locator<HomeBloc>().cancelRide(
                              orderId: locator<HomeBloc>().state.activeOrder!.id, cancelReasonId: null, cancelReasonNote: null);
                        },
                        icon: const Icon(Icons.close, color: Color(0xFFE53935), size: 18),
                        label: Text(context.translate.cancelRide, style: const TextStyle(color: Color(0xFFE53935), fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
