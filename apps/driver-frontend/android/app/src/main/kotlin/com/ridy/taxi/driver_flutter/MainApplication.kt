package com.ridy.taxi.driver_flutter

import android.app.Application
import io.flutter.FlutterInjector
import io.flutter.embedding.engine.FlutterEngineCache
import io.flutter.embedding.engine.FlutterEngineGroup
import io.flutter.embedding.engine.dart.DartExecutor

// Pre-creates the overlay engine so the ride-request overlay can be shown
// even when the app was swiped away and woken only by an FCM push.
class MainApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        if (FlutterEngineCache.getInstance().get("myCachedEngine") == null) {
            val loader = FlutterInjector.instance().flutterLoader()
            loader.startInitialization(this)
            loader.ensureInitializationComplete(this, null)
            val engine = FlutterEngineGroup(this).createAndRunEngine(
                this,
                DartExecutor.DartEntrypoint(loader.findAppBundlePath(), "overlayMain")
            )
            FlutterEngineCache.getInstance().put("myCachedEngine", engine)
        }
    }
}
