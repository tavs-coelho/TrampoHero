# TrampoHero Mobile – Push Notification Setup & Testing

This document explains how push notification registration works, how to configure the required services, and how to test the feature on a real device or with an EAS build.

---

## How it works

1. When a user logs in or registers, **`AuthContext`** calls `registerForPushNotifications(userId, tags)`.
2. The function (in `src/services/notifications.ts`):
   - Checks that the app is running on a physical device (push is not available on emulators/simulators for APNs).
   - Requests notification permission from the OS.
   - Creates Android notification channels (`trampohero-default`, `trampohero-jobs`).
   - Obtains an **Expo push token** via `Notifications.getExpoPushTokenAsync()`.
   - Retrieves (or creates) a stable `installationId` stored in AsyncStorage.
3. The `installationId`, push token, platform (`apns`/`fcmv1`), and `tags` (`role:<role>`, `niche:<niche>`) are sent to the backend endpoint `POST /api/notifications/register`.
4. The backend route validates the payload and registers the device installation in **Azure Notification Hubs** via `backend/src/services/notificationHubs.js`.
5. ANH stores the installation and can target devices via tag expressions (e.g. `role:freelancer && niche:Gastronomia`).

See [docs/push-notification-hubs.md](/docs/push-notification-hubs.md) for the full Azure setup guide.

---

## Prerequisites

### Mobile
- Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in:
  ```
  EXPO_PUBLIC_API_BASE_URL=https://your-backend.example.com/api
  ```
- **Android**: Place your `google-services.json` at `apps/mobile/google-services.json` (never commit this file – it is already in `.gitignore`).
- **iOS**: No extra file needed for token retrieval via Expo; APNs configuration is handled through EAS and the Apple Developer Portal.

### Backend
- Copy `backend/.env.example` to `backend/.env` and fill in:
  ```
  ANH_CONNECTION_STRING=Endpoint=sb://...
  ANH_HUB_NAME=trampohero-notifications
  ```
  These are only required if you want the backend to relay pushes via Azure Notification Hubs. The endpoint `POST /api/users/push-device` stores the token regardless.

---

## Testing on a physical device

### Android (USB or Wi-Fi)

1. Enable **Developer Options** and **USB Debugging** on the device.
2. Install dependencies and start the dev server:
   ```bash
   cd apps/mobile
   npm install
   npm run start
   ```
3. Scan the QR code with the **Expo Go** app or the development build.
4. Log in (or register a new account). The app will immediately request notification permission.
5. Accept the permission prompt.
6. Open your backend logs and verify a successful `POST /api/notifications/register` call.

**Manual verification steps:**
- [ ] A permission dialog appears on first login/register.
- [ ] Accepting the dialog does not crash the app.
- [ ] The backend `POST /api/notifications/register` returns `{ "success": true }` (check network logs with `npx react-native log-android`).
- [ ] The device installation is visible in the Azure Notification Hubs portal under **Installations** (or confirmed via `GET /api/notifications/register/:installationId`).
- [ ] Denying the permission does not crash the app (token is `null`, registration is skipped gracefully).

### iOS (physical device only – APNs does not work on simulator)

1. Install the **Expo Go** app from the App Store.
2. Run `npm run start` and scan the QR code.
3. Log in or register.
4. Accept the notification permission dialog.
5. Verify registration in the backend as described above.

> **Note:** Full APNs support (background push, silent notifications) requires a development build, not Expo Go. See the EAS section below.

---

## Configuring push credentials for EAS Cloud Builds

EAS stores push credentials (FCM key and APNs key) on its servers so cloud builds can
inject them automatically. Run the following commands once and they will be reused
for every subsequent build.

### Android – FCM (`google-services.json`)

**Step 1 – Upload via EAS Credentials (recommended)**

```bash
cd apps/mobile
eas credentials --platform android
# Select: "Update credentials on Expo servers"
# Select: "Google Services JSON" → choose the local google-services.json file
```

EAS stores the file securely and injects it into every Android build whose profile has
`"credentialsSource": "remote"` (already set in `eas.json`).

**Step 2 – Or upload as an EAS Secret (alternative for CI/CD)**

```bash
eas secret:create \
  --scope project \
  --name GOOGLE_SERVICES_JSON \
  --type file \
  --value ./google-services.json
```

Then reference the secret in `eas.json`:

```json
"build": {
  "production": {
    "android": {
      "buildType": "app-bundle",
      "credentialsSource": "remote",
      "env": {
        "GOOGLE_SERVICES_JSON": "@GOOGLE_SERVICES_JSON"
      }
    }
  }
}
```

