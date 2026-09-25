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
import 'package:android_intent_plus/android_intent.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'dart:convert';
import 'dart:async';
import 'package:ridy_driver/features/home/presentation/overlay/ride_request_overlay.dart' as ovl;

@pragma("vm:entry-point")
void overlayMain() {
  runApp(const MaterialApp(
    debugShowCheckedModeBanner: false,
    home: ovl.RideRequestOverlayCard(),
  ));
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

  Future<void> _openApp() async {
    // Send the message too, in case the main app is alive and listening
    // (keeps it in step with the "accept" flow).
    FlutterOverlayWindow.shareData(jsonEncode({"action": "open_app"}));
    // Directly bring the app forward from this overlay's own engine as
    // well - this is the only path that works if the main app process
    // was fully killed (no listener would exist to act on shareData).
    try {
      final packageName = (await PackageInfo.fromPlatform()).packageName;
      final intent = AndroidIntent(
        action: 'action_main',
        category: 'android.intent.category.LAUNCHER',
        package: packageName,
        flags: const [268435456, 131072],
      );
      await intent.launch();
    } catch (_) {}
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
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFB30000), width: 3),
                  boxShadow: const [
                    BoxShadow(color: Colors.black45, blurRadius: 12, offset: Offset(0, 3)),
                  ],
                  image: const DecorationImage(
                    image: AssetImage('assets/images/overlay_bubble_icon.png'),
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
    final pickupAddress = data?['pickupAddress']?.toString();
    final dropoffAddress = data?['dropoffAddress']?.toString();
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Material(
        color: Colors.transparent,
        child: data == null
            ? const SizedBox.shrink()
            // Bottom-anchored half-screen card, Rapido-style - not full screen.
            : Align(
                alignment: Alignment.bottomCenter,
                child: Container(
                  margin: const EdgeInsets.fromLTRB(10, 0, 10, 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF7F7F7),
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: const [
                      BoxShadow(color: Color(0x33000000), blurRadius: 22, offset: Offset(0, 8)),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.fromLTRB(20, 16, 16, 16),
                        color: const Color(0xFFB30000),
                        child: Row(
                          children: [
                            const Icon(Icons.notifications, color: Colors.white, size: 24),
                            const SizedBox(width: 10),
                            const Expanded(
                              child: Text(
                                'NEW RIDE REQUEST',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 17,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            Container(
                              width: 38,
                              height: 38,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.15),
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '$secondsLeft',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Flexible(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                data['serviceName']?.toString() ?? '',
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 15, color: Colors.grey, fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 14),
                              Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: const [
                                    BoxShadow(color: Color(0x16000000), blurRadius: 12, offset: Offset(0, 4)),
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: _InfoItem(
                                        icon: Icons.currency_rupee,
                                        title: 'FARE',
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
                              if (pickupAddress != null && pickupAddress.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                _AddressRow(
                                  icon: Icons.circle,
                                  iconColor: const Color(0xFF00A651),
                                  label: 'PICKUP',
                                  address: pickupAddress,
                                ),
                              ],
                              if (dropoffAddress != null && dropoffAddress.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                _AddressRow(
                                  icon: Icons.location_on,
                                  iconColor: const Color(0xFFB30000),
                                  label: 'DROP',
                                  address: dropoffAddress,
                                ),
                              ],
                              const SizedBox(height: 18),
                              SizedBox(
                                height: 52,
                                child: ElevatedButton(
                                  onPressed: _accept,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFB30000),
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  ),
                                  child: const Text('ACCEPT ORDER', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                                ),
                              ),
                              const SizedBox(height: 6),
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
      ),
    );
  }
}

class _AddressRow extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String address;

  const _AddressRow({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.address,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 3),
          child: Icon(icon, size: 12, color: iconColor),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w700)),
              Text(
                address,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ],
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
            builder: (context, child) {
              return Route39Splash(child: child ?? const SizedBox());
            },
          );
        },
      ),
    );
  }
}
