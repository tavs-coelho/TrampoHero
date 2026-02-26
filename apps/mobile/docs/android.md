# TrampoHero Mobile MVP – Android Setup

This document covers everything you need to get the TrampoHero mobile app
running on an Android emulator or physical device, and how to build a
distributable APK/AAB using EAS.

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 18 LTS |
| npm | 9 |
| Expo CLI | `npm i -g expo-cli` |
| EAS CLI | `npm i -g eas-cli` |
| Android Studio | Hedgehog (2023.1) or later |
| JDK | 17 |

---

## 1. Clone and install

```bash
# From the repo root
cd apps/mobile
npm install
```

---

## 2. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API base URL |
| `EXPO_PUBLIC_ANH_CONNECTION_STRING` | Azure Notification Hubs connection string |
| `EXPO_PUBLIC_ANH_HUB_NAME` | Azure Notification Hubs name |
| `EXPO_PUBLIC_WEB_PUBSUB_URL` | Azure Web PubSub WebSocket URL |

---

## 3. FCM (Firebase Cloud Messaging) setup

Push notifications on Android require a Firebase project.

1. Go to [Firebase Console](https://console.firebase.google.com/) and create
   a project (or use an existing one).
2. Add an **Android app** with package name `com.trampohero.app`.
3. Download `google-services.json` and place it at `apps/mobile/google-services.json`.
   > ⚠️ **Never commit `google-services.json` to version control.** Add it to `.gitignore`.
4. Link your FCM server key to **Azure Notification Hubs**:
   - Azure Portal → Notification Hubs → your hub → **Google (FCM / FCM v1)**
   - Paste the Firebase server key or upload the service account JSON.

---

## 4. Running on Android emulator

```bash
# Start the Expo development server
npm run start

# Or launch directly on Android
npm run android
```

> Make sure an Android emulator is running in Android Studio (AVD Manager),
> or connect a physical device with **USB debugging** enabled.

---

## 5. Running on a physical Android device

1. Enable **Developer Options** on your device (tap *Build number* 7 times).
2. Enable **USB Debugging**.
3. Connect via USB and run:

```bash
npm run android
```

For wireless debugging (Android 11+):

```bash
adb connect <device-ip>:5555
npm run android
```

---

## 6. Building with EAS

### Configure EAS

```bash
eas init          # creates an EAS project and updates app.json
eas build:configure
```

### Development build (debug APK)

```bash
eas build --platform android --profile development
```

### Preview build (internal distribution)

```bash
eas build --platform android --profile preview
```

### Production build (Play Store AAB)

```bash
eas build --platform android --profile production
```

The `eas.json` build profiles should follow this structure:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
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

---

## 7. Android permissions

The following permissions are declared in `app.json` and will be included in the
`AndroidManifest.xml` automatically by Expo:

| Permission | Purpose |
|---|---|
| `CAMERA` | Capture proof-of-work photos |
| `READ_EXTERNAL_STORAGE` | Select photos from gallery |
| `WRITE_EXTERNAL_STORAGE` | Save downloaded files |
| `ACCESS_FINE_LOCATION` | Precise GPS for check-in |
| `ACCESS_COARSE_LOCATION` | Fallback location for map |
| `RECEIVE_BOOT_COMPLETED` | Restore scheduled notifications on reboot |
| `VIBRATE` | Notification haptic feedback |

---

## 8. Notification channels

Two notification channels are created at runtime (see `src/services/notifications.ts`):

| Channel ID | Name | Importance | Purpose |
|---|---|---|---|
| `trampohero-default` | TrampoHero | HIGH | General alerts, messages |
| `trampohero-jobs` | Novas Vagas | DEFAULT | New job alerts |

---

## 9. Troubleshooting

### Metro bundler cache

```bash
npm run start -- --clear
```

### Gradle build errors

```bash
cd android && ./gradlew clean && cd ..
npm run android
```

### `google-services.json` not found

Ensure the file exists at `apps/mobile/google-services.json` (see step 3 above).

### Location permission denied in emulator

In the AVD emulator: **⋮ → Location** and enable the virtual GPS.
Set a custom location by entering latitude/longitude values in the
**Extended Controls → Location** panel, then click **Set Location**.
