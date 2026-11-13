import 'dart:async';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:android_intent_plus/android_intent.dart';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:package_info_plus/package_info_plus.dart';

@pragma('vm:entry-point')
void overlayMain() {
  runApp(const MaterialApp(
    debugShowCheckedModeBanner: false,
    home: RideRequestOverlayCard(),
  ));
}

class RideRequestOverlayCard extends StatefulWidget {
  const RideRequestOverlayCard({super.key});
  @override
  State<RideRequestOverlayCard> createState() => _RideRequestOverlayCardState();
}

class _RideRequestOverlayCardState extends State<RideRequestOverlayCard> {
  static const _total = 15;
  static const _red = Color(0xFFB30000);

  StreamSubscription? _sub;
  Timer? _poll;
  final AudioPlayer _player = AudioPlayer();
  Timer? _timer;
  Map<String, dynamic> _data = const {};
  int _left = _total;

  @override
  void initState() {
    super.initState();
    _sub = FlutterOverlayWindow.overlayListener.listen(_onData);
    _poll = Timer.periodic(const Duration(milliseconds: 600), (_) => _checkPending());
    _checkPending();
  }

  Future<void> _checkPending() async {
    try {
      final p = await SharedPreferences.getInstance();
      await p.reload();
      final raw = p.getString('r39_pending_offer');
      if (raw == null) return;
      final d = jsonDecode(raw) as Map<String, dynamic>;
      final ts = (d['ts'] as num?)?.toInt() ?? 0;
      if (DateTime.now().millisecondsSinceEpoch - ts > 15000) return;
      if (_data['type'] == 'new_order' && '${_data['orderId']}' == '${d['orderId']}') return;
      debugPrint('R39_OVERLAY_PENDING ${d['orderId']}');
      if (!mounted) return;
      setState(() => _data = d);
      _startTimer();
    } catch (e) { debugPrint('R39_PENDING_ERR $e'); }
  }

  Future<void> _playSound() async {
    try {
      if (_player.state == PlayerState.playing) return;
      await _player.setReleaseMode(ReleaseMode.loop);
      await _player.play(AssetSource('notification.mp3'));
      debugPrint('R39_SOUND_PLAY');
    } catch (e) { debugPrint('R39_SOUND_ERR $e'); }
  }

  void _stopSound() { try { _player.stop(); } catch (_) {} }

  Future<void> _clearPending() async {
    try { (await SharedPreferences.getInstance()).remove('r39_pending_offer'); } catch (_) {}
  }

