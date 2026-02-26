# TrampoHero Mobile MVP – iOS Setup

This document covers everything you need to get the TrampoHero mobile app
running on an iOS simulator or physical device, and how to build a
distributable IPA using EAS.

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 18 LTS |
| npm | 9 |
| Expo CLI | `npm i -g expo-cli` |
| EAS CLI | `npm i -g eas-cli` |
| macOS | Ventura (13) or later |
| Xcode | 15 or later |
| CocoaPods | 1.13 or later |

> ⚠️ Building for iOS requires a Mac with Xcode installed.
> You can still run the app locally using `expo start` and the **Expo Go** app on a
> physical iPhone, without Xcode, as long as you are on the same Wi-Fi network.

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

## 3. APNs (Apple Push Notification service) setup

Push notifications on iOS require an Apple Developer account and APNs certificate.

1. Sign in to the [Apple Developer Portal](https://developer.apple.com/account/).
2. Create an **App ID** with the bundle identifier `com.trampohero.app` and enable
   the **Push Notifications** capability.
3. Generate an **APNs Auth Key** (`.p8`) under
   *Certificates, Identifiers & Profiles → Keys* (recommended over certificates).
4. Download the key and note the **Key ID** and **Team ID**.
5. Link the key to **Azure Notification Hubs**:
   - Azure Portal → Notification Hubs → your hub → **Apple (APNS)**
   - Upload the `.p8` key and enter the Key ID, Team ID, and bundle ID.
   > ⚠️ **Never commit the `.p8` key to version control.**

---

## 4. Running on the iOS simulator

```bash
# Start the Expo development server
npm run start

# Or launch directly on the iOS simulator
npm run ios
```

> Make sure Xcode and the iOS Simulator are installed.
> The first run may take a few minutes while Expo builds the native app.

---

## 5. Running on a physical iOS device

### Option A – Expo Go (no Apple account required)

1. Install **Expo Go** from the App Store on your iPhone.
2. Run `npm run start` in `apps/mobile`.
3. Scan the QR code displayed in the terminal with the iPhone camera.

### Option B – Development build (recommended for full native features)

1. Connect your iPhone via USB (or wireless pairing in Xcode 14+).
2. Trust the computer on the device when prompted.
3. Build and install via EAS:

```bash
eas build --platform ios --profile development
eas device:create  # register your device UDID if first time
```

Then install the resulting IPA using EAS or TestFlight.

---

## 6. Building with EAS

### Configure EAS

```bash
eas init          # creates an EAS project and updates app.json
eas build:configure
```

### Development build (simulator)

```bash
eas build --platform ios --profile development
```

### Preview build (internal TestFlight)

```bash
eas build --platform ios --profile preview
```

### Production build (App Store)

```bash
eas build --platform ios --profile production
```

The `eas.json` build profiles should follow this structure:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "ios": { "autoIncrement": "buildNumber" }
    }
  }
}
```

---

## 7. iOS permissions

The following usage descriptions are declared in `app.json` under
`expo.ios.infoPlist` and will be included in `Info.plist` automatically:

| Key | Purpose |
|---|---|
| `NSCameraUsageDescription` | Capture proof-of-work photos |
| `NSPhotoLibraryUsageDescription` | Select photos from the gallery |
| `NSLocationWhenInUseUsageDescription` | GPS position for job check-in |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | Background location (optional) |

---

## 8. Background modes

The following background modes are enabled in `app.json` under
`expo.ios.infoPlist.UIBackgroundModes`:

| Mode | Purpose |
|---|---|
| `remote-notification` | Receive silent push notifications in the background |
| `fetch` | Periodic background data refresh |

---

## 9. Troubleshooting

### Metro bundler cache

```bash
npm run start -- --clear
```

### CocoaPods install fails

```bash
cd ios && pod install && cd ..
```

If that fails, try:

```bash
cd ios && pod repo update && pod install && cd ..
```

### Simulator does not show location

In the iOS Simulator menu: **Features → Location → Custom Location…**
Enter latitude/longitude values matching a job in the database.

### Push notifications not received on simulator

APNs does not work on the iOS Simulator. Test push notifications on a
physical device registered via `eas device:create`.
