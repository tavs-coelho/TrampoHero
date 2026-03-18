# 🔍 TrampoHero — Auditoria Técnica Completa

> **Data:** Março 2026  
> **Escopo:** Frontend (React 19), Backend (Node.js/Express/MongoDB), Mobile (React Native/Expo)  
> **Método:** Análise estática do código-fonte, mapeamento de fluxos, comparação frontend ↔ backend

---

## 📋 Resumo Executivo

O TrampoHero é um marketplace de trabalhos temporários (gig economy) para o mercado brasileiro, com três camadas: **frontend web** (React 19), **backend API** (Express + MongoDB) e **app mobile** (React Native/Expo). A plataforma possui uma infraestrutura backend sólida e bem estruturada, integrando Stripe, Azure e Google Gemini AI. Porém, o **frontend opera majoritariamente com dados fictícios (mock)** e não persiste as ações críticas no banco de dados.

### Diagnóstico Geral

| Camada | Status | Observação |
|--------|--------|-----------|
| **Backend** | ✅ Pronto (85%) | MongoDB, Stripe, JWT, Azure bem implementados |
| **Frontend Web** | ⚠️ Parcial (40%) | Dados mock, hooks sem chamadas de API reais |
| **App Mobile** | ⚠️ Parcial (55%) | Estrutura presente, integração incompleta |
| **Integração F/B** | 🔴 Crítico | Operações principais não persistem no banco |

### Risco para Produção: 🔴 ALTO

O maior risco é que a aplicação parece funcionar completamente sem backend. Candidaturas, criação de vagas, saques e depósitos são simulados localmente via `setTimeout`, sem nenhuma persistência real. Um usuário pode interagir com toda a plataforma sem que nenhuma ação seja salva no banco de dados.

---

## 📊 Tabela de Gaps

### Autenticação e Sessão

| Funcionalidade | Status | Problema | Risco |
|---------------|--------|---------|-------|
| Registro de usuário | ✅ Pronto | — | — |
| Login com JWT | ✅ Pronto | — | — |
| Logout | ✅ Pronto | — | — |
| Validação de token ao iniciar o app | 🔴 Faltando | `App.tsx` carrega usuário do `localStorage` sem verificar se o token ainda é válido no servidor | Alto |
| Persistência de sessão entre abas | ⚠️ Parcial | Baseada em `localStorage`; sem refresh token | Médio |
| Expiração automática de sessão | 🔴 Faltando | Token expirado não redireciona para login | Alto |

### Vagas (Jobs)

| Funcionalidade | Status | Problema | Risco |
|---------------|--------|---------|-------|
| Listar vagas abertas | ⚠️ Parcial | App inicia com `INITIAL_JOBS` (mock), **sem chamar** `GET /api/jobs` | Alto |
| Criar vaga (empregador) | 🔴 Faltando | `handleCreateJob` atualiza apenas estado local; nunca chama `POST /api/jobs` | Alto |
| Candidatar-se a vaga | 🔴 Faltando | `handleApply` atualiza apenas estado local; nunca chama `POST /api/jobs/:id/apply` | Alto |
| Check-in com GPS | ⚠️ Parcial | Frontend simula GPS com `setTimeout`; backend possui endpoint `POST /api/jobs/:id/checkin` implementado, mas não é chamado | Alto |
| Check-out / conclusão | 🔴 Faltando | `handleCheckout` atualiza apenas estado local; não existe endpoint de checkout para freelancer no backend | Alto |
| Aprovação de candidato | 🔴 Faltando | `handleApproveCandidate` debita localmente; não chama backend para criar escrow real | Alto |
| Encerrar vaga | ⚠️ Parcial | `handleCloseJob` atualiza estado local; não chama `PUT /api/jobs/:id` | Médio |
| Compartilhar vaga | ✅ Pronto | Usa `navigator.share` / clipboard corretamente | — |
| Filtro de vagas | ⚠️ Parcial | Filtra apenas dados locais (mock); filtros não são enviados ao backend | Médio |
| Geolocalização no mapa | ✅ Pronto | Leaflet integrado com coordenadas das vagas | — |
| Upload de foto-prova | ⚠️ Parcial | Backend gera SAS URL para Azure; frontend não implementa o upload real | Alto |
| Contrato digital (PDF) | ⚠️ Parcial | Backend gera PDF via `POST /api/jobs/:id/complete`; frontend gera localmente via `jsPDF` sem conectar | Médio |

### Carteira e Pagamentos