  @override
  void dispose() {
    _sub?.cancel();
    _poll?.cancel();
    _player.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _onData(dynamic e) {
    debugPrint('R39_OVERLAY_GOT ${e.runtimeType} $e');
    if (e is! String) return;
    try {
      final d = jsonDecode(e) as Map<String, dynamic>;
      setState(() => _data = d);
      if (d['type'] == 'new_order') { _startTimer(); } else { _stopSound(); }
    } catch (_) {}
  }

  void _startTimer() {
    _timer?.cancel();
    _playSound();
    setState(() => _left = _total);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_left <= 1) {
        t.cancel();
        _stopSound();
        return;
      }
      setState(() => _left--);
    });
  }

  Future<void> _send(String action) async {
    _timer?.cancel();
    await _clearPending();
    _stopSound();
    try {
      FlutterOverlayWindow.shareData(jsonEncode({'action': action}));
      debugPrint('R39_OVERLAY_SENT $action');
      await AndroidIntent(
        action: 'android.intent.action.MAIN',
        category: 'android.intent.category.LAUNCHER',
        package: 'com.route39.pilot',
        componentName: 'com.ridy.taxi.driver_flutter.MainActivity',
        flags: [0x10000000, 0x04000000],
      ).launch();
      debugPrint('R39_OVERLAY_LAUNCHED');
      await Future.delayed(const Duration(milliseconds: 300));
    } catch (e) {
      debugPrint('R39_OVERLAY_SEND_ERROR: \$e');
    } finally {
      await FlutterOverlayWindow.closeOverlay();
    }
  }

  Future<void> _openApp() { debugPrint("R39_BUBBLE_TAP"); return _send("open_app"); }
  Future<void> _accept() { debugPrint("R39_ACCEPT_TAP"); return _send("accept"); }

  Future<void> _decline() async {
    _timer?.cancel();
    debugPrint("R39_DECLINE_TAP");
    await _clearPending();
    _stopSound();
    try {
      final url = _s('gqlUrl'), token = _s('token'), id = _s('orderId');
      if (url.isNotEmpty && token.isNotEmpty && id.isNotEmpty) {
        final r = await http.post(
          Uri.parse(url),
          headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
          body: jsonEncode({'query': r'mutation($id: ID!) { rejectRideOffer(orderId: $id) }', 'variables': {'id': id}}),
        ).timeout(const Duration(seconds: 8));
        debugPrint('R39_REJECT_HTTP ${r.statusCode} ${r.body}');
      } else {
        debugPrint('R39_REJECT_MISSING id=$id');
      }
    } catch (e) {
      debugPrint('R39_REJECT_ERR $e');
    }
    await FlutterOverlayWindow.closeOverlay();
  }

  String _s(String k) => (_data[k] ?? '').toString();

  @override
  Widget build(BuildContext context) {
    final type = _data['type'];
    debugPrint('R39_OVERLAY_BUILD type=$type');
    if (type == 'new_order') return _card();
    if (type == 'bubble') return _bubble();
    return const SizedBox.shrink();
  }

  Widget _bubble() => Material(
        color: Colors.transparent,
        child: GestureDetector(
          onTap: _openApp,
          child: Container(
            margin: const EdgeInsets.all(6),
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: _red,
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: Color(0x55000000), blurRadius: 8)],
            ),
            child: ClipOval(
              child: Image.asset('assets/images/bubble_app_icon.png', fit: BoxFit.cover),
            ),
          ),
        ),
      );

  Widget _stop(IconData icon, Color c, String label, String addr) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(padding: const EdgeInsets.only(top: 3), child: Icon(icon, size: 14, color: c)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label,
                  style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600)),
              Text(addr.isEmpty ? '-' : addr,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            ]),
          ),
        ]),
      );

  Widget _card() {
    final fare = _s('fare');
    final fareText = fare.contains('₹') ? fare : '₹$fare';
    return Material(
      color: Colors.transparent,
      child: Align(
        alignment: Alignment.topCenter,
        child: SingleChildScrollView(
          child: Container(
            margin: const EdgeInsets.fromLTRB(12, 160, 12, 0),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(color: Color(0x33000000), blurRadius: 20, offset: Offset(0, -4)),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF2F2F2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(_s('serviceName').isEmpty ? 'Auto' : _s('serviceName'),
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 10),
                Text(fareText,
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900)),
                Text('${_s('distance')}  •  ${_s('duration')}',
                    style: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                _stop(Icons.circle, Colors.green, 'Pickup', _s('pickupAddress')),
                _stop(Icons.arrow_downward, _red, 'Drop', _s('dropoffAddress')),
                const SizedBox(height: 6),
                Row(children: [
                  SizedBox(
                    width: 56,
                    height: 56,
                    child: Stack(alignment: Alignment.center, children: [
                      SizedBox(
                        width: 56,
                        height: 56,
                        child: CircularProgressIndicator(
                          value: _left / _total,
                          strokeWidth: 3,
                          color: _red,
                          backgroundColor: const Color(0xFFEEEEEE),
                        ),
                      ),
                      IconButton(icon: const Icon(Icons.close), onPressed: _decline),
                    ]),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: SizedBox(
                      height: 56,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _red,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                        ),
                        onPressed: _accept,
                        child: const Text('Accept',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                      ),
                    ),
                  ),
                ]),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
