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
| `EXPO_PUBLIC_API_BASE_URL` | Backend API base URL |
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
npm run build:android
# or equivalently:
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

## 7. Submitting to Google Play (EAS Submit)

### Create a Google Play Service Account Key

1. Open the [Google Play Console](https://play.google.com/console/).
2. Navigate to **Setup → API access**.
3. Link your Google Play account to a Google Cloud project (create one if needed).
4. Click **Create new service account**, then follow the link to Google Cloud Console.
5. In Google Cloud Console: **IAM & Admin → Service Accounts → Create Service Account**.
   - Give it a name like `eas-submit`.
   - Grant the role **Service Account User**.
6. Under the service account, go to **Keys → Add Key → Create new key → JSON**.
   - Download the JSON file — this is your `service-account-key.json`.
   - **Never commit this file to version control.**
7. Back in Google Play Console, grant the new service account the **Release Manager** role
   (or at minimum **Release to production, exclude devices, and use Play App Signing**).

### Configure `eas.json`

In `apps/mobile/eas.json`, update the `submit.production.android` section with the path
to your downloaded service account key:

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "../path/to/service-account-key.json",
      "track": "internal"
    }
  }
}
```

> `track` can be `"internal"`, `"alpha"`, `"beta"`, or `"production"`.
> Start with `"internal"` for the initial launch.

### Submit the production build

```bash
npm run submit:android
# or equivalently:
eas submit --platform android
```

EAS Submit will use the latest successful production build by default.

---

## 8. Android permissions

The following permissions are declared in `app.json` and will be included in the
`AndroidManifest.xml` automatically by Expo:

| Permission | Purpose |
|---|---|
| `CAMERA` | Capture proof-of-work photos |
| `READ_EXTERNAL_STORAGE` | Select photos from gallery (Android ≤ 12) |
| `WRITE_EXTERNAL_STORAGE` | Save downloaded files (Android ≤ 12) |
| `READ_MEDIA_IMAGES` | Select photos from gallery (Android 13+) |
| `READ_MEDIA_VIDEO` | Select videos from gallery (Android 13+) |
| `ACCESS_FINE_LOCATION` | Precise GPS for check-in |
| `ACCESS_COARSE_LOCATION` | Fallback location for map |
| `RECEIVE_BOOT_COMPLETED` | Restore scheduled notifications on reboot |
| `VIBRATE` | Notification haptic feedback |
| `INTERNET` | Network requests to the backend API |

---

## 9. Notification channels

Two notification channels are created at runtime (see `src/services/notifications.ts`):

| Channel ID | Name | Importance | Purpose |
|---|---|---|---|
| `trampohero-default` | TrampoHero | HIGH | General alerts, messages |
| `trampohero-jobs` | Novas Vagas | DEFAULT | New job alerts |

---

## 10. Troubleshooting

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

---

## 11. Play Store asset requirements

Before submitting to the Google Play Store, prepare the following assets:

| Asset | Specification |
|---|---|
| App icon | 512×512 PNG, no alpha |
| Feature graphic | 1024×500 PNG or JPEG |
| Phone screenshots | At least 2 screenshots (min 320 px, max 3840 px on longest side) |
| Short description | Up to 80 characters |
| Full description | Up to 4000 characters |

Upload these in the Google Play Console under **Store listing**.

---

## 12. Launch checklist

Before submitting to the Google Play Store, verify all of the following:

- [ ] `google-services.json` downloaded from Firebase and placed at `apps/mobile/google-services.json`
- [ ] EAS Project ID filled in `app.json` (`extra.eas.projectId`)
- [ ] Service Account Key created and path set in `eas.json` (`submit.production.android.serviceAccountKeyPath`)
- [ ] Play Store assets ready: 512×512 icon, 1024×500 feature graphic, ≥2 phone screenshots
- [ ] `version` and `versionCode` correct in `app.json` (start with `"1.0.0"` / `1`)
- [ ] Production AAB generated: `npm run build:android`
- [ ] App submitted to internal track: `npm run submit:android`