| Funcionalidade | Status | Problema | Risco |
|---------------|--------|---------|-------|
| Saldo da carteira | ⚠️ Parcial | Exibe saldo do mock (`INITIAL_USER`); não chama `GET /api/wallet/balance` | Alto |
| Histórico de transações | ⚠️ Parcial | Transações ficam apenas em estado local | Alto |
| Depósito via PIX | 🔴 Faltando | `handleProcessPayment` usa `setTimeout` de 2s para simular; não chama `POST /api/wallet/deposit` | Alto |
| Depósito via Cartão (Stripe) | ⚠️ Parcial | `PaymentModal` tem integração Stripe Elements para cartão, mas o webhook Stripe não atualiza o frontend | Médio |
| Saque PIX | 🔴 Faltando | `handleWithdraw` usa `setTimeout`; não chama `POST /api/wallet/withdraw` | Alto |
| Antecipação Hero Pay | 🔴 Faltando | Taxa calculada com `Math.random()` no frontend; sem endpoint de antecipação no backend | Alto |
| Escrow de pagamento | ⚠️ Parcial | Backend implementado (`POST /api/payments/escrow`); frontend não chama este endpoint | Alto |
| Hero Prime (assinatura) | ⚠️ Parcial | Backend com Stripe Checkout implementado; frontend apenas atualiza estado local sem redirecionar para Stripe | Alto |
| Webhook Stripe | ✅ Pronto | Backend valida assinatura e processa eventos corretamente | — |

### Usuário e Perfil

| Funcionalidade | Status | Problema | Risco |
|---------------|--------|---------|-------|
| Exibir perfil | ⚠️ Parcial | Exibe dados do `INITIAL_USER` (mock); não sincroniza com `GET /api/users/profile` | Médio |
| Editar perfil | 🔴 Faltando | `PUT /api/users/profile` existe no backend; frontend não chama | Médio |
| KYC (verificação de identidade) | ⚠️ Parcial | Backend e frontend existem; integração não testada em produção | Alto |
| Avaliações/reviews | ⚠️ Parcial | `ReviewFormModal` presente; endpoint `/api/reviews` existe; conexão incompleta | Médio |
| Sistema de medalhas | ⚠️ Parcial | Medalhas são mock; sem persistência no banco | Baixo |
| TrampoCoins | ⚠️ Parcial | Lógica no frontend; sem persistência backend | Médio |
| Código de indicação | ⚠️ Parcial | Backend verifica e credita; frontend gera localmente | Médio |

### Funcionalidades Premium

| Funcionalidade | Status | Problema | Risco |
|---------------|--------|---------|-------|
| Hero Academy (cursos) | ⚠️ Parcial | Cursos são 100% mock (`COURSES` em `mockData.ts`); sem endpoint `GET /api/courses` funcional | Médio |
| Exame e certificados | ⚠️ Parcial | Lógica de exame funciona; certificado gerado localmente; não persiste no banco | Médio |
| Desafios semanais | ⚠️ Parcial | Mock; backend com `/api/challenges` existe mas não é chamado | Médio |
| Ranking de talentos | ⚠️ Parcial | Mock; backend com `/api/ranking` existe mas não é chamado | Baixo |
| Loja (TrampoStore) | ⚠️ Parcial | Produtos mock; `POST /api/store/orders` existe mas não é chamado pelo `useStoreActions` | Médio |
| Anúncios premium (Ads) | ⚠️ Parcial | Mock; backend com `/api/ads` existe | Baixo |
| Seguro herói | 🔴 Faltando | UI presente; sem backend implementado | Médio |
| Crédito herói | 🔴 Faltando | UI presente; sem backend implementado | Alto |
| Chat em tempo real | ⚠️ Parcial | Backend com Azure Web PubSub; frontend usa mensagens locais | Alto |
| Push notifications | ⚠️ Parcial | Azure Notification Hubs configurado no backend; frontend não registra device token | Médio |
| Analytics (dashboard) | ⚠️ Parcial | Backend com `/api/analytics` implementado; frontend exibe dados mock | Baixo |

### Segurança

