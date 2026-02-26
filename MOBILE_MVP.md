# TrampoHero Mobile MVP

This document describes the mobile application for TrampoHero, built with
**React Native + Expo** and designed for both Android and iOS.

---

## Architecture overview

```
apps/mobile/
├── App.tsx                     # Root component – providers + navigator
├── app.json                    # Expo config (Android + iOS)
├── package.json
├── tsconfig.json
├── .env.example                # Environment variable template
├── docs/
│   ├── android.md              # Android-specific setup guide
│   └── ios.md                  # iOS-specific setup guide
└── src/
    ├── api/
    │   ├── client.ts           # Shared API client (fetch + AsyncStorage token)
    │   └── types.ts            # Shared TypeScript types
    ├── contexts/
    │   └── AuthContext.tsx     # Authentication state + actions
    ├── navigation/
    │   └── AppNavigator.tsx    # Stack + tab navigation (React Navigation)
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   └── RegisterScreen.tsx
    │   ├── jobs/
    │   │   ├── JobsListScreen.tsx
    │   │   └── JobDetailScreen.tsx
    │   ├── map/
    │   │   └── MapScreen.tsx   # react-native-maps with job pins
    │   └── chat/
    │       └── ChatScreen.tsx  # Real-time chat via Azure Web PubSub
    └── services/
        ├── geolocation.ts      # expo-location + check-in POST
        ├── photoUpload.ts      # expo-image-picker + Azure Blob SAS upload
        ├── chat.ts             # WebSocket client (Azure Web PubSub stub)
        └── notifications.ts    # expo-notifications + Azure Notification Hubs
```

---

## Features

### Authentication
- Login and register screens with form validation.
- JWT token stored in `AsyncStorage` (persisted across app restarts).
- `AuthContext` exposes `user`, `token`, `login`, `register`, `logout`.

### Jobs list
- Paginated list of available jobs fetched from `/api/jobs`.
- Pull-to-refresh support.
- Boosted jobs are visually highlighted.

### Job detail
- Full job information with employer rating and payment details.
- **Apply** button for `open` jobs.
- **Check-in** button for `ongoing` jobs (triggers geolocation).
- **Upload proof photo** button (opens image picker → Azure Blob).
- **Chat** button opens the real-time chat for the job.

### Map
- Full-screen Google Maps / Apple Maps view.
- Requests foreground location permission on screen mount.
  - If granted: shows native blue dot and "My Location" button.
  - If denied: shows a warning banner; map still renders without user location.
- Job pins fetched from `GET /api/jobs?status=open`.
  - Jobs with valid `coordinates` are pinned at their exact position.
  - Jobs whose `coordinates` are missing or zero-value fall back to a
    deterministic mock coordinate in the São Paulo area so the map is never empty.
- Boosted jobs shown in amber, standard jobs in navy.
- Tapping any pin navigates to the **Job Detail** screen for that job.

### Geolocation check-in
- Requests foreground location permission at check-in time (not upfront).
- High-accuracy GPS read.
- POSTs `{ jobId, latitude, longitude, timestamp }` to `/api/jobs/:id/checkin`.

### Photo upload
- Image picker (gallery or camera).
- Backend provides a SAS URL via `POST /api/jobs/upload-sas`.
- File uploaded directly to Azure Blob Storage with `PUT` + SAS URL.
- Gracefully degrades if the backend endpoint is not yet implemented.

### Real-time chat
- WebSocket client wrapping Azure Web PubSub.
- Backend provides a short-lived client access URL via `GET /api/jobs/:jobId/chat-token`.
- Gracefully degrades to stub mode if the endpoint is unavailable.
- Messages rendered with own/other differentiation and timestamps.

### Push notifications
- `expo-notifications` for cross-platform push token retrieval.
- Android: FCM via `google-services.json` (see `docs/android.md`).
- iOS: APNs via Xcode capabilities (see `docs/ios.md`).
- Tokens and targeting tags registered with backend → Azure Notification Hubs.
- Two Android notification channels: `trampohero-default` (high priority) and
  `trampohero-jobs` (job alerts).

---

## Environment variables

All variables are prefixed with `EXPO_PUBLIC_` so they are embedded in the
bundle at build time. Copy `apps/mobile/.env.example` to `apps/mobile/.env`
and fill in the values.

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

The most important variable is `EXPO_PUBLIC_API_BASE_URL`, which points the
app at the backend API:

