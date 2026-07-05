// Swift module names follow SPM *target* names (see each plugin’s Package.swift),
// not the library product name — `import CapacitorApp` fails; use these instead.
import AppPlugin
import SignInWithApple
import SplashScreenPlugin
import StatusBarPlugin
import CameraPlugin

/// Touch plugin types so they are linked and visible to `NSClassFromString` in
/// `CapacitorBridge.registerPlugins()` (avoids **"SignInWithApple plugin is not implemented on ios"**).
enum CapacitorPluginBootstrap {
    static func ensurePluginsLinked() {
        _ = SignInWithApple.self
        _ = AppPlugin.self
        _ = SplashScreenPlugin.self
        _ = StatusBarPlugin.self
        _ = CameraPlugin.self
    }
}