| Funcionalidade | Status | Problema | Risco |
|---------------|--------|---------|-------|
| Autenticação JWT (backend) | ✅ Pronto | Middleware `authenticate` e `authorize` funcionam | — |
| Rate limiting | ✅ Pronto | 15min / configurable max | — |
| CORS com allowlist | ✅ Pronto | Valida origem dinamicamente | — |
| Helmet (HTTP headers) | ✅ Pronto | Aplicado globalmente | — |
| Senha com bcrypt | ✅ Pronto | Hash no pre-save hook | — |
| Webhook Stripe assinado | ✅ Pronto | `constructWebhookEvent` valida assinatura | — |
| GEMINI_API_KEY exposta no frontend | 🔴 Risco | `VITE_GEMINI_API_KEY` no `.env.example` — a chave de IA **não deve estar no frontend** | Alto |
| Validação mínima de senha (6 chars) | ⚠️ Parcial | Recomendado mínimo 8 caracteres | Baixo |
| `JWT_SECRET` sem fallback | ⚠️ Parcial | Em `auth.js` usa `process.env.JWT_SECRET` sem checagem — já protegido pelo módulo `env.js` | Baixo |
| SAS URL mock em produção | ⚠️ Parcial | `jobs.js` retorna URL mock se Azure não configurado; risco se chegasse a produção sem Azure | Médio |

---

## 🎯 Backlog por Prioridade

### 🔴 P0 — Blockers de Produção (Crítico)

1. **[BUG] `handleApply` não persiste candidatura no banco**  
   *Arquivo:* `hooks/useJobActions.ts` → chamar `apiService.applyToJob(job.id)`

2. **[BUG] `handleCreateJob` não persiste vaga no banco**  
   *Arquivo:* `hooks/useJobActions.ts` → chamar `apiService.createJob(...)`

3. **[BUG] `handleWithdraw` usa `setTimeout` fake**  
   *Arquivo:* `hooks/useWalletActions.ts` → chamar `apiService.withdraw(amount, pixKey)`

4. **[BUG] `handleProcessPayment` (PIX) usa `setTimeout` fake**  
   *Arquivo:* `hooks/useWalletActions.ts` → chamar `apiService.deposit(amount, 'pix')`

5. **[BUG] App inicia com vagas mock — nunca busca da API**  
   *Arquivo:* `App.tsx` → adicionar `useEffect` para chamar `apiService.getJobs()`

6. **[BUG] Token JWT não é validado ao abrir o app**  
   *Arquivo:* `App.tsx` → chamar `apiService.getProfile()` na inicialização; redirecionar para login se falhar

7. **[SEGURANÇA] `VITE_GEMINI_API_KEY` exposta no `.env.example` do frontend**  
   *Ação:* Remover variável do frontend; usar proxy via backend `/api/ai`

8. **[BUG] `handleApproveCandidate` debita saldo local sem criar escrow real**  
   *Arquivo:* `hooks/useJobActions.ts` → chamar `apiService.createEscrow(jobId)`

9. **[BUG] Check-in GPS não chama `POST /api/jobs/:id/checkin`**  
   *Arquivo:* `hooks/useJobActions.ts` → chamar `apiService.checkIn(jobId, lat, lng)`; adicionar método em `apiService.ts`

10. **[BUG] Hero Prime assinatura apenas atualiza estado local**  
    *Arquivo:* `App.tsx` → `handleSubscribePrime` deve redirecionar para Stripe Checkout via `POST /api/payments/subscription`

### 🟡 P1 — Alta Prioridade (Sprint 1)

11. **Saldo da carteira não sincroniza com backend**  
    *Arquivo:* `App.tsx` → buscar `GET /api/wallet/balance` no mount (quando logado)

12. **Freelancer não tem endpoint de check-out**  
    *Ação:* Criar `POST /api/jobs/:id/checkout` no backend; chamar do frontend

13. **Hero Pay (antecipação) sem backend**  
    *Ação:* Criar endpoint `POST /api/wallet/anticipate`; remover `Math.random()` da taxa

14. **Cursos são 100% mock**  
    *Ação:* Popular coleção `Course` via seed; servir via `GET /api/courses`; frontend consome API

15. **Exames e certificados não persistem**  
    *Ação:* Criar `POST /api/courses/:id/complete`; salvar `Certificate` no banco

16. **Desafios semanais não sincronizam**  
    *Arquivo:* `App.tsx` → buscar `GET /api/challenges` no mount

17. **Ranking não sincroniza**  
    *Arquivo:* `App.tsx` → buscar `GET /api/ranking` no mount

18. **Loja: compras não persistem**  
    *Arquivo:* `hooks/useStoreActions.ts` → chamar `apiService.createOrder(cart)`

### 🟢 P2 — Médio Prazo (Sprint 2–3)

19. **TrampoCoins sem persistência**  
    *Ação:* Adicionar campo `trampoCoins` ao modelo `User`; sincronizar via API

20. **Seguro Herói sem backend**  
    *Ação:* Criar modelo e rotas de seguro; integrar com subscriptions

21. **Crédito Herói sem backend**  
    *Ação:* Definir produto financeiro; parceria ou backend interno

