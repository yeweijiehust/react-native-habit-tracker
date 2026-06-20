# 11: Production Builds & Android Studio

Development with Expo Go is great for fast iteration, but eventually you need a standalone APK to distribute your app. This tutorial covers turning your Expo project into a native Android app.

## Prerequisites

- Tutorial 00: Prerequisites (JDK 17, Android Studio installed)
- Complete understanding of the Habit Tracker project
- An Android device or emulator for testing

## What You'll Learn

- The difference between Expo Go, development builds, and production builds
- Continuous Native Generation (CNG)
- The `expo prebuild` command
- Building and running locally with `expo run:android`
- Using Android Studio for native debugging
- Generating APK and AAB files
- EAS Build for cloud builds

---

## 1. Three Types of Builds

### Expo Go (Development Only)

```
Expo Go = Sandboxed runtime that loads your JS bundle
```

- **No build step** — just run `bun start` and scan the QR code
- **Limitations** — only works with Expo SDK modules (no custom native code)
- **Perfect for** — rapid development, prototyping

### Development Build

```
Development Build = Your app + Expo dev tools = Standalone APK you install
```

- Requires `npx expo run:android` to compile native code
- Includes the Expo dev client (Fast Refresh, debug menus)
- **Perfect for** — testing on real device, debugging native code

### Production Build

```
Production Build = Your app only = Installable APK/AAB for stores
```

- Stripped of dev tools
- Optimized for performance
- Can be signed for distribution
- **Perfect for** — Play Store release, sharing with testers

## 2. Continuous Native Generation (CNG)

Expo uses **CNG** — your `app.json` and config plugins are the source of truth for native configuration. The `android/` directory is generated from them.

```
app.json  +  config plugins
        │
        ▼
   expo prebuild
        │
        ▼
   android/  (generated — do NOT edit directly!)
```

### Why CNG?

1. **No manual config** — AndroidManifest.xml, build.gradle, etc. are all generated automatically
2. **Config plugins** — libraries like `expo-splash-screen` modify native files via plugins
3. **Reproducible** — regenerate native files anytime with `npx expo prebuild --clean`

### The Rule

> NEVER edit files inside `android/` directly. If you need to change native configuration, use a config plugin in `app.json` or `app.config.js`.

Edits to `android/` will be lost the next time you run `prebuild`.

## 3. The Prebuild Command

```bash
# Generate native projects
npx expo prebuild

# Generate for Android only
npx expo prebuild --platform android

# Clean and regenerate (deletes android/ first)
npx expo prebuild --clean
```

### What Prebuild Does

1. Reads `app.json` and all config plugins
2. Downloads the correct Expo template for your SDK version
3. Applies all config plugins (modifying AndroidManifest.xml, build.gradle, etc.)
4. Outputs `android/` directory (and `ios/` if on macOS)

### When to Prebuild

| Situation | Action |
|-----------|--------|
| First time running on a device | `npx expo prebuild` |
| Added a library with native code | `npx expo prebuild` |
| Changed a config plugin | `npx expo prebuild` |
| Something is broken | `npx expo prebuild --clean` |
| Normal development | Don't prebuild — use Expo Go |

## 4. Building Locally

After prebuild, you can build and install directly:

```bash
# Build and run on connected Android device/emulator
npx expo run:android

# Build release APK
cd android
# On Windows:
./gradlew assembleRelease
# On macOS/Linux:
./gradlew assembleRelease
```

### What `expo run:android` Does

1. Compiles TypeScript/JSX into JavaScript
2. Bundles it with Metro
3. Compiles Java/Kotlin native code with Gradle
4. Packages everything into an APK
5. Installs and launches it on your device/emulator

This takes **3-10 minutes** on first run (Gradle downloads dependencies), but subsequent runs are faster (cached).

## 5. Android Studio Integration

### Opening in Android Studio

```bash
npx expo prebuild                    # Generate android/
```

Then open Android Studio → **Open an existing project** → select `android/` directory.

### What You Can Do in Android Studio

1. **Device Manager** — create/manage emulators (Pixel, etc.)
2. **Build APK** — `Build → Build Bundle(s) / APK(s) → Build APK(s)`
3. **Build Signed Bundle** — `Build → Generate Signed Bundle / APK`
4. **Native Debugging** — set breakpoints in Java/Kotlin code (from node_modules)
5. **Logcat Viewer** — view Android system logs including React Native logs

