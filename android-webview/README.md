# Al Azhar — Android WebView Project

- **App Name:** Al Azhar
- **Package Name:** `com.alazhar.app`
- **Website URL:** `https://alazhar-app.vercel.app`
- **Entry Behavior:** Opens with branded Splash Screen (`SplashActivity`) directly into the website in **Visitor** mode (no extra native login screen; User/Admin login and role switching run inside the website).

## Open in Android Studio
1. Open the `android-webview` folder in Android Studio (**File → Open → `android-webview`**).
2. Let Gradle sync complete (uses SDK 34, Kotlin `1.9.24`, AndroidX WebView + SwipeRefreshLayout + Material).
3. Click **Build → Build Bundle(s) / APK(s) → Build APK(s)** or run directly on a device/emulator.

## Included Files
- `app/src/main/java/com/alazhar/app/SplashActivity.kt` + `res/layout/activity_splash.xml`
- `app/src/main/java/com/alazhar/app/MainActivity.kt` + `res/layout/activity_main.xml`
- `app/src/main/AndroidManifest.xml` (`INTERNET` & `ACCESS_NETWORK_STATE` permissions)
- `app/src/main/res/drawable/ic_launcher_logo.jpg` (App icon & Splash logo)
- `app/build.gradle.kts`, `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties`
