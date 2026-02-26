# 🚀 TrampoHero Deployment Guide

This guide explains how to deploy the **frontend** (Vite + React) and **backend** (Express + MongoDB) to staging and production environments so the app can be used without installing Node.js locally.

---

## Table of Contents

1. [Architecture overview](#architecture-overview)
2. [Frontend – Vercel (recommended)](#frontend--vercel-recommended)
3. [Frontend – Netlify (alternative)](#frontend--netlify-alternative)
4. [Backend – Render (recommended)](#backend--render-recommended)
5. [Backend – Railway / Fly.io (alternatives)](#backend--railway--flyio-alternatives)
6. [Database – MongoDB Atlas](#database--mongodb-atlas)
7. [Environment variable reference](#environment-variable-reference)
8. [CORS configuration](#cors-configuration)
9. [Staging vs production setup](#staging-vs-production-setup)
10. [Manual smoke-test checklist](#manual-smoke-test-checklist)

---

## Architecture overview

```
Browser ──► Vercel / Netlify (dist/)    ← static React SPA
                │
                │ fetch /api/*
                ▼
           Render / Railway (Node.js)   ← Express API  (port 5000)
                │
                ▼
           MongoDB Atlas                ← managed database
```

All **secrets** (`GEMINI_API_KEY`, `JWT_SECRET`, MongoDB credentials) live only on the backend server.  
The frontend only needs `VITE_API_URL` pointing at the deployed backend.

---

## Frontend – Vercel (recommended)

### One-time setup

1. Push the repository to GitHub (already done).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `TrampoHero`.
3. Vercel auto-detects Vite; confirm:
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. Add environment variable:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://your-backend.onrender.com/api` |
5. Click **Deploy**.

### Re-deploy after changes

Push to `main` (or your production branch). Vercel redeploys automatically.

### Preview deployments (staging)

Every pull request gets an auto-generated preview URL like  
`https://trampohero-git-my-branch-tavs-coelho.vercel.app`.

The preview URL is what you share with stakeholders for online testing.

---

## Frontend – Netlify (alternative)

A `netlify.toml` is included at the repo root.

1. Connect the repo in the [Netlify dashboard](https://app.netlify.com).
2. Netlify reads `netlify.toml` automatically.
3. Add environment variable `VITE_API_URL` in **Site settings → Environment variables**.
4. Click **Deploy site**.

---

## Backend – Render (recommended)

### One-time setup

1. Go to [render.com](https://render.com) → **New Web Service** → connect the repo.
2. Set:
   - **Root Directory**: `backend`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Environment**: `Node`
3. Add environment variables (see [reference](#environment-variable-reference)).
4. Click **Create Web Service**.

Render provisions HTTPS automatically. Your API URL will be  
`https://trampohero-api.onrender.com`.

### Free-tier note

Render free services spin down after 15 minutes of inactivity.  
For always-on staging, use the **Starter** plan (~$7/month).

---

## Backend – Railway / Fly.io (alternatives)

### Railway

```bash
npm install -g @railway/cli
railway login
cd backend
railway up
```

Set environment variables via `railway variables set KEY=value` or the dashboard.

### Fly.io

```bash
npm install -g flyctl
flyctl auth login
cd backend
flyctl launch        # creates fly.toml, follow prompts
flyctl secrets set JWT_SECRET=... MONGODB_URI=... GEMINI_API_KEY=...
flyctl deploy
```

---

## Database – MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Under **Network Access**, add `0.0.0.0/0` (allow all IPs) for cloud hosting, or the specific IP range of your backend host.
3. Create a database user and copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/trampohero?retryWrites=true&w=majority
   ```
4. Set this as `MONGODB_URI` in your backend host's environment variables.

---

## Environment variable reference

### Backend (Render / Railway / Fly.io)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Long random string, e.g. 64-char hex |
| `JWT_EXPIRE` | | JWT token lifetime (default `30d`) |
| `PORT` | | Server port (default `5000`; Render sets this automatically) |
| `NODE_ENV` | | `production` on live servers |
| `FRONTEND_URL` | | Primary frontend origin for CORS, e.g. `https://trampohero.vercel.app` |
| `ALLOWED_ORIGINS` | | Comma-separated extra origins (staging, preview URLs) |
| `GEMINI_API_KEY` | | Google Gemini API key – **backend only, never in frontend** |
| `STRIPE_SECRET_KEY` | | Stripe secret key for payments |
| `RATE_LIMIT_MAX` | | Max API requests per 15 min per IP (default `100`) |

### Frontend (Vercel / Netlify)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Full backend API URL, e.g. `https://trampohero-api.onrender.com/api` |

> ⚠️ **Never** add `GEMINI_API_KEY` or any other secret to frontend environment variables.  
> Anything prefixed `VITE_` is bundled into the JavaScript served to users.

---

## CORS configuration

The backend uses `FRONTEND_URL` + `ALLOWED_ORIGINS` to build its CORS allowlist.

```
# backend/.env  (or Render / Railway env panel)
FRONTEND_URL=https://trampohero.vercel.app
ALLOWED_ORIGINS=https://staging.trampohero.com,https://trampohero-git-dev-tavs-coelho.vercel.app
```

When you create a new Vercel preview deployment, add its URL to `ALLOWED_ORIGINS` and redeploy the backend (or just restart the service so the new env var is picked up).

---

## Staging vs production setup

| | Staging | Production |
|--|---------|------------|
| **Frontend host** | Vercel preview PR URL | `https://trampohero.vercel.app` |
| **Backend host** | Render staging service | Render production service |
| **Database** | Atlas free cluster `trampohero-staging` | Atlas production cluster |
| `NODE_ENV` | `staging` | `production` |
| `RATE_LIMIT_MAX` | `500` (relaxed for QA) | `100` |

Create two separate Render services (`trampohero-api-staging` and `trampohero-api-prod`) pointing to different MongoDB databases.

---

## Manual smoke-test checklist

After every deploy, verify the following:

- [ ] `GET https://your-backend.onrender.com/health` returns `{"status":"ok","db":"connected"}`
- [ ] Frontend loads at the deployed URL without console errors
- [ ] Registration and login flow works (POST `/api/auth/register`, `/api/auth/login`)
- [ ] AI insight appears on a job card (calls `/api/ai/generate`)
- [ ] Wallet balance endpoint responds (GET `/api/wallet/balance` with auth token)
- [ ] Network tab shows **no requests to `generativelanguage.googleapis.com`** from the browser (all AI calls go through `/api/ai/generate`)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Frontend loads but API calls fail with CORS error | Backend `FRONTEND_URL` / `ALLOWED_ORIGINS` does not include the frontend URL | Update backend env var and redeploy |
| `AI service is not configured on this server` | `GEMINI_API_KEY` not set on backend | Add the key in Render environment variables |
| Backend exits immediately with `❌ Missing required environment variables` | `JWT_SECRET` or `MONGODB_URI` not set | Set missing vars in host dashboard |
| MongoDB connection error | IP not whitelisted in Atlas | Add `0.0.0.0/0` in Atlas Network Access |