```dotenv
# Local development
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api

# Staging
EXPO_PUBLIC_API_BASE_URL=https://api-staging.trampohero.com/api
```

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API base URL |
| `EXPO_PUBLIC_ANH_CONNECTION_STRING` | Azure Notification Hubs connection string |
| `EXPO_PUBLIC_ANH_HUB_NAME` | Azure Notification Hubs name |
| `EXPO_PUBLIC_WEB_PUBSUB_URL` | Fallback Web PubSub WebSocket URL |
| `EXPO_PUBLIC_ENABLE_CHAT` | Feature flag for chat |
| `EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS` | Feature flag for push notifications |
| `EXPO_PUBLIC_ENABLE_MAP` | Feature flag for map screen |

---

## How to run locally (Expo)

```bash
# 1. Install dependencies
cd apps/mobile
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env and set EXPO_PUBLIC_API_BASE_URL to your backend URL

# 3. Start the Expo development server
npm run start

# 4. Launch on Android emulator
npm run android

# 5. Launch on iOS simulator (macOS only)
npm run ios
```

For platform-specific setup (FCM, APNs, EAS builds), see:
- [Android setup →](apps/mobile/docs/android.md)
- [iOS setup →](apps/mobile/docs/ios.md)

---

## Manual test steps

1. **Start the backend** (`cd backend && npm start`).
2. **Set env vars**: `cp apps/mobile/.env.example apps/mobile/.env` then set `EXPO_PUBLIC_API_BASE_URL`.
3. **Install dependencies** (`cd apps/mobile && npm install`).
4. **Run on device/emulator** (`npm run android` or `npm run ios`).
5. Register a new account (freelancer + niche, or employer).
6. Browse the jobs list – confirm items load from the API.
7. Tap a job to open the detail screen.

### Map – manual tests

8. Open the **Mapa** tab.
   - **Permission granted**: Accept the location permission prompt. Confirm the native blue dot and "My Location" button appear on the map.
   - **Permission denied**: Deny the permission. Confirm the amber warning banner ("Permissão de localização negada") appears below the title, and that the map still renders with job pins but without the user's location dot.
9. Confirm job pins load from the API:
   - Navy pins for standard open jobs.
   - Amber pins for boosted jobs.
10. **Fallback coordinates**: If the backend returns jobs without `coordinates` (or with `{lat:0, lng:0}`), confirm those jobs still appear as pins distributed around São Paulo (mock fallback) instead of crashing or disappearing.
11. **Tap a pin** – confirm the info callout appears (job title + employer + payment).
12. **Tap the callout / pin again** – confirm the app navigates to the **Job Detail** screen for that job, showing the full job information.
13. Press Back and confirm you return to the map.

For an `ongoing` job: test check-in (should request location permission),
   photo upload (should open image picker), and chat (should connect to WS).
14. Force-kill and relaunch the app – confirm you remain logged in.

---

## Backend stubs required

The following backend endpoints must exist for full MVP functionality.
They can return mock data during initial development:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/jobs/upload-sas` | Return `{ sasUrl, blobName, containerUrl }` |
| `POST` | `/api/jobs/:id/checkin` | Accept `{ jobId, latitude, longitude, timestamp }` |
| `GET` | `/api/jobs/:id/chat-token` | Return `{ url }` (Web PubSub access URL) |
| `POST` | `/api/users/push-device` | Accept `{ deviceToken, platform, userId, tags }` |

---

## MVP feature checklist

- [x] Login screen (email + password, JWT stored in AsyncStorage)
- [x] Register screen (name, email, password, role, niche)
- [x] Persistent session restore on launch
- [x] Jobs list screen with pull-to-refresh
- [x] Job detail screen (info, apply, check-in, photo, chat)
- [x] Map screen with job pins (boosted = amber, standard = navy)
- [x] Map requests foreground location permission on mount
- [x] Map shows user's blue dot when permission is granted
- [x] Map shows warning banner when permission is denied (still functional)
- [x] Map tapping a pin navigates to Job Detail screen
- [x] Map fallback mock coordinates for jobs missing valid coordinates
- [x] Map uses native provider (Apple Maps on iOS, Google Maps on Android)
- [x] Geolocation check-in (`POST /api/jobs/:id/checkin`)
- [x] Photo upload via Azure Blob SAS URL (degrades gracefully)
- [x] Real-time chat via WebSocket / Azure Web PubSub (stub-safe)
- [x] Push notification registration (Expo + Azure Notification Hubs)
- [ ] Backend stubs for SAS, check-in, chat-token, push-device
- [ ] `google-services.json` for Android FCM (see `docs/android.md`)
- [ ] APNs key for iOS push (see `docs/ios.md`)
