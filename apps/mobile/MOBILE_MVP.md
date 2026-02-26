# 📱 TrampoHero Mobile MVP

React Native (Expo) app targeting **iOS** and **Android**, connecting to the TrampoHero backend API.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Environment setup](#environment-setup)
4. [Running locally](#running-locally)
   - [iOS simulator](#ios-simulator)
   - [Android emulator](#android-emulator)
5. [EAS Build (physical devices)](#eas-build-physical-devices)
   - [iOS – APNs setup](#ios--apns-setup)
6. [Project structure](#project-structure)
7. [Manual test steps](#manual-test-steps)

---

## Architecture

```
apps/mobile/
├── App.tsx                        ← entry point
├── app.json                       ← Expo config (bundle IDs, permissions)
├── eas.json                       ← EAS Build profiles
├── src/
│   ├── config/
│   │   ├── api.ts                 ← shared HTTP client (EXPO_PUBLIC_API_BASE_URL)
│   │   └── auth.ts                ← JWT + user profile in SecureStore
│   ├── navigation/
│   │   └── AppNavigator.tsx       ← Stack (Login) + Tab (Home / Jobs / Profile)
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── HomeScreen.tsx
│       ├── JobsScreen.tsx
│       └── ProfileScreen.tsx
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Expo CLI | `npm install -g expo-cli` |
| EAS CLI | `npm install -g eas-cli` (for physical-device builds) |
| Xcode | ≥ 15 (macOS only, for iOS simulator) |
| Android Studio | Latest (for Android emulator) |

---

## Environment setup

```bash
cd apps/mobile
cp .env.example .env
# Edit .env – set EXPO_PUBLIC_API_BASE_URL to your backend URL
```

For local development, the backend runs on `http://localhost:5000/api` by default.  
On a physical device, replace `localhost` with your machine's LAN IP (e.g. `http://192.168.1.10:5000/api`).

---

## Running locally

```bash
cd apps/mobile
npm install
npm start          # opens Expo Dev Tools in browser
```

### iOS simulator

Requires macOS with Xcode installed.

```bash
npm run ios
# or press 'i' in the Expo Dev Tools terminal
```

The app launches in the iOS Simulator using the bundle identifier `com.trampohero.app`.

### Android emulator

```bash
npm run android
# or press 'a' in the Expo Dev Tools terminal
```

---

## EAS Build (physical devices)

[EAS Build](https://docs.expo.dev/build/introduction/) creates native binaries without needing a local Mac.

```bash
# 1. Log in to your Expo account
eas login

# 2. Link the project (first time only)
eas build:configure

# 3. iOS simulator build (no Apple account needed)
npm run build:ios:sim

# 4. iOS preview build (requires Apple Developer account)
npm run build:ios:preview

# 5. Android APK preview
npm run build:android:preview
```

Update `eas.json` with your `appleId`, `ascAppId`, and `appleTeamId` before submitting to the App Store.

### iOS – APNs setup

Apple Push Notification service (APNs) is required for push notifications on iOS.

1. Log in to [Apple Developer Console](https://developer.apple.com).
2. Navigate to **Certificates, Identifiers & Profiles** → **Keys**.
3. Create an **APNs key** (`.p8` file) – download and keep it safe.
4. Register the key with EAS:

```bash
eas credentials --platform ios
# Select "Add a new APNs key"
```

5. Set these placeholders in EAS project secrets (never commit them):

| Secret | Description |
|--------|-------------|
| `APNS_KEY_P8` | Contents of the `.p8` APNs key file |
| `APNS_KEY_ID` | Key ID from Apple Developer Console |
| `APNS_TEAM_ID` | Apple Developer Team ID |

The app's `app.json` already includes the `NSUserNotificationsUsageDescription` permission string required by Apple review.

---

## Project structure

```
apps/mobile/
├── .env.example          ← copy to .env, set EXPO_PUBLIC_API_BASE_URL
├── app.json              ← Expo / iOS / Android config
├── eas.json              ← EAS Build profiles (dev / preview / production)
├── package.json
├── tsconfig.json
├── App.tsx               ← root component
└── src/
    ├── config/
    │   ├── api.ts        ← fetch wrapper (reads EXPO_PUBLIC_API_BASE_URL)
    │   └── auth.ts       ← SecureStore helpers (save/get/clear token + user)
    ├── navigation/
    │   └── AppNavigator.tsx
    └── screens/
        ├── LoginScreen.tsx
        ├── HomeScreen.tsx
        ├── JobsScreen.tsx
        └── ProfileScreen.tsx
```

---

## Manual test steps

### 1. Login flow

1. Start the backend (`cd backend && npm run dev`).
2. Start the mobile app (`cd apps/mobile && npm start`).
3. Open in the iOS simulator or Android emulator.
4. Enter a valid email / password from the seeded data.
5. ✅ Expect: you are navigated to the Home tab.

### 2. Jobs list

1. After logging in, tap the **Jobs** tab.
2. ✅ Expect: a list of available jobs loads from the API.

### 3. Profile & logout

1. Tap the **Profile** tab.
2. ✅ Expect: your name, email, and role are displayed.
3. Tap **Sair** (Logout) and confirm.
4. ✅ Expect: you are returned to the Login screen.

### 4. iOS simulator – camera permission (smoke test)

1. Open the app in the iOS simulator.
2. Trigger any camera-dependent action (e.g. photo proof upload).
3. ✅ Expect: iOS shows the `NSCameraUsageDescription` permission dialog.

### 5. iOS build via EAS

```bash
cd apps/mobile
eas build --platform ios --profile development
```

✅ Expect: build succeeds and outputs a `.app` file installable in the simulator.
