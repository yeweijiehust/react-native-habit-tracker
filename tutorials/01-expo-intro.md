# 01: Introduction to Expo

Now that your development environment is ready, let's understand what Expo is and how our project is structured.

## Prerequisites

- Tutorial 00: Environment Setup (Node.js, bun, JDK, Android Studio)
- Basic understanding of what a mobile app is

## What You'll Learn

- What Expo is and why it exists
- The difference between Expo and plain React Native
- How our project is organized
- The key configuration files and what they do

---

## 1. What is Expo?

**Expo** is a framework built on top of React Native that makes mobile development dramatically simpler. Think of it as "React Native, but with batteries included."

### Without Expo (Plain React Native)

If you build with plain React Native, you need to:

- Manually install and configure native modules (camera, maps, etc.)
- Open Xcode (for iOS) and Android Studio separately to build
- Handle linking between JavaScript and native code yourself
- Manage a dozen configuration files across android/ and ios/ directories

### With Expo

Expo handles all of that for you:

- **expo-sqlite**, **expo-camera**, **expo-localization**, etc. — all work out of the box with `bun expo install`
- **Expo Go** — a sandbox app that lets you run your app on a real device without ever opening Android Studio
- **EAS Build** — cloud-based builds that generate APK/IPA files without you installing any native tools
- **expo-router** — file-based routing (like Next.js for mobile)

### SDK 56

Our project uses **Expo SDK 56**, which corresponds to:

| Expo SDK | React Native | React | Android | iOS |
|----------|-------------|-------|---------|-----|
| 56 | 0.85.3 | 19.2.3 | API 36+ | iOS 16.4+ |

## 2. Project Structure

Let's look at the project root:

```
rn-demo/
├── src/                    # All source code
│   ├── app/                # Expo Router pages (routes)
│   │   ├── _layout.tsx     # Root layout — wraps all screens
│   │   ├── (tabs)/         # Tab navigator group
│   │   │   ├── _layout.tsx # Tab bar configuration
│   │   │   ├── index.tsx   # Home screen (habit list)
│   │   │   └── settings.tsx
│   │   └── habit/          # Nested routes
│   │       ├── new.tsx     # Add habit modal
│   │       └── [id].tsx    # Habit detail dynamic route
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React Context providers (DB, i18n)
│   ├── hooks/              # Custom hooks (data access, theme)
│   ├── constants/          # Theme colors, spacing, fonts
│   ├── locales/            # Translation files (en, zh)
│   ├── db/                 # Database schema
│   └── lib/                # Utility functions
├── assets/                 # Images, fonts, icons
├── app.json                # Expo configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── metro.config.js         # Metro bundler customization
└── expo-env.d.ts           # Auto-generated Expo type definitions
```

**Key insight**: Every file in `src/app/` automatically becomes a URL route. This is Expo Router's file-based routing system, and it's the backbone of navigation in our app.

## 3. Understanding the Config Files

### app.json — The Expo Manifest

```json
{
  "expo": {
    "name": "rn-demo",
    "slug": "rn-demo",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "rndemo",
    "userInterfaceStyle": "automatic",
    "plugins": ["expo-router", "expo-splash-screen"],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
```

- **`orientation: "portrait"`** — Locks the app to portrait mode
- **`userInterfaceStyle: "automatic"`** — Enables light/dark mode detection
- **`scheme: "rndemo"`** — Enables deep linking (e.g., `rndemo://habit/1`)
- **`plugins`** — Config plugins that modify native code during prebuild
- **`experiments.typedRoutes: true`** — Generates TypeScript types for all routes, making `router.push()` type-safe
- **`experiments.reactCompiler: true`** — Enables the new React Compiler (automatic memoization)

### package.json

```json
{
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "web": "expo start --web"
  }
}
```

- **`"main": "expo-router/entry"`** — Instead of a typical `index.js` entry point, Expo Router handles all routing and screen registration automatically
- **`bun start`** runs `expo start` — starts the Metro bundler dev server
- **`bun run android`** runs `expo start --android` — starts the server and automatically opens the app on a connected Android device/emulator

### tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- Extends Expo's base TypeScript config
- **`strict: true`** — Enables all strict type-checking options
- **`@/*` → `./src/*`** — Path alias so you can write `import { useHabits } from '@/hooks/use-habits'` instead of relative paths like `../../../hooks/use-habits`

## 4. The Dependency Stack

Looking at `package.json`, these are the key dependencies our app uses:

| Category | Package | Purpose |
|----------|---------|---------|
| **Core** | `expo`, `react`, `react-native` | The foundation |
| **Routing** | `expo-router`, `react-native-screens` | Navigation |
| **Storage** | `expo-sqlite` | SQLite database |
| **i18n** | `expo-localization` | Device locale detection |
| **Icons** | `expo-symbols` | System icons (SF Symbols / Material) |
| **Animation** | `react-native-reanimated` | High-performance animations |
| **Layout** | `react-native-safe-area-context` | Notch/status bar handling |
| **Web** | `react-native-web`, `react-dom` | Web target support |

## 5. How Expo Run on a Device

Here's what happens when you run `bun start` and press `a`:

```
┌─────────────────────────────────────────────────┐
│              Your Development Machine            │
│                                                  │
│  bun start                                       │
│       │                                          │
│       ▼                                          │
│  Metro Bundler (Dev Server @ localhost:8081)     │
│       │                                          │
│       │  Serves JavaScript bundle over HTTP       │
│       │                                          │
│       ▼                                          │
│  Expo Go (on Android emulator)                   │
│   - Downloads JS bundle from Metro               │
│   - Runs it in the Expo Go sandbox                │
│   - Provides Fast Refresh on file changes         │
│   - No native compilation needed!                 │
└─────────────────────────────────────────────────┘
```

With Expo Go, you don't need Android Studio running — the JS bundle is served live over your network and executed inside the Expo Go sandbox app.

## 6. The Metro Bundler

Metro is the JavaScript bundler for React Native (like Webpack is for web apps). It:

1. **Resolves modules** — figures out what `import '@/hooks/use-habits'` means
2. **Transforms code** — converts JSX and TypeScript to plain JavaScript
3. **Bundles** — packages everything into a single JS bundle
4. **Serves** — provides the bundle to the device via HTTP

Our `metro.config.js` customizes it:

```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('wasm');
module.exports = config;
```

This adds `.wasm` (WebAssembly) to the list of file types Metro treats as assets. This is needed because `expo-sqlite` uses a WASM-based SQLite implementation on the web platform.

> **What is WASM?** WebAssembly is a binary instruction format that runs in web browsers. `expo-sqlite` bundles a WebAssembly-compiled version of SQLite to run on the web target, since native SQLite isn't available in browsers.

## Next Tutorial

Proceed to **Tutorial 02: React Foundations** — understanding components, JSX, state, and hooks.