### Native Debugging

Android Studio's debugger can step through native code:

1. Set a breakpoint in a `.java` or `.kt` file (e.g., in `expo-sqlite` source)
2. Click the **Debug** button (not Run)
3. Use the app — when it hits the breakpoint, Android Studio pauses execution

This is invaluable when troubleshooting native crashes or unexpected behavior.

### Common Android Studio Tasks

| Task | How |
|------|-----|
| Run on emulator | Click green ▶ button |
| Build APK | Build → Build Bundle(s)/APK(s) → Build APK(s) |
| Build signed release | Build → Generate Signed Bundle / APK |
| View logs | View → Tool Windows → Logcat |
| Profile performance | View → Tool Windows → Profiler |

## 6. Building APK Without Android Studio

You can build an APK directly from the command line:

### Debug APK (unsigned)

```bash
cd android
# Windows
./gradlew assembleDebug
# macOS/Linux
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (unsigned)

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

> **Note**: An unsigned APK cannot be installed. You must sign it with a keystore for release.

### Signing a Release APK

1. Generate a keystore:
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias my-alias \
           -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `android/app/build.gradle`:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file("my-release-key.keystore")
               storePassword "password"
               keyAlias "my-alias"
               keyPassword "password"
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

> In practice, use EAS Build or a CI system for release signing — never commit passwords to git.

## 7. EAS Build (Cloud Builds)

For production releases, **EAS Build** handles everything in the cloud:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure builds
eas build:configure

# Build for Android
eas build --platform android --profile production
```

### Benefits of EAS Build

- **No local setup** — don't need JDK or Android Studio on your machine
- **Signing managed** — EAS handles keystore generation and signing
- **CI/CD ready** — can be triggered from GitHub Actions
- **Build profiles** — configure debug, preview, and production profiles separately

### eas.json Example

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

| Profile | Type | Use |
|---------|------|-----|
| `development` | Dev client | Testing native features |
| `preview` | APK | Sharing with testers |
| `production` | AAB | Play Store submission |

## 8. ProGuard / Code Optimization

In release builds, ProGuard (Android's code optimizer) can cause issues with React Native:

```gradle
# android/app/proguard-rules.pro
-keep class com.facebook.react.** { *; }
-keep class expo.modules.** { *; }
```

If you encounter weird crashes in release builds (but not debug builds), ProGuard is likely removing something React Native needs.

## 9. The Complete Workflow

### Development
```
bun install          → Install dependencies
bun start            → Start dev server
bun run android      → Open in Expo Go (hot reload)
```

### Testing Native Features
```
npx expo prebuild                  → Generate native project
npx expo run:android               → Build and install dev build
```

### Production Build
```
Option A: Local
  npx expo prebuild --clean
  cd android && ./gradlew assembleRelease
  jarsigner / sign with zipalign

Option B: EAS Build
  eas build --platform android --profile production
```

## Practice

1. What's the difference between `bun run android` and `npx expo run:android`?
2. Why shouldn't you edit files in the `android/` directory directly?
3. What does `npx expo prebuild --clean` do?

**Answers**:
1. `bun run android` → `expo start --android` — runs the JS bundle in Expo Go (no native compilation). `npx expo run:android` — compiles native code, installs a standalone APK with dev client
2. Because CNG regenerates `android/` from `app.json`. Direct edits will be lost on the next `prebuild`. Instead, use config plugins
3. Deletes the existing `android/` directory, then regenerates it fresh. Use this when you have conflicting or stale native files

## You've Completed the Tutorial Series!

You now understand:

- **React** — components, JSX, state, effects, callbacks, context
- **React Native** — View, Text, Pressable, FlatList, StyleSheet, Flexbox
- **Expo** — project structure, configuration, Metro bundler, platform-specific code
- **Expo Router** — file-based routing, Stack, Tabs, dynamic routes, layouts
- **SQLite** — local database, schema design, CRUD, JOINs, GROUP BY
- **Custom Hooks** — encapsulating data logic, useCallback patterns
- **i18n** — localization, context, translation files
- **Theming** — light/dark mode, design tokens, platform-specific values
- **Production** — prebuild, Android Studio, APK generation, EAS Build

The Habit Tracker you've built is a complete, functional app. You can extend it with new features — notifications, streaks, widgets — using the same patterns you've learned.