22. **Upload de foto-prova não funciona**  
    *Ação:* Frontend deve requisitar SAS URL (`POST /api/jobs/upload-sas`) e fazer PUT direto ao Azure

23. **Push notifications não registra device token**  
    *Arquivo:* `App.tsx` → chamar `POST /api/users/push-device` com token Expo

24. **Chat em tempo real com Azure Web PubSub**  
    *Ação:* Frontend deve conectar via token de `GET /api/jobs/:id/chat-token`

25. **Mensagens de chat não persistem no banco**  
    *Ação:* Criar modelo `Message`; endpoint `POST /api/jobs/:id/messages`

26. **Analytics exibe dados mock**  
    *Arquivo:* `components/views/AnalyticsView.tsx` → consumir `GET /api/analytics`

27. **Perfil do usuário não sincroniza**  
    *Ação:* Editar perfil deve chamar `PUT /api/users/profile`

28. **Avaliações/reviews incompletas**  
    *Ação:* Finalizar conexão de `ReviewFormModal` com `POST /api/reviews`

### 🔵 P3 — Baixo Risco / Melhorias (Sprint 4+)

29. Offline mode explícito com indicador visual  
30. Refresh token para sessões longas  
31. Produtos da loja populados via seed no banco  
32. Anúncios (Ads) consumidos via API  
33. Medalhas persistidas no banco do usuário  
34. Indicadores de "mock mode" para dev/staging  
35. Cobertura de testes end-to-end (Playwright/Cypress)  
36. Dashboard de métricas de negócio em tempo real  

---

## 🚨 Top 10 Blockers para Produção

| # | Blocker | Impacto | Severidade |
|---|---------|---------|-----------|
| 1 | Candidaturas de vagas não persistem (handleApply sem API) | Nenhum trabalho é atribuído no banco | 🔴 Crítico |
| 2 | Criação de vagas não persiste (handleCreateJob sem API) | Vagas criadas desaparecem ao recarregar | 🔴 Crítico |
| 3 | Saques PIX simulados (setTimeout fake) | Usuário acredita ter sacado, mas dinheiro não sai | 🔴 Crítico |
| 4 | Depósito PIX simulado (setTimeout fake) | Saldo creditado sem processamento real | 🔴 Crítico |
| 5 | App não valida JWT ao iniciar | Token expirado passa sem reautenticação | 🔴 Crítico |
| 6 | Vagas carregam de mock local, não da API | Dois usuários nunca veem as mesmas vagas | 🔴 Crítico |
| 7 | Aprovação de candidato sem escrow real | Pagamento não garantido ao freelancer | 🔴 Crítico |
| 8 | GEMINI_API_KEY no .env do frontend | Chave de IA exposta e pode ser abusada | 🔴 Crítico |
| 9 | Hero Prime ativa localmente sem Stripe | Usuário obtém benefícios sem pagar | 🔴 Crítico |
| 10 | Check-in GPS não chama backend | Nenhuma prova de trabalho persiste | 🟠 Alto |

---

## ⚡ Quick Wins (< 1 dia cada)

1. **Remover `VITE_GEMINI_API_KEY` do `.env.example` do frontend** — segurança imediata  
2. **Adicionar `useEffect` em `App.tsx` para carregar vagas da API** — 15 linhas de código  
3. **Adicionar `useEffect` em `App.tsx` para validar JWT** — chama `getProfile()`, redireciona se falhar  
4. **Wiring de `handleApply` → `apiService.applyToJob()`** — substituição cirúrgica em `useJobActions.ts`  
5. **Wiring de `handleWithdraw` → `apiService.withdraw()`** — substituição em `useWalletActions.ts`  
6. **Wiring de `handleProcessPayment` (PIX) → `apiService.deposit()`** — substituição em `useWalletActions.ts`  
7. **Wiring de `handleCreateJob` → `apiService.createJob()`** — substituição em `useJobActions.ts`  
8. **Adicionar método `checkIn()` em `apiService.ts`** — 8 linhas de código  

---

## 🗺️ Próximos 7 Passos Concretos

### Passo 1 — Conectar vagas à API real (App.tsx)
Adicionar `useEffect` que chama `apiService.getJobs()` ao montar o componente, substituindo o estado inicial `INITIAL_JOBS`. Adicionar validação de JWT chamando `apiService.getProfile()` na mesma inicialização; se falhar, limpar localStorage e mostrar tela de login.

**Arquivo:** `App.tsx`  
**Esforço:** 2 horas

---

