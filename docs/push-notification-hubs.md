# Push Notifications via Azure Notification Hubs

This document explains how to set up Azure Notification Hubs for TrampoHero push
notifications and how to configure FCM (Android) and APNs (iOS) credentials,
map role/niche tags, and test the integration end-to-end.

---

## Overview

```
Mobile App                  Backend API                Azure Notification Hubs
    |                           |                               |
    |-- POST /api/notifications/register -->                    |
    |                     createOrUpdateInstallation ---------->|
    |<-- { installationId, tags } --                            |
    |                                                           |
    |                  (admin sends push)                       |
    |             POST /api/notifications/send/user/:userId     |
    |                     sendNotification (tag expression) --->|
    |<-- push notification ------------------------------------ |
```

ANH sits between the backend and the platform PNS (APNs / FCM v1). The backend
never calls APNs or FCM directly.

---

## 1. Create an Azure Notification Hub

```bash
# Login
az login

# Create or reuse a resource group
az group create --name trampohero-rg --location brazilsouth

# Create a Notification Hub Namespace (Basic tier is enough for dev/staging)
az notification-hub namespace create \
  --resource-group trampohero-rg \
  --name trampohero-ns \
  --location brazilsouth \
  --sku Basic

# Create the Notification Hub inside the namespace
az notification-hub create \
  --resource-group trampohero-rg \
  --namespace-name trampohero-ns \
  --name trampohero-hub \
  --location brazilsouth
```

### Retrieve the connection string

```bash
az notification-hub authorization-rule list-keys \
  --resource-group trampohero-rg \
  --namespace-name trampohero-ns \
  --notification-hub-name trampohero-hub \
  --name DefaultFullSharedAccessSignature \
  --query primaryConnectionString -o tsv
```

Add the output to `backend/.env`:

```env
ANH_CONNECTION_STRING=Endpoint=sb://trampohero-ns.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=<key>
ANH_HUB_NAME=trampohero-hub
```

---

## 2. Configure FCM v1 (Android / Firebase)

1. Create a Firebase project at <https://console.firebase.google.com>.
2. Go to **Project Settings → Service accounts** and click **Generate new private key**
   to download `serviceAccountKey.json`.
3. In the Azure portal, open your Notification Hub → **Settings → Google (FCM v1)**.
4. Upload the `serviceAccountKey.json` file and click **Save**.

> **Security note:** Never commit `serviceAccountKey.json` to version control.

---

## 3. Configure APNs (iOS)

1. In the Apple Developer portal, create an **APNs Key** (Auth Key, `.p8`).
2. Note the **Key ID**, **Team ID**, and **Bundle ID** of your app.
3. In the Azure portal, open your Notification Hub → **Settings → Apple (APNS)**.
4. Choose **Token** authentication, upload the `.p8` file, and fill in Key ID, Team ID,
   and Bundle ID. Choose **Sandbox** for dev, **Production** for release.
5. Click **Save**.

---

## 4. Tag Strategy

TrampoHero uses three tag namespaces:

| Namespace | Format             | Examples                                          |
|-----------|--------------------|---------------------------------------------------|
| `user`    | `user:<userId>`    | `user:6650abc123def456` (MongoDB `_id`)           |
| `role`    | `role:<role>`      | `role:freelancer`, `role:employer`                |
| `niche`   | `niche:<niche>`    | `niche:Gastronomia`, `niche:Construção`           |

### How tags are set

The mobile app sends its push token along with the user's `role` and `niche` tags
when registering. The backend automatically adds the `user:<userId>` tag from the
authenticated JWT, so each device is always reachable by the user's ID.

Example registration payload:

```json
{
  "installationId": "550e8400-e29b-41d4-a716-446655440000",
  "platform": "fcmv1",
  "pushToken": "<firebase-registration-token>",
  "tags": ["role:freelancer", "niche:Gastronomia"]
}
```

The backend stores the installation in ANH with the full tag set:

```
["user:6650abc123def456", "role:freelancer", "niche:Gastronomia"]
```

### Tag expressions

Use ANH tag expression syntax for segmented sends:

| Target                              | Tag expression                           |
|-------------------------------------|------------------------------------------|
| All freelancers                     | `role:freelancer`                        |
| All employers                       | `role:employer`                          |
| Freelancers in Gastronomia          | `role:freelancer && niche:Gastronomia`   |
| All in two niches                   | `niche:Construção \|\| niche:Eventos`    |

