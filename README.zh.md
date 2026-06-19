# Habit Tracker — 习惯追踪

一个基于 React Native (Expo) 的练手项目 — 习惯追踪 App。

## 功能

- 首页习惯列表，未打卡的排在前面
- 新增习惯（名称 + Emoji）
- 点击打勾切换今日打卡状态
- 详情页查看打卡统计柱状图
- 设置页中英文切换
- 本地 SQLite 持久化存储

## 技术栈

- **框架**: Expo SDK 56 + Expo Router（基于文件的路由）
- **存储**: expo-sqlite
- **国际化**: expo-localization + 自定义 React Context
- **目标平台**: Android（主攻）

## 快速开始

```bash
bun install
bun start                 # 启动 Expo 开发服务器
```

在终端按 `a` 打开已连接的 Android 设备/模拟器，或者直接运行：

```bash
bun run android           # 等价于 expo start --android
```

## Android Studio 配合使用

### 1. 环境准备

- JDK 17（Windows 推荐 `microsoft-openjdk17`，macOS 推荐 `zulu@17`）
- Android Studio，安装 **Android 16 (Baklava) SDK Platform 36**
- 配置 `ANDROID_HOME` 环境变量
  - Windows 默认路径: `%LOCALAPPDATA%\Android\Sdk`
  - macOS 默认路径: `~/Library/Android/sdk`

### 2. 生成原生项目

本项目使用 **CNG（Continuous Native Generation，持续原生代码生成）**，默认不包含 `android/` 目录。需要时执行：

```bash
npx expo prebuild --platform android
```

这会在项目根目录生成 `android/` 原生 Android 工程。

### 3. 在 Android Studio 中打开

- 启动 Android Studio → **Open an existing project** → 选择 `android/` 目录
- 等待 Gradle 同步完成
- 在 Android Studio 中可以：
  - 原生调试（在 Java/Kotlin 代码中打断点）
  - 管理设备/模拟器
  - 生成 APK/AAB

### 4. 开发构建（热更新）

预构建完成后，也可以通过命令行编译并安装开发构建版本：

```bash
npx expo run:android
```

> **注意**：日常开发建议用 `bun start` + `bun run android` 获得热更新体验，仅在需要原生调试或生成发布包时使用 Android Studio。

### 5. 构建 APK / AAB

**不使用 EAS（通过 Android Studio）：**
1. `npx expo prebuild --clean`（重新生成原生工程）
2. 在 Android Studio 中打开 `android/` 目录
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
4. APK 生成在 `android/app/build/outputs/apk/debug/` 或 `release/`

**使用 EAS Build（云端构建）：**
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

## 项目结构

```
src/
├── app/                 # Expo Router 页面
│   ├── _layout.tsx      # 根布局（Stack + providers）
│   ├── (tabs)/          # Tab 布局
│   ├── habit/new.tsx    # 新增习惯（modal）
│   └── habit/[id].tsx   # 详情页
├── contexts/            # React Context（数据库、国际化）
├── hooks/               # 自定义 hooks
├── components/          # 可复用 UI 组件
├── locales/             # 翻译文件（英文、中文）
├── db/                  # SQLite 建表脚本
└── lib/                 # 工具函数（日期）
```

## 配置

**`metro.config.js`** — 添加了 `.wasm` 支持，解决 expo-sqlite 在 Web 端的兼容问题。

## 常见问题

- **清除 Metro 缓存**: `bun start --clear`
- **重新生成原生工程**: `npx expo prebuild --clean`
- **检查 JDK 版本**: `java -version`（必须是 17）
- **检查 ANDROID_HOME**: `echo %ANDROID_HOME%`（Windows）/ `echo $ANDROID_HOME`（macOS/Linux）