### Passo 2 — Conectar candidatura à API (useJobActions)
Em `handleApply`, substituir a atualização direta de estado por uma chamada `await apiService.applyToJob(job.id)`. Atualizar estado somente se a resposta for bem-sucedida. Em caso de erro, exibir toast de falha.

**Arquivo:** `hooks/useJobActions.ts`  
**Esforço:** 1 hora

---

### Passo 3 — Conectar criação de vaga à API (useJobActions)
Em `handleCreateJob`, substituir `setJobs(prev => [newJob, ...prev])` por chamada `await apiService.createJob(jobData)`. Usar os dados retornados pela API (incluindo ID real gerado pelo MongoDB) para atualizar o estado local.

**Arquivo:** `hooks/useJobActions.ts`  
**Esforço:** 2 horas

---

### Passo 4 — Conectar saques e depósitos à API (useWalletActions)
- `handleWithdraw`: chamar `apiService.withdraw(amountToWithdraw, pixKey)` substituindo o `setTimeout`
- `handleProcessPayment` (PIX): chamar `apiService.deposit(amount, 'pix')` substituindo o `setTimeout`
- Remover lógica de taxa calculada com `Math.random()`; usar taxa retornada pelo servidor

**Arquivo:** `hooks/useWalletActions.ts`  
**Esforço:** 2 horas

---

### Passo 5 — Adicionar check-in real com GPS (apiService + useJobActions)
Criar método `checkIn(jobId, latitude, longitude, timestamp)` em `apiService.ts` que chama `POST /api/jobs/:id/checkin`. Atualizar `handleCheckIn` para usar `navigator.geolocation.getCurrentPosition` de forma real (não simulada) e chamar o novo método.

**Arquivo:** `services/apiService.ts`, `hooks/useJobActions.ts`  
**Esforço:** 3 horas

---

### Passo 6 — Criar endpoint de checkout para freelancer (backend)
O backend só tem `POST /api/jobs/:id/complete` para empregador. Criar `POST /api/jobs/:id/checkout` para que o freelancer possa registrar a saída do trabalho (muda status para `waiting_approval`). Conectar `handleCheckout` do frontend a este novo endpoint.

**Arquivo:** `backend/src/routes/jobs.js`, `services/apiService.ts`, `hooks/useJobActions.ts`  
**Esforço:** 4 horas

---

### Passo 7 — Remover GEMINI_API_KEY do frontend e usar proxy backend
1. Remover `VITE_GEMINI_API_KEY` do `.env.example` e `services/env.ts`
2. Garantir que `geminiService.ts` chame `/api/ai/*` (proxy backend) em vez de Gemini direto
3. O backend já tem `/api/ai` com a chave protegida no servidor

**Arquivo:** `.env.example`, `services/geminiService.ts`, `services/env.ts`  
**Esforço:** 1 hora

---

## 📌 Apêndice — Inventário Completo de Arquivos Mock

| Arquivo | Dados Mock | Impacto |
|---------|-----------|---------|
| `data/mockData.ts` | INITIAL_USER, INITIAL_JOBS (20+ vagas), WEEKLY_CHALLENGES, TALENT_RANKINGS, STORE_PRODUCTS, ADVERTISEMENTS, COURSES (8+), MEDALS_REPO | Todo estado inicial da aplicação |
| `App.tsx` L36 | `useState<Job[]>(INITIAL_JOBS)` | Vagas nunca carregadas da API |
| `App.tsx` L31-34 | Usuário do localStorage sem validação de token | Sessão inválida não detectada |
| `App.tsx` L84-88 | challenges, rankings, products, ads todos de mock | Dados nunca sincronizados |
| `hooks/useJobActions.ts` L51 | `setJobs(prev => ...)` local only | Candidaturas não persistem |
| `hooks/useJobActions.ts` L171 | `setJobs(prev => [newJob, ...prev])` local only | Vagas não persistem |
| `hooks/useJobActions.ts` L65-69 | `setTimeout` simulando GPS | Check-in falso |
| `hooks/useWalletActions.ts` L47-62 | `setTimeout` simulando saque PIX | Saque falso |
| `hooks/useWalletActions.ts` L114-136 | `setTimeout` simulando depósito PIX | Depósito falso |
| `hooks/useWalletActions.ts` L67 | `Math.random()` para taxa de antecipação | Taxa não determinística |
| `hooks/useJobActions.ts` L162 | `location: 'São Paulo, SP'` hardcoded | Localização falsa em vagas criadas |
| `App.tsx` L166-170 | `handleSubscribePrime` só atualiza estado | Prime grátis sem pagamento |

---

*Auditoria gerada em Março 2026. Para atualizar, re-executar análise após cada sprint.*
