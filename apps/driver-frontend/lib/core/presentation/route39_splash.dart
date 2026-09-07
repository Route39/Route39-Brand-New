import 'package:flutter/material.dart';

class Route39Splash extends StatefulWidget {
  final Widget child;
  const Route39Splash({super.key, required this.child});

  @override
  State<Route39Splash> createState() => _Route39SplashState();
}

class _Route39SplashState extends State<Route39Splash> {
  bool _show = true;
  int _phase = 0;

  @override
  void initState() {
    super.initState();
    _phase = 1;
    Future.delayed(const Duration(milliseconds: 1400), () {
      if (mounted) setState(() => _phase = 2);
    });
    Future.delayed(const Duration(milliseconds: 3400), () {
      if (mounted) setState(() => _show = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (_show)
          AnimatedOpacity(
            opacity: _show ? 1 : 0,
            duration: const Duration(milliseconds: 500),
            child: Container(
              color: Colors.white,
              width: double.infinity,
              height: double.infinity,
              child: Center(
                child: SizedBox(
                  height: 120,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      AnimatedScale(
                        scale: _phase == 1 ? 1 : 0.3,
                        duration: Duration(milliseconds: _phase == 1 ? 700 : 400),
                        curve: Curves.elasticOut,
                        child: AnimatedOpacity(
                          opacity: _phase == 1 ? 1 : 0,
                          duration: const Duration(milliseconds: 300),
                          child: Icon(
                            Icons.location_on,
                            color: const Color(0xFFD32F2F),
                            size: 80,
                            shadows: [
                              Shadow(
                                color: const Color(0xFFD32F2F).withValues(alpha: 0.5),
                                blurRadius: 20,
                              ),
                            ],
                          ),
                        ),
                      ),
                      AnimatedOpacity(
                        opacity: _phase >= 2 ? 1 : 0,
                        duration: const Duration(milliseconds: 600),
                        curve: Curves.easeOutCubic,
                        child: AnimatedScale(
                          scale: _phase >= 2 ? 1 : 0.85,
                          duration: const Duration(milliseconds: 600),
                          curve: Curves.easeOutCubic,
                          child: Image.asset(
                            'assets/images/route39_logo.png',
                            width: 220,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
