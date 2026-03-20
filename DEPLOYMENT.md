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
2. Under **Network Access**, add only the specific IP addresses or ranges of your backend host(s). Avoid `0.0.0.0/0` (allow all) in production — use it only temporarily during initial setup in non-production environments, and remove it once your backend IPs are known.
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
| MongoDB connection error | IP not whitelisted in Atlas | Add your backend host's IP in Atlas Network Access |

---

## Entrega solicitada (produção inicial)

### 1) Checklist de produção

- [ ] Frontend em Vercel/Netlify com `npm run build` ok
- [ ] Backend em Render/Railway com `npm start` ok
- [ ] `NODE_ENV=production` configurado no backend
- [ ] `MONGODB_URI` apontando para cluster Atlas de produção
- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` fortes e diferentes
- [ ] `ALLOWED_ORIGINS` e `FRONTEND_URL` alinhados com os domínios reais
- [ ] `GET /health` retornando `200` e `{"status":"ok","db":"connected"}`
- [ ] Logs acessíveis na plataforma (Render/Railway) com rastreio de erros 5xx
- [ ] Smoke tests pós-deploy executados (ver seção 6)

### 2) Variáveis de ambiente por ambiente

#### Backend (staging)

- `NODE_ENV=staging`
- `MONGODB_URI=<atlas-staging>`
- `JWT_SECRET=<staging-secret>`
- `JWT_REFRESH_SECRET=<staging-refresh-secret>`
- `FRONTEND_URL=<url-frontend-staging>`
- `ALLOWED_ORIGINS=<url-frontend-staging>,<preview-urls>`
- `GEMINI_API_KEY=<staging-key>`
- `STRIPE_SECRET_KEY=<test-key>`
- `STRIPE_WEBHOOK_SECRET=<test-webhook-secret>`
- `RATE_LIMIT_MAX=500` (relaxado para QA)

#### Backend (produção)

- `NODE_ENV=production`
- `MONGODB_URI=<atlas-production>`
- `JWT_SECRET=<production-secret>`
- `JWT_REFRESH_SECRET=<production-refresh-secret>`
- `FRONTEND_URL=<url-frontend-producao>`
- `ALLOWED_ORIGINS=<url-frontend-producao>`
- `GEMINI_API_KEY=<production-key>`
- `STRIPE_SECRET_KEY=<live-key>`
- `STRIPE_WEBHOOK_SECRET=<live-webhook-secret>`
- `RATE_LIMIT_MAX=100`

#### Frontend (staging e produção)

- `VITE_API_URL=<backend-url>/api`
- `VITE_STRIPE_PUBLISHABLE_KEY=<pk_test...|pk_live...>`
- `VITE_APP_NAME=TrampoHero` (opcional)

### 3) Ajustes necessários (já cobertos no projeto)

- Configuração de CORS consolidada: `ALLOWED_ORIGINS` inclui `FRONTEND_URL` automaticamente.
- Healthcheck melhorado: resposta inclui estado do banco (`db`), ambiente e `uptimeSeconds`.
- Falhas não tratadas (`unhandledRejection` / `uncaughtException`) agora disparam shutdown gracioso.
- Handler central de erro evita vazar mensagem interna em produção (responde erro genérico para 500).

### 4) Plano de staging

1. Criar dois serviços backend separados (`trampohero-api-staging` e `trampohero-api-prod`).
2. Criar banco Atlas separado para staging (`trampohero-staging`).
3. Publicar frontend staging em preview URL (Vercel PR ou Netlify branch).
4. Ajustar `ALLOWED_ORIGINS` no backend de staging para incluir preview URLs.
5. Rodar smoke tests e QA funcional antes de promover para produção.

### 5) Plano de rollback

1. **Frontend**: reverter para o deployment anterior no painel Vercel/Netlify.
2. **Backend**: reverter para o último deploy estável no painel Render/Railway (ou re-deploy de commit anterior).
3. **Banco**: manter backup/snapshot do Atlas antes de migrações críticas.
4. **Configuração**: versionar alterações de env vars em runbook interno para restauração rápida.
5. Critério de rollback: erro crítico em autenticação, pagamentos, ou indisponibilidade persistente > 5 min.

### 6) Smoke tests pós deploy

- [ ] `GET /health` retorna `200`, `status=ok`, `db=connected`
- [ ] Login e refresh token funcionando
- [ ] Listagem de vagas (`GET /api/jobs`) sem erro CORS
- [ ] Criação de vaga (fluxo empregador) funcionando
- [ ] Geração de insight AI (`POST /api/ai/generate`) funcionando no backend
- [ ] Fluxo mínimo de pagamento/assinatura (ambiente compatível com a chave do ambiente)
- [ ] Logs sem aumento anormal de erros `5xx` nos primeiros 15 minutos

### 7) Riscos operacionais

- Cold start em planos gratuitos (Render/Railway) pode causar latência inicial.
- Falhas de CORS por divergência entre URLs de preview e `ALLOWED_ORIGINS`.
- Rotação/incorreta configuração de segredos (`JWT_*`, Stripe, Gemini) derruba fluxos críticos.
- Alterações de schema sem migração/backfill podem quebrar funcionalidades antigas.
- Falta de monitoramento ativo pode atrasar detecção de indisponibilidade.
