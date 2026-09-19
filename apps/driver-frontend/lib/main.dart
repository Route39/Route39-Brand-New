import 'package:better_localization/l10n/messages.dart';
import 'package:better_localization/localizations.dart' as common_messages;
import 'package:ridy_driver/config/env.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:path_provider/path_provider.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:flutter_common/core/theme/theme.dart';
import 'package:ridy_driver/config/theme/fonts.dart';
import 'package:ridy_driver/core/blocs/settings.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'core/router/app_router.dart';
import 'core/router/router_observer.dart';
import 'core/presentation/route39_splash.dart';

import 'package:firebase_messaging/firebase_messaging.dart';

import 'core/notifications/incoming_ride_notifications.dart';

import 'features/home/presentation/overlay/ride_request_overlay.dart';

import 'features/home/presentation/blocs/home.bloc.dart';

import 'firebase_options.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';
import 'dart:convert';
import 'dart:async';

@pragma("vm:entry-point")
void overlayMain() {
  runApp(const OverlayRideApp());
}

class OverlayRideApp extends StatefulWidget {
  const OverlayRideApp({super.key});

  @override
  State<OverlayRideApp> createState() => _OverlayRideAppState();
}

class _OverlayRideAppState extends State<OverlayRideApp> {
  Map<String, dynamic>? orderData;
  int secondsLeft = 15;
  Timer? timer;
  StreamSubscription? sub;

  bool isBubble = true;

  @override
  void initState() {
    super.initState();
    sub = FlutterOverlayWindow.overlayListener.listen((event) {
      try {
        final data = jsonDecode(event.toString());
        if (data is Map && data["type"] == "new_order") {
          setState(() {
            orderData = Map<String, dynamic>.from(data);
            isBubble = false;
            secondsLeft = 15;
          });
          _startTimer();
        } else if (data is Map && data["type"] == "bubble") {
          timer?.cancel();
          setState(() {
            orderData = null;
            isBubble = true;
          });
        }
      } catch (_) {}
    });
  }

  void _openApp() {
    FlutterOverlayWindow.shareData(jsonEncode({"action": "open_app"}));
  }

