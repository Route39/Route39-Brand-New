import 'package:flutter/foundation.dart';

/// Tracks which popular place (Bus Stand / Railway station) is currently
/// selected on the welcome sheet, so the map's back-arrow button (which
/// lives in a different part of the widget tree) knows when to appear.
final ValueNotifier<String?> activePopularSearchNotifier = ValueNotifier<String?>(null);
