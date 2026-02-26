# 🚀 TrampoHero – Staging & Online Preview Deployment Guide

This guide explains how to deploy TrampoHero to free hosting platforms so you can
test the app in a browser **without installing anything locally on Windows**.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend – Deploy to Vercel](#2-frontend--deploy-to-vercel)
3. [Frontend – Deploy to Netlify (alternative)](#3-frontend--deploy-to-netlify-alternative)
4. [Backend – Deploy to Render](#4-backend--deploy-to-render)
5. [Backend – Alternatives (Fly.io / Railway)](#5-backend--alternatives-flyio--railway)
6. [Required Environment Variables](#6-required-environment-variables)
7. [Connecting Frontend ↔ Backend](#7-connecting-frontend--backend)
8. [Staging Checklist](#8-staging-checklist)
9. [Manual Test Steps](#9-manual-test-steps)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Architecture Overview

```
Browser
  └─► Vercel / Netlify   (React SPA – static, built with Vite)
            │
            │  HTTPS requests to /api/*
            ▼
        Render.com       (Express API – Node.js)
            │
            ▼
        MongoDB Atlas    (Database – free tier M0)
```

---

## 2. Frontend – Deploy to Vercel

**`vercel.json` is already committed** at the repo root. It handles:
- SPA client-side routing (all paths → `index.html`)
- Long-term caching for hashed asset bundles
- Basic security headers

### Steps

1. Go to <https://vercel.com> and log in with GitHub.
2. Click **"Add New Project"** → import **`tavs-coelho/TrampoHero`**.
3. Vercel auto-detects Vite. Leave the default settings:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables (see [§ 6](#6-required-environment-variables)):
   - `VITE_API_URL` → `https://<your-render-backend>.onrender.com/api`
   - `VITE_GEMINI_API_KEY` → your Gemini API key (browser-side AI features)
   > ⚠️ **Never set `GEMINI_API_KEY` (without `VITE_`) on the frontend.** The backend's copy lives only in the backend hosting dashboard.
5. Click **Deploy**. Your URL will be `https://<project>.vercel.app`.

---

## 3. Frontend – Deploy to Netlify (alternative)

**`netlify.toml` is already committed** at the repo root. It handles the same concerns as `vercel.json`.

### Steps

1. Go to <https://app.netlify.com> and log in with GitHub.
2. Click **"Add new site" → "Import an existing project"** → GitHub → select `TrampoHero`.
3. Netlify reads `netlify.toml` automatically. Leave defaults.
4. In **Site settings → Environment variables**, add:
   - `VITE_API_URL` → `https://<your-render-backend>.onrender.com/api`
   - `VITE_GEMINI_API_KEY` → your Gemini API key
   > ⚠️ **Never set `GEMINI_API_KEY` (without `VITE_`) on Netlify.**
5. Click **Deploy site**. Your URL will be `https://<site>.netlify.app`.

---

## 4. Backend – Deploy to Render

[Render](https://render.com) provides a free tier for web services (spins down after inactivity; first
request after idle may take ~30 s).

### Steps

1. Go to <https://dashboard.render.com> and log in with GitHub.
2. Click **"New +" → "Web Service"** → connect the `TrampoHero` repo.
3. Configure the service:
   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `backend` |
   | **Environment** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free |
4. Add all [required environment variables](#6-required-environment-variables) in the
   **"Environment"** tab of the service settings.
5. Click **"Create Web Service"**. Note the URL
   (`https://<name>.onrender.com`) — use it as the `VITE_API_URL` in your frontend.

---

## 5. Backend – Alternatives (Fly.io / Railway)

### Fly.io

```bash
# Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
cd backend
fly launch          # follow prompts, choose free tier
fly secrets set PORT=8080 NODE_ENV=production MONGODB_URI=... JWT_SECRET=... \
    GEMINI_API_KEY=... ALLOWED_ORIGINS=https://<your-frontend>.vercel.app
fly deploy
```

### Railway

1. <https://railway.app> → **New Project → Deploy from GitHub Repo**.
2. Point root to `backend/`.
3. Set environment variables in the **Variables** tab (see §6).
4. Railway assigns a public URL automatically.

---

## 6. Required Environment Variables

### Backend (set in Render / Fly.io / Railway dashboard — never commit these)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port the server listens on | `10000` (Render uses this automatically) |
| `NODE_ENV` | Runtime environment | `production` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/trampohero` |
| `JWT_SECRET` | Secret for signing JWTs (use a long random string) | `openssl rand -hex 32` |
| `JWT_EXPIRE` | Token TTL | `30d` |
| `GEMINI_API_KEY` | Google Gemini API key (backend AI features) | `AIza…` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_…` |
| `ALLOWED_ORIGINS` | Allowed CORS origin(s) — comma-separated | `https://trampohero.vercel.app,https://trampohero.netlify.app` |

### Frontend (set in Vercel / Netlify dashboard)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Full URL of the backend API | `https://trampohero-api.onrender.com/api` |
| `VITE_GEMINI_API_KEY` | Gemini API key for browser-side AI features | `AIza…` |

> ⚠️ Any variable exposed in the frontend bundle (prefixed `VITE_`) **must not be a high-value backend secret**.
> `GEMINI_API_KEY` (without `VITE_`) is used server-side only — set it in the **backend** hosting dashboard.

### MongoDB Atlas (free M0 cluster)

1. Sign up at <https://cloud.mongodb.com>.
2. Create a free **M0** cluster.
3. Under **Database Access**, create a user with read/write permissions.
4. Under **Network Access**, allow `0.0.0.0/0` (or restrict to Render's IP range).
5. Copy the connection string and use it as `MONGODB_URI`.

---

## 7. Connecting Frontend ↔ Backend

The backend reads `ALLOWED_ORIGINS` and uses it as the CORS allow-list (parsed from
`backend/src/config/env.js`). Set it to the frontend's deployed URL(s), comma-separated:

```
ALLOWED_ORIGINS=https://trampohero.vercel.app,https://trampohero.netlify.app
```

The frontend reads `VITE_API_URL` at build time — make sure it points to your deployed backend.

For browser-side AI features, set `VITE_GEMINI_API_KEY` in the frontend hosting dashboard.

---

## 8. Staging Checklist

Before sharing your staging URL, verify each item:

- [ ] **MongoDB Atlas** cluster created and connection string in `MONGODB_URI`
- [ ] **Backend deployed** to Render (or Fly.io / Railway)
  - [ ] Health check passes: `GET https://<backend>/health` returns `{"status":"ok"}`
  - [ ] `NODE_ENV=production` set
  - [ ] `JWT_SECRET` set to a strong random value (≥ 32 chars)
  - [ ] `GEMINI_API_KEY` set (backend env only)
  - [ ] `ALLOWED_ORIGINS` set to the frontend's deployed URL(s)
- [ ] **Frontend deployed** to Vercel or Netlify
  - [ ] `VITE_API_URL` set to the backend's deployed URL + `/api`
  - [ ] `VITE_GEMINI_API_KEY` set for browser-side AI features
  - [ ] Build succeeds without errors
  - [ ] SPA routing works (refreshing any route returns the app, not a 404)
- [ ] **CORS** verified: browser console shows no CORS errors on API calls
- [ ] **Secrets** not exposed: `GEMINI_API_KEY` (backend-only key) is not visible in the browser's Network tab
  or in `window.__env` / `process.env` in browser DevTools

---

## 9. Manual Test Steps

After deploying, open the staging URL and perform the following checks:

1. **Home page loads** — app renders without a blank screen or console errors.
2. **Register a new account** — fill in the sign-up form; no network errors in DevTools.
3. **Log in** — use the credentials created above; JWT stored in `localStorage`/cookie.
4. **Browse jobs** — job listings load from the backend API (Network tab → `GET /api/jobs`).
5. **AI features** — trigger a Gemini-powered suggestion; response appears in UI.
6. **Refresh deep link** — navigate to `/profile` (or any nested route), then refresh the
   browser. The app should still load (not a 404). This validates SPA redirect config.
7. **CORS check** — open DevTools → Network, filter by XHR/Fetch; no request should be
   blocked with a CORS error.
8. **Health endpoint** — visit `https://<backend>/health` directly; should return JSON.

---

## 10. Troubleshooting

### "Application error" or blank page on Vercel/Netlify

- Check the **Deployment logs** in the hosting dashboard for build errors.
- Ensure `VITE_API_URL` is set in the hosting environment (not just locally).
- Confirm the `dist/` directory is the published output.

### Refreshing a page returns 404

- On **Vercel**: `vercel.json` rewrites handle this — ensure the file is at the repo root.
- On **Netlify**: `netlify.toml` redirect handles this — ensure the file is at the repo root.

### CORS errors in the browser

- Open the backend service → **Environment** tab → verify `ALLOWED_ORIGINS` matches the
  exact origin (including `https://` and no trailing slash).
- If you have both Vercel and Netlify URLs, separate them with a comma:
  `https://app.vercel.app,https://app.netlify.app`
- Redeploy the backend after changing `ALLOWED_ORIGINS`.

### Backend returns 503 / slow first response on Render free tier

- The free tier spins down after ~15 minutes of inactivity. The first request wakes it
  up (may take 30–60 s). This is expected behavior; upgrade to a paid instance to avoid it.
- Add a simple ping (e.g. UptimeRobot) to keep the instance warm during testing.

### MongoDB connection errors

- Check that the Atlas cluster's **Network Access** list includes `0.0.0.0/0` or the
  backend's outbound IP.
- Verify the `MONGODB_URI` includes the correct username, password, and cluster hostname.
- Ensure the database user has **readWrite** access to the `trampohero` database.

### `GEMINI_API_KEY` not working

- Confirm the key is set **only in the backend** hosting dashboard, not the frontend.
- Verify the key is active in <https://aistudio.google.com/app/apikey>.