  void _startTimer() {
    timer?.cancel();
    timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (secondsLeft <= 1) {
        t.cancel();
        _decline();
      } else {
        setState(() => secondsLeft--);
      }
    });
  }

  void _accept() {
    timer?.cancel();
    FlutterOverlayWindow.shareData(jsonEncode({"action": "accept"}));
    FlutterOverlayWindow.closeOverlay();
  }

  void _decline() {
    timer?.cancel();
    FlutterOverlayWindow.shareData(jsonEncode({"action": "decline"}));
    FlutterOverlayWindow.closeOverlay();
  }

  @override
  void dispose() {
    timer?.cancel();
    sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = orderData;
    if (isBubble) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Material(
          color: Colors.transparent,
          child: GestureDetector(
            onTap: _openApp,
            child: Center(
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFB30000), width: 2),
                  boxShadow: const [
                    BoxShadow(color: Colors.black38, blurRadius: 8, offset: Offset(0, 2)),
                  ],
                  image: const DecorationImage(
                    image: AssetImage('assets/images/logo.png'),
                    fit: BoxFit.cover,
                  ),
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ),
      );
    }
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor: const Color(0xFFF7F7F7),
        body: data == null
            ? const SizedBox.shrink()
            : SafeArea(
                child: Column(
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
                      color: const Color(0xFFB30000),
                      child: Row(
                        children: [
                          const Icon(Icons.notifications, color: Colors.white, size: 28),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Text(
                              'NEW RIDE REQUEST',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          Container(
                            width: 46,
                            height: 46,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              shape: BoxShape.circle,
                            ),
                            child: Text(
                              '$secondsLeft',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const SizedBox(height: 10),
                            const Text(
                              'A customer is waiting for you',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              data['serviceName']?.toString() ?? '',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 15, color: Colors.grey, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 22),
                            Container(
                              padding: const EdgeInsets.all(18),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: const [
                                  BoxShadow(color: Color(0x16000000), blurRadius: 18, offset: Offset(0, 6)),
                                ],
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: _InfoItem(
                                      icon: Icons.currency_rupee,
                                      title: 'ESTIMATED FARE',
                                      value: data['fare']?.toString() ?? '',
                                    ),
                                  ),
                                  Expanded(
                                    child: _InfoItem(
                                      icon: Icons.map_outlined,
                                      title: 'DISTANCE',
                                      value: data['distance']?.toString() ?? '',
                                    ),
                                  ),
                                  Expanded(
                                    child: _InfoItem(
                                      icon: Icons.access_time,
                                      title: 'DURATION',
                                      value: data['duration']?.toString() ?? '',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),
                            SizedBox(
                              height: 58,
                              child: ElevatedButton(
                                onPressed: _accept,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFB30000),
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: const Text('ACCEPT ORDER', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                              ),
                            ),
                            const SizedBox(height: 10),
                            TextButton(
                              onPressed: _decline,
                              child: const Text('Decline', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;

  const _InfoItem({required this.icon, required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFFB30000), size: 26),
        const SizedBox(height: 7),
        Text(title, style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w700)),
        const SizedBox(height: 3),
        Text(value, textAlign: TextAlign.center, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
      ],
    );
  }
}

void main() async {
  try {
    SentryWidgetsFlutterBinding.ensureInitialized();
    await dotenv.load(
        fileName: '.env.${kReleaseMode ? 'prod' : 'dev'}', isOptional: true);
    HydratedBloc.storage = await HydratedStorage.build(
      storageDirectory: kIsWeb
          ? HydratedStorageDirectory.web
          : HydratedStorageDirectory((await getTemporaryDirectory()).path),
    );
    // await HydratedBloc.storage.clear();
    WakelockPlus.enable().catchError((_) {});
    configureDependencies();
    await Hive.initFlutter();
    try {
      await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform);
    } catch (e) {
      if (!e.toString().contains('duplicate-app')) {
        rethrow;
      }
    }
    if (dotenv.maybeGet('SENTRY_DSN') != null) {
      await SentryFlutter.init((options) {
        options.dsn = dotenv.maybeGet('SENTRY_DSN');
        // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
        // We recommend adjusting this value in production.
        options.tracesSampleRate = 1.0;
        // The sampling rate for profiling is relative to tracesSampleRate
        // Setting to 1.0 will profile 100% of sampled transactions:
        options.profilesSampleRate = 1.0;
      }, appRunner: () => runApp(SentryWidget(child: const MyApp())));
    } else {
      runApp(const MyApp());
    }
  } catch (e, stackTrace) {
    runApp(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  'Initialization Error:\n$e\n\n$stackTrace',
                  style: const TextStyle(color: Colors.red, fontSize: 12),
                  textDirection: TextDirection.ltr,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final shortestSide = MediaQuery.of(context).size.shortestSide;
    if (shortestSide < 600) {
      SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp, DeviceOrientation.portraitDown]);
    }
    return BlocProvider.value(
      value: locator<SettingsCubit>(),
      child: BlocBuilder<SettingsCubit, SettingsState>(
        builder: (context, state) {
          return MaterialApp.router(
            debugShowCheckedModeBanner: false,
            title: Env.appName,
            themeMode: ThemeMode.light,
            theme: AppTheme.light(Fonts.primary, Fonts.secondary),
            darkTheme: AppTheme.dark(Fonts.primary, Fonts.secondary),
            locale: Locale(state.locale),
            localizationsDelegates: const [...S.localizationsDelegates, common_messages.S.delegate],
            supportedLocales: S.supportedLocales,
            routerConfig: locator<AppRouter>().config(navigatorObservers: () => [RouterObserver()]),

          );
        },
      ),
    );
  }
}
