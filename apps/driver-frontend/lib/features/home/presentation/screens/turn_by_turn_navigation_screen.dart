import 'package:flutter/material.dart';
import 'package:generic_map/interfaces/place.dart';
import 'package:url_launcher/url_launcher_string.dart';

/// Opens Google Maps turn-by-turn navigation to [place], then returns.
/// (In-app Navigation SDK removed: it clashes with google_maps_flutter on iOS.)
class TurnByTurnNavigationScreen extends StatefulWidget {
  static bool isOpen = false;
  final Place place;
  const TurnByTurnNavigationScreen({super.key, required this.place});
  @override
  State<TurnByTurnNavigationScreen> createState() => _TurnByTurnNavigationScreenState();
}

class _TurnByTurnNavigationScreenState extends State<TurnByTurnNavigationScreen> {
  @override
  void initState() {
    super.initState();
    TurnByTurnNavigationScreen.isOpen = true;
    WidgetsBinding.instance.addPostFrameCallback((_) => _open());
  }

  Future<void> _open() async {
    final ll = widget.place.latLng;
    final url = 'https://www.google.com/maps/dir/?api=1&destination=${ll.latitude},${ll.longitude}&travelmode=driving&dir_action=navigate';
    try {
      await launchUrlString(url, mode: LaunchMode.externalApplication);
    } catch (_) {}
    if (mounted) Navigator.of(context).pop();
  }

  @override
  void dispose() {
    TurnByTurnNavigationScreen.isOpen = false;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: CircularProgressIndicator()));
}
