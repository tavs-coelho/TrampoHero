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
| `NSPhotoLibraryAddUsageDescription` | Save photos to the photo library |
| `NSMicrophoneUsageDescription` | Record video with audio |
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

---

## 10. App Store submission via EAS Submit

### Prerequisites
- Active Apple Developer Program membership ($99/year)
- App created in [App Store Connect](https://appstoreconnect.apple.com/)
- EAS project configured (`extra.eas.projectId` in `app.json`)

### Steps

1. **Create the app in App Store Connect**
   - Log in to [App Store Connect](https://appstoreconnect.apple.com/)
   - Go to *My Apps → +* and create a new app
   - Bundle ID: `com.trampohero.app`
   - Note the **Apple ID** (numeric, shown in the app URL) → this is `ascAppId` in `eas.json`

2. **Configure `eas.json`** with your Apple credentials:
   ```json
   "submit": {
     "production": {
       "ios": {
         "appleId": "your@email.com",
         "ascAppId": "1234567890",
         "appleTeamId": "ABCDE12345",
         "language": "pt-BR"
       }
     }
   }
   ```
   > ⚠️ Do not commit real credentials. Use environment variables or EAS Secrets instead.

3. **Generate a production build:**
   ```bash
   npm run build:ios
   # or: eas build --platform ios --profile production
   ```

4. **Submit to App Store Connect:**
   ```bash
   npm run submit:ios
   # or: eas submit --platform ios --profile production
   ```

5. **Complete the submission in App Store Connect:**
   - Fill in app metadata (description, keywords, support URL)
   - Add screenshots (see requirements below)
   - Set pricing and availability
   - Submit for App Store Review

### App Store asset requirements

| Asset | Size | Notes |
|---|---|---|
| App icon | 1024×1024 px | PNG, no transparency, no rounded corners |
| iPhone screenshots | 1290×2796 px (6.7") | Minimum 3 screenshots required |
| iPad screenshots | 2048×2732 px | Required since app supports tablet (`supportsTablet: true`) |

### Using EAS Secrets (recommended for CI/CD)

Instead of storing credentials in `eas.json`, use EAS Secrets:
```bash
eas secret:create --scope project --name EXPO_APPLE_ID --value your@email.com
eas secret:create --scope project --name EXPO_ASC_APP_ID --value 1234567890
```

---

## 11. TestFlight distribution

TestFlight is Apple's beta testing platform. Use the `preview` profile to distribute builds to internal testers before the App Store launch.

### Internal testers (no review required)

```bash
eas build --platform ios --profile preview
eas submit --platform ios --profile preview
```

Builds submitted to TestFlight are available to internal testers within minutes.

### External testers (requires beta review)

To add external testers (up to 10,000), submit for Beta App Review in App Store Connect.
External review typically takes 1–2 business days.

---

## 12. iOS launch checklist

- [ ] Apple Developer account active (com.trampohero.app App ID registered)
- [ ] Push Notifications capability enabled for App ID in Apple Developer Portal
- [ ] APNs Auth Key (`.p8`) created, Key ID and Team ID noted
- [ ] APNs key linked to Azure Notification Hubs
- [ ] `app.json` → `extra.eas.projectId` filled with real EAS Project ID
- [ ] `eas.json` → `submit.production.ios` filled with real `appleId`, `ascAppId`, `appleTeamId`
- [ ] App created in App Store Connect with bundle ID `com.trampohero.app`
- [ ] `config.usesNonExemptEncryption: false` set in `app.json` ios section
- [ ] App icon 1024×1024 PNG created and placed at `apps/mobile/assets/icon.png`
- [ ] Splash screen created and placed at `apps/mobile/assets/splash.png`
- [ ] iPhone screenshots (1290×2796 px, min. 3) ready
- [ ] iPad screenshots (2048×2732 px) ready (app supports tablet)
- [ ] App metadata (name, description, keywords, support URL) written in pt-BR
- [ ] Privacy Policy URL available (required by App Store)
- [ ] `buildNumber: "1"` set in `app.json` for initial launch
- [ ] Production build generated: `npm run build:ios`
- [ ] Build validated (no crashes on real device / TestFlight)
- [ ] Submitted to App Store Review: `npm run submit:ios`