> The `credentialsSource: "remote"` approach via `eas credentials` is simpler and
> sufficient for most projects. Use the EAS Secrets approach only if you manage
> the file yourself through CI environment variables.

---

### iOS – APNs Auth Key (`.p8`)

**Step 1 – Upload via EAS Credentials**

```bash
cd apps/mobile
eas credentials --platform ios
# Select: "Update credentials on Expo servers"
# Select: "Push Notifications Key" → follow the prompts to:
#   - Enter the path to your .p8 file
#   - Enter the Key ID (10-character alphanumeric string from Apple Developer Portal)
#   - Enter the Apple Team ID (10-character string from Apple Developer Portal)
```

EAS stores the key and injects it into every iOS build whose profile has
`"credentialsSource": "remote"` (already set in `eas.json`).

**Step 2 – Or upload as EAS Secrets**

```bash
eas secret:create --scope project --name APNS_KEY_ID    --value "XXXXXXXXXX"
eas secret:create --scope project --name APPLE_TEAM_ID  --value "XXXXXXXXXX"
eas secret:create --scope project --name APNS_KEY_P8    --type file --value ./AuthKey_XXXXXXXXXX.p8
```

---

### Viewing and rotating credentials

```bash
# List all credentials for the project
eas credentials

# Delete a stored credential (e.g. to rotate a compromised key)
eas credentials --platform android   # follow interactive menu
eas credentials --platform ios
```

---

### EAS Project ID

Before running any `eas build` command, make sure the EAS project is initialised and
the project ID is set in `app.json`:

```bash
eas init   # creates the project on expo.dev and writes the projectId to app.json
```

Replace the placeholder in `apps/mobile/app.json`:

```json
"extra": {
  "eas": {
    "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

The `projectId` is also required at runtime for `getExpoPushTokenAsync()` (already
wired up in `src/services/notifications.ts` via `expo-constants`).

---

## Testing with EAS builds

### 1. Configure your EAS project

```bash
cd apps/mobile
eas login
eas init   # links app.json to your EAS project (updates projectId)
eas build:configure
```

### 2. Development build (recommended for full push testing)

```bash
# Android – installs debug APK directly on a connected device
eas build --platform android --profile development

# iOS – builds for simulator or device
eas build --platform ios --profile development
eas device:create   # register your device UDID (first time)
```

Install the resulting artifact on your device, then open it and run through the login flow.

### 3. Preview / staging build

```bash
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

Distribute internally via EAS to teammates for broader testing.

### 4. Verifying the push token end-to-end

After logging in on the build:

1. Check the backend logs for a successful `POST /api/notifications/register` call.
2. Verify the installation in Azure Notification Hubs:
   - Azure Portal → Notification Hubs → your hub → **Installations**
   - Filter by the `installationId` stored in AsyncStorage on the device.
3. Send a test notification from the Azure Portal or using the Expo Push Notification Tool (works for Expo-mediated tokens in development):
   - Go to [expo.dev/notifications](https://expo.dev/notifications)
   - Enter the `ExponentPushToken[...]` from the app logs
4. Confirm the notification appears on the device.

---

## No secrets in the repo

| File | Status |
|---|---|
| `apps/mobile/google-services.json` | ❌ gitignored – never commit |
| `apps/mobile/GoogleService-Info.plist` | ❌ gitignored – never commit |
| `apps/mobile/.env` | ❌ gitignored – never commit |
| `backend/.env` | ❌ gitignored – never commit |
| `apps/mobile/.env.example` | ✅ safe to commit (placeholder values only) |
| `backend/.env.example` | ✅ safe to commit (placeholder values only) |

All sensitive values (`ANH_CONNECTION_STRING`, `google-services.json`, APNs keys) must be injected via:
- **Local development**: `.env` files (gitignored)
- **EAS builds**: EAS Secrets (`eas secret:create`)
- **CI/CD**: Repository secrets (GitHub Actions `secrets.*`)

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Token is `null` after login | Make sure you are on a **physical device**, not a simulator/emulator. |
| Permission dialog never appears | Uninstall and reinstall the app to reset permission state. |
| Backend returns 401 | Ensure the JWT token from login is being sent in the `Authorization` header (handled automatically by `apiClient`). |
| `google-services.json` not found | Place the file at `apps/mobile/google-services.json` (see `docs/android.md`). |
| iOS push not received on simulator | APNs requires a physical device. Use `eas build --profile development` and install on a real iPhone. |
