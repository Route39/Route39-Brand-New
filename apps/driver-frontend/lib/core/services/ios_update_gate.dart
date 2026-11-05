import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

/// iOS-only: compares the installed version with the App Store version
/// and shows an "Update available" card. force=true hides the "Later" button.
class IosUpdateGate extends StatefulWidget {
  final Widget child;
  final String bundleId;
  final bool force;
  const IosUpdateGate({super.key, required this.child, required this.bundleId, required this.force});
  @override
  State<IosUpdateGate> createState() => _IosUpdateGateState();
}

class _IosUpdateGateState extends State<IosUpdateGate> {
  String? _storeUrl;
  bool _dismissed = false;

  @override
  void initState() {
    super.initState();
    if (!kIsWeb && !kDebugMode && defaultTargetPlatform == TargetPlatform.iOS) {
      Future.delayed(const Duration(seconds: 3), _check);
    }
  }

  bool _isNewer(String store, String current) {
    final a = store.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final b = current.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    for (var i = 0; i < 3; i++) {
      final x = i < a.length ? a[i] : 0;
      final y = i < b.length ? b[i] : 0;
      if (x != y) return x > y;
    }
    return false;
  }

  Future<void> _check() async {
    try {
      final info = await PackageInfo.fromPlatform();
      final res = await http.get(Uri.parse(
          'https://itunes.apple.com/lookup?bundleId=${widget.bundleId}&country=in&t=${DateTime.now().millisecondsSinceEpoch}'));
      final results = (jsonDecode(res.body) as Map<String, dynamic>)['results'] as List?;
      if (results == null || results.isEmpty) return;
      final store = results.first['version'] as String?;
      final url = results.first['trackViewUrl'] as String?;
      if (store != null && url != null && _isNewer(store, info.version) && mounted) {
        setState(() => _storeUrl = url);
      }
    } catch (e) {
      debugPrint('[UPDATE] iOS check failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final show = _storeUrl != null && !(_dismissed && !widget.force);
    return Stack(children: [
      widget.child,
      if (show)
        Positioned.fill(
          child: Material(
            color: Colors.black54,
            child: Center(
              child: Container(
                margin: const EdgeInsets.all(32),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.system_update, size: 48, color: Colors.red),
                  const SizedBox(height: 12),
                  const Text('Update available', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(
                    widget.force ? 'Please update to continue using the app.' : 'A new version is available on the App Store.',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                      onPressed: () => launchUrl(Uri.parse(_storeUrl!), mode: LaunchMode.externalApplication),
                      child: const Text('Update'),
                    ),
                  ),
                  if (!widget.force)
                    TextButton(onPressed: () => setState(() => _dismissed = true), child: const Text('Later')),
                ]),
              ),
            ),
          ),
        ),
    ]);
  }
}
