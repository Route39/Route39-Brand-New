import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return const FirebaseOptions(
        apiKey: 'dummy-api-key',
        appId: '1:1234567890:web:1234567890',
        messagingSenderId: '1234567890',
        projectId: 'dummy-project',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return const FirebaseOptions(
          apiKey: 'dummy-api-key',
          appId: '1:1234567890:android:1234567890',
          messagingSenderId: '1234567890',
          projectId: 'dummy-project',
        );
      case TargetPlatform.iOS:
        return const FirebaseOptions(
          apiKey: 'dummy-api-key',
          appId: '1:1234567890:ios:1234567890',
          messagingSenderId: '1234567890',
          projectId: 'dummy-project',
          iosBundleId: 'com.dummy.driver',
        );
      case TargetPlatform.macOS:
        return const FirebaseOptions(
          apiKey: 'dummy-api-key',
          appId: '1:1234567890:ios:1234567890',
          messagingSenderId: '1234567890',
          projectId: 'dummy-project',
          iosBundleId: 'com.dummy.driver',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }
}