---

## 5. Environment Variables

Add to `backend/.env` (see `backend/.env.example`):

```env
ANH_CONNECTION_STRING=Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=<key>
ANH_HUB_NAME=your_notification_hub_name
```

If both variables are absent the push endpoints return `503 Service Unavailable`
and the rest of the API continues to work normally.

---

## 6. API Endpoints

### Register a device

```
POST /api/notifications/register
Authorization: Bearer <jwt>
```

**Request body:**

```json
{
  "installationId": "550e8400-e29b-41d4-a716-446655440000",
  "platform": "fcmv1",
  "pushToken": "<device-token>",
  "tags": ["role:freelancer", "niche:Gastronomia"]
}
```

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "installationId": "550e8400-e29b-41d4-a716-446655440000",
    "tags": ["user:6650abc123def456", "role:freelancer", "niche:Gastronomia"]
  }
}
```

---

### Update tags

```
PUT /api/notifications/register/:installationId
Authorization: Bearer <jwt>
```

**Request body:**

```json
{
  "tags": ["role:freelancer", "niche:Eventos"]
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "installationId": "550e8400-e29b-41d4-a716-446655440000",
    "tags": ["user:6650abc123def456", "role:freelancer", "niche:Eventos"]
  }
}
```

---

### Remove a device (optional)

```
DELETE /api/notifications/register/:installationId
Authorization: Bearer <jwt>
```

**Response `200`:**

```json
{ "success": true }
```

---

### Send to a specific user (admin only)

```
POST /api/notifications/send/user/:userId
Authorization: Bearer <admin-jwt>
```

**Request body:**

```json
{
  "title": "Novo trabalho disponível!",
  "body": "Confira as vagas na sua área.",
  "data": { "screen": "jobs" }
}
```

**Response `200`:**

```json
{ "success": true }
```

---

### Send to a segment (admin only)

```
POST /api/notifications/send/segment
Authorization: Bearer <admin-jwt>
```

**Request body:**

```json
{
  "tagExpression": "role:freelancer && niche:Gastronomia",
  "title": "Oportunidade na sua área!",
  "body": "Há novos trabalhos de Gastronomia perto de você.",
  "data": { "screen": "jobs" }
}
```

**Response `200`:**

```json
{ "success": true }
```

---

## 7. Manual Test Steps

> Replace `TOKEN` with a valid JWT from `POST /api/auth/login`.

### Step 1 – Register a device

```bash
TOKEN="<your_jwt_token>"

curl -s -X POST http://localhost:5000/api/notifications/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "installationId": "test-device-001",
    "platform": "fcmv1",
    "pushToken": "<firebase-registration-token>",
    "tags": ["role:freelancer", "niche:Gastronomia"]
  }'
```

Expected response (`201`):

```json
{
  "success": true,
  "data": {
    "installationId": "test-device-001",
    "tags": ["user:<your-user-id>", "role:freelancer", "niche:Gastronomia"]
  }
}
```

### Step 2 – Update tags

```bash
curl -s -X PUT http://localhost:5000/api/notifications/register/test-device-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["role:freelancer", "niche:Eventos"]}'
```

### Step 3 – Send a push to the user (requires admin role)

```bash
ADMIN_TOKEN="<admin_jwt_token>"
USER_ID="<target-user-mongo-id>"

curl -s -X POST http://localhost:5000/api/notifications/send/user/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Teste TrampoHero",
    "body": "Notificação de teste via Azure Notification Hubs."
  }'
```

### Step 4 – Send a push to a segment (requires admin role)

```bash
curl -s -X POST http://localhost:5000/api/notifications/send/segment \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tagExpression": "role:freelancer && niche:Gastronomia",
    "title": "Oportunidade!",
    "body": "Novo trabalho na sua área."
  }'
```

### Step 5 – Remove device

```bash
curl -s -X DELETE http://localhost:5000/api/notifications/register/test-device-001 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 8. Deploy to Azure Container Apps

Set the two new environment variables alongside the existing ones:

```bash
az containerapp secret set \
  --name trampohero-api \
  --resource-group trampohero-rg \
  --secrets "anh-connection-string=<connection-string>"

az containerapp update \
  --name trampohero-api \
  --resource-group trampohero-rg \
  --set-env-vars \
    ANH_CONNECTION_STRING=secretref:anh-connection-string \
    ANH_HUB_NAME=trampohero-hub
```
