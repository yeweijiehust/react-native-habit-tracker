# 00: Prerequisites & Environment Setup

Before you can build a React Native app with Expo, you need to set up your development environment. This tutorial walks you through everything you need to install.

## What You'll Learn

- What tools are required and why
- How to install each tool
- How to verify everything works

## Prerequisites

None. This is the starting point.

---

## 1. The Toolchain Overview

Building a React Native app requires several tools working together:

| Tool | Role |
|------|------|
| **Node.js** | JavaScript runtime — runs the dev server, build tools, and package manager |
| **bun** | Package manager and runtime — installs dependencies, runs scripts (faster than npm) |
| **JDK 17** | Java Development Kit — compiles the Android native code |
| **Android Studio** | IDE for Android — provides the Android SDK, emulator, and build tools |
| **Expo CLI** | Command-line tool for creating, developing, and building Expo apps |

## 2. Install Node.js

Expo SDK 56 requires **Node.js 22.13+**.

### Windows

Download the LTS installer from [nodejs.org](https://nodejs.org/) and run it. Verify:

```powershell
node --version   # Should be v22.13.x or higher
npm --version    # Should come bundled with Node
```

### macOS

Using Homebrew:

```bash
brew install node@22
```

## 3. Install bun

This project uses **bun** as its package manager. Bun is faster than npm/yarn for installing packages and running scripts.

### Windows / macOS / Linux

```bash
powershell -c "irm bun.sh/install.ps1 | iex"   # Windows
curl -fsSL https://bun.sh/install | bash        # macOS/Linux
```

Verify:

```bash
bun --version   # Should show v1.3.x or higher
```

> **Why bun?** Bun is a drop-in replacement for Node.js that installs dependencies ~10x faster. Our project uses it because it's configured in `bun.lock` (the lockfile format bun uses).

## 4. Install JDK 17

Android builds require **JDK 17**. Other versions (11, 21) will cause build failures.

### Windows

```powershell
# Using Chocolatey (recommended)
choco install microsoft-openjdk17

# Or download from https://learn.microsoft.com/java/openjdk/download
```

### macOS

```bash
brew install --cask zulu@17
```

Add to your shell config (`~/.zshrc`):

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
```

### Verify

```bash
java -version
# Should show: openjdk version "17.x.x"
```

## 5. Install Android Studio

### Download

Download from [developer.android.com/studio](https://developer.android.com/studio).

### Setup Wizard

1. Launch Android Studio
2. On first launch, the **Setup Wizard** appears — choose **Standard** install type
3. The wizard installs the latest Android SDK and tools

### Install Android SDK Platform 36

Expo SDK 56 requires **Android 16 (Baklava)** SDK Platform 36.

1. Open Android Studio → **Settings** (Windows) / **Preferences** (macOS)
2. Go to **Languages & Frameworks** → **Android SDK**
3. On the **SDK Platforms** tab, check **Android 16 (Baklava)** → **Android SDK Platform 36**
4. On the **SDK Tools** tab, ensure **Android SDK Build-Tools** and **Android Emulator** are installed
5. Click **Apply**

### Set ANDROID_HOME

#### Windows

1. Open **Control Panel** → **User Accounts** → **Change my environment variables**
2. Add a new **User variable**:
   - Name: `ANDROID_HOME`
   - Value: `%LOCALAPPDATA%\Android\Sdk`
3. Edit the **Path** variable → **New** → add `%LOCALAPPDATA%\Android\Sdk\platform-tools`

Verify in PowerShell:

```powershell
echo $env:ANDROID_HOME
adb --version
```

#### macOS

Add to `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Reload and verify:

```bash
source ~/.zshrc
echo $ANDROID_HOME
adb --version
```

## 6. Set Up an Android Emulator

1. Open Android Studio → **More Actions** → **Virtual Device Manager**
2. Click **Create virtual device**
3. Choose a device (Pixel is a good default)
4. Select a system image (API 36)
5. Click **Finish**

You can launch the emulator anytime from the **Device Manager**.

## 7. Clone and Run the Project

Now that everything is installed:

```bash
# Clone the repository (if you haven't already)
git clone <repo-url>
cd rn-demo

# Install dependencies
bun install

# Start the dev server and open on Android
bun start
# Then press 'a' in the terminal
# OR
bun run android
```

If you see the Habit Tracker app on your emulator/device, everything is working.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `adb: command not found` | Add `platform-tools` to your PATH (see Step 5) |
| `java: command not found` | Install JDK 17 and set `JAVA_HOME` |
| `sdk.dir` or `ANDROID_HOME` not set | Set `ANDROID_HOME` environment variable |
| Gradle build fails | Run `npx expo prebuild --clean` to regenerate native files |
| `bun: command not found` | Install bun (see Step 3) |

## Next Tutorial

Now that your environment is ready, proceed to **Tutorial 01: Introduction to Expo** where we'll explore what Expo is and dissect the project structure.
