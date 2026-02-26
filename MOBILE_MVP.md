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
- Job pins rendered at `job.coordinates` ({lat, lng}).
- Boosted jobs shown in amber, standard jobs in navy.
- User's current location shown with the native blue dot.

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

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API base URL |
| `EXPO_PUBLIC_ANH_CONNECTION_STRING` | Azure Notification Hubs connection string |
| `EXPO_PUBLIC_ANH_HUB_NAME` | Azure Notification Hubs name |
| `EXPO_PUBLIC_WEB_PUBSUB_URL` | Fallback Web PubSub WebSocket URL |
| `EXPO_PUBLIC_ENABLE_CHAT` | Feature flag for chat |
| `EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS` | Feature flag for push notifications |
| `EXPO_PUBLIC_ENABLE_MAP` | Feature flag for map screen |

---

## Platforms

| PR | Branch | Platform | Docs |
|---|---|---|---|
| Android MVP | `copilot/add-android-mvp-support` | Android | `docs/android.md` |
| iOS MVP | `copilot/add-ios-mvp-support` | iOS | `docs/ios.md` |

---

## Manual test steps

1. **Start the backend** (`cd backend && npm start`).
2. **Set env vars** (`cp apps/mobile/.env.example apps/mobile/.env`).
3. **Install dependencies** (`cd apps/mobile && npm install`).
4. **Run on device/emulator** (`npm run android` or `npm run ios`).
5. Register a new account (freelancer + niche, or employer).
6. Browse the jobs list – confirm items load from the API.
7. Tap a job to open the detail screen.
8. Confirm the map shows pins for open jobs.
9. For an `ongoing` job: test check-in (should request location permission),
   photo upload (should open image picker), and chat (should connect to WS).
10. Force-kill and relaunch the app – confirm you remain logged in.

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
