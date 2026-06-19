# Habit Tracker

A React Native (Expo) learning project — Habit Tracker app.

## Features

- Habit list with today's check-in status (unchecked first)
- Add habits with name & emoji
- Tap to toggle daily check-in
- Detail page with check-in statistics bar chart
- Settings page with Chinese/English language switch
- Local data persistence via SQLite

## Tech Stack

- **Framework**: Expo SDK 56 + Expo Router (file-based routing)
- **Storage**: expo-sqlite
- **i18n**: expo-localization + custom React Context
- **Target Platform**: Android (primary)

## Getting Started

```bash
bun install
bun start           # Start Expo dev server
```

Press `a` in the terminal to open on a connected Android device/emulator, or run:

```bash
bun run android     # equivalent: expo start --android
```

## Android Studio Integration

### 1. Prerequisites

- JDK 17 (recommended: `microsoft-openjdk17` on Windows, `zulu@17` on macOS)
- Android Studio with **Android 16 (Baklava) SDK Platform 36** installed
- `ANDROID_HOME` environment variable set
  - Windows default: `%LOCALAPPDATA%\Android\Sdk`
  - macOS default: `~/Library/Android/sdk`

### 2. Generate native project

This project uses **Continuous Native Generation (CNG)** — no `android/` directory by default. Generate it when needed:

```bash
npx expo prebuild --platform android
```

This creates `android/` with the full native Android project.

### 3. Open in Android Studio

- Launch Android Studio → **Open an existing project** → select the `android/` directory
- Wait for Gradle sync to complete
- Use Android Studio for:
  - Native debugging (breakpoints in Java/Kotlin code)
  - Device/emulator management
  - APK/AAB generation

### 4. Development build (faster feedback)

After prebuild, you can also build and run directly from CLI:

```bash
npx expo run:android
```

This compiles a development build and installs it on your device/emulator.

> **Note**: During development, prefer `bun start` + `bun run android` for hot-reload. Use Android Studio only when you need native debugging or to generate a production build.

### 5. Build APK / AAB

**Without EAS (via Android Studio):**
1. `npx expo prebuild --clean` (regenerate native project)
2. Open `android/` in Android Studio
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
4. APK will be at `android/app/build/outputs/apk/debug/` or `release/`

**With EAS Build (cloud):**
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

## Project Structure

```
src/
├── app/                 # Expo Router pages
│   ├── _layout.tsx      # Root layout (Stack + providers)
│   ├── (tabs)/          # Tab layout
│   ├── habit/new.tsx    # Add habit (modal)
│   └── habit/[id].tsx   # Detail page
├── contexts/            # React Contexts (database, i18n)
├── hooks/               # Custom hooks (use-habits, use-check-ins)
├── components/          # Reusable UI
├── locales/             # Translation files (en, zh)
├── db/                  # SQLite schema
└── lib/                 # Utilities (date)
```

## Configuration

**`metro.config.js`** — adds `.wasm` support for expo-sqlite web compatibility.

## Troubleshooting

- **Clear Metro cache**: `bun start --clear`
- **Regenerate native project**: `npx expo prebuild --clean`
- **Check JDK version**: `java -version` (must be 17)
- **Check ANDROID_HOME**: `echo %ANDROID_HOME%` (Windows) / `echo $ANDROID_HOME` (macOS/Linux)
