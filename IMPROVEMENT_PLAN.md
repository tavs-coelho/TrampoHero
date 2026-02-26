# 🛠️ Plano de Melhorias V2 — TrampoHero Pro

> **Data:** 12/02/2026  
> **Status:** Aguardando aprovação antes da implementação  
> **Contexto:** Fases 1–3 do plano anterior foram implementadas com sucesso. Este é o novo plano de melhorias focado nas próximas etapas.

---

## 📋 O Que Já Foi Feito (Plano V1)

| Fase | Status | Resumo |
|------|--------|--------|
| 1 — Qualidade de Código | ✅ Concluído | ESLint + Prettier, variável de ambiente corrigida, Vitest + 22 testes |
| 2 — Refatoração Frontend | ✅ Concluído | App.tsx: 3629→2999 linhas, 8 módulos extraídos, AppContext com useReducer |
| 3 — Backend & Integração | ✅ Concluído | 5 modelos Mongoose, rotas reais (auth, jobs, users, wallet), apiService.ts, ErrorBoundary |

---

## 🎯 Novo Plano de Melhorias (Priorizado)

### Fase 5 — Decomposição Completa do App.tsx (Impacto muito alto) ✅

App.tsx reduzido de **2999 → 563 linhas** (redução de 81%).

#### 5.1 Extrair Views Principais
- [x] `components/views/BrowseView.tsx` — Lista/mapa de vagas com filtros
- [x] `components/views/ActiveJobView.tsx` — Job em andamento com check-in/checkout
- [x] `components/views/WalletView.tsx` — Carteira, transações, saque, antecipação
- [x] `components/views/ChatView.tsx` — Suporte via chat com IA
- [x] `components/views/AcademyView.tsx` — Hero Academy, cursos e exames
- [x] `components/views/ProfileView.tsx` — Perfil do usuário, medalhas, certificados
- [x] `components/views/DashboardView.tsx` — Painel do empregador com gestão de vagas

#### 5.2 Extrair Views Secundárias
- [x] `components/views/CoinsView.tsx` — TrampoCoins e resgate
- [x] `components/views/InsuranceView.tsx` — TrampoProtect planos
- [x] `components/views/CreditView.tsx` — TrampoCredit e empréstimos
- [x] `components/views/ReferralsView.tsx` — Sistema de indicação
- [x] `components/views/AnalyticsView.tsx` — Análise de desempenho
- [x] `components/views/ChallengesView.tsx` — Desafios semanais
- [x] `components/views/RankingView.tsx` — Ranking de talentos
- [x] `components/views/StoreView.tsx` — TrampoStore e carrinho
- [x] `components/views/AdsView.tsx` — Gestão de anúncios (employer)
- [x] `components/views/TalentsView.tsx` — Listagem de talentos
- [x] `components/views/EmployerProfileView.tsx` — Perfil do empregador
- [x] `components/views/EmployerWalletView.tsx` — Carteira do empregador
- [x] `components/views/EmployerChatView.tsx` — Chat do empregador
- [x] `components/views/EmployerActiveView.tsx` — Job ativo do empregador

#### 5.3 Extrair Modais
- [x] `components/modals/CreateJobModal.tsx` — Criação de vaga manual/voz
- [x] `components/modals/PrimeModal.tsx` — Assinatura Hero Prime
- [x] `components/modals/PaymentModal.tsx` — Depósito via PIX/Cartão
- [x] `components/modals/ExamModal.tsx` — Prova de curso da Academy
- [x] `components/modals/JobDetailModal.tsx` — Detalhe de vaga + aplicação

#### 5.4 Migrar Handlers para Custom Hooks
- [x] `hooks/useToast.ts` — Estado e lógica de toast
- [x] `hooks/useJobActions.ts` — Handlers de vagas (apply, check-in, create, etc.)
- [x] `hooks/useWalletActions.ts` — Handlers de carteira (saque, antecipação, depósito)
- [x] `hooks/useCourseActions.ts` — Handlers de cursos (iniciar, exame, certificado)
- [x] `hooks/useChallengeActions.ts` — Handlers de desafios (progresso, recompensa)
- [x] `hooks/useStoreActions.ts` — Handlers de loja e indicação

---

### Fase 6 — Cobertura de Testes (Alta prioridade) ✅

Atualmente existem apenas **22 testes** (services). Nenhum componente React tem teste.

#### 6.1 Testes de Componentes
- [x] Testes para `Toast.tsx` — renderização, tipos, botão fechar (6 testes)
- [x] Testes para `SplashScreen.tsx` — renderização (2 testes)
- [x] Testes para `Header.tsx` — role switching, prime badge, navegação (7 testes)
- [x] Testes para `BottomNav.tsx` — navegação entre views, estado ativo (7 testes)
- [x] Testes para `JobCard.tsx` — renderização de dados, badge destaque, click (7 testes)
- [x] Testes para `ErrorBoundary.tsx` — captura de erros, botão retry (5 testes)
- [x] Testes para todas as 21 views — renderização e conteúdo chave (39 testes)
- [x] Testes para todos os 5 modais — renderização e interações básicas (23 testes)

#### 6.2 Testes de Hooks e Context
- [x] Testes para `AppContext.tsx` — todos 38 reducer actions, estado inicial, provider (41 testes)
- [x] Testes para `apiService.ts` — chamadas HTTP, token management, erros (32 testes)
- [x] Testes para `useToast` — estado, showToast, clearToast, auto-clear (5 testes)
- [x] Testes para `useWalletActions` — withdraw, anticipate, payment (50 testes para todos hooks)
- [x] Testes para `useCourseActions` — startCourse, exam flow, certificate
- [x] Testes para `useChallengeActions` — progress tracking, reward claiming
- [x] Testes para `useStoreActions` — checkout, referral, invoices
- [x] Testes para `useJobActions` — apply, check-in, create, manage

#### 6.3 Utilitários e Dados
- [x] Testes para `helpers.ts` — formatCurrency, formatDate (7 testes)
- [x] Testes para `constants.ts` — validação de valores e tipos (27 testes)
- [x] Mock factory compartilhado (`__tests__/testUtils.ts`)

**Resultado:** **280 testes** passando | **69.59% statements** | **72.69% lines** | **55.17% branches** ✅

**Por quê?** Sem testes em componentes, refatorações futuras podem quebrar a UI silenciosamente. Testes de integração garantem que fluxos críticos funcionam.

---

### Fase 7 — Backend Completo (Média prioridade) ✅

Todas as rotas agora usam modelos Mongoose reais. Nenhum mock data restante no backend.

#### 7.1 Modelos Faltantes
- [x] `backend/src/models/Challenge.js` — Desafios semanais com participantes e progresso
- [x] `backend/src/models/Product.js` — Produtos da TrampoStore com categorias e niches
- [x] `backend/src/models/Order.js` — Pedidos da loja com itens, total e status
- [x] `backend/src/models/Advertisement.js` — Campanhas de anúncios com targeting e analytics

#### 7.2 Atualizar Rotas Restantes
- [x] `routes/challenges.js` — GET challenges com progresso por usuário, POST progress, POST claim (com recompensas reais)
- [x] `routes/ranking.js` — Ranking calculado dinamicamente a partir de jobs completados (score = rating×100 + monthlyJobs×10 + weeklyJobs×5)
- [x] `routes/store.js` — Produtos (GET com filtros), pedidos (POST com validação de estoque, GET histórico)
- [x] `routes/ads.js` — CRUD completo, feed para freelancers (com incremento de impressões), click tracking, analytics com CTR

#### 7.3 Seeds e Fixtures
- [x] `backend/src/seeds/seed.js` — Script para popular o banco com 9 users, 3 jobs, 3 challenges, 6 products, 2 ads
- [x] Script `npm run seed` adicionado ao `backend/package.json`

**Por quê?** Metade das rotas do backend ainda retornam dados hardcoded. Para consistência, todas devem usar Mongoose.

---

### Fase 8 — UX e Acessibilidade (Média prioridade)

#### 8.1 Acessibilidade (a11y)
- [ ] Adicionar `aria-label` em todos os botões com apenas ícone
- [ ] Adicionar `role` e `aria-*` em modais e navigation
- [ ] Garantir contraste mínimo WCAG 2.1 AA em textos pequenos
- [ ] Adicionar suporte a navegação por teclado nos menus

#### 8.2 Loading States
- [ ] Criar componente `Skeleton.tsx` para loading de listas
- [ ] Adicionar loading states em chamadas ao backend (apiService)
- [ ] Adicionar indicador de "Carregando..." em views que buscam dados

#### 8.3 Responsividade
- [ ] Garantir que todas as views funcionam em telas de 320px a 1440px
- [ ] Testar e ajustar layout em modo paisagem (mobile)

**Por quê?** Acessibilidade é requisito legal (Lei 13.146/2015 no Brasil) e melhora a experiência para todos os usuários. Loading states evitam confusão do usuário ao esperar respostas do servidor.

---

### Fase 9 — Documentação e DX (Baixa prioridade)

#### 9.1 Atualizar Documentação
- [ ] Atualizar `README.md` — corrigir instrução de env var (`API_KEY` → `GEMINI_API_KEY`)
- [ ] Documentar nova estrutura de componentes no `DEVELOPER_GUIDE.md`
- [ ] Adicionar guia de contribuição para novos devs (`CONTRIBUTING.md` — atualizar)

#### 9.2 Storybook
- [ ] Configurar Storybook para visualização isolada de componentes
- [ ] Criar stories para Toast, Header, BottomNav, JobCard, ErrorBoundary

#### 9.3 TypeScript Strict
- [ ] Habilitar `strict: true` no `tsconfig.json`
- [ ] Corrigir erros de tipagem resultantes
- [ ] Adicionar tipos explícitos em handlers que usam `any`

**Por quê?** Documentação atualizada e ferramentas como Storybook aceleram o onboarding de novos desenvolvedores. TypeScript strict previne bugs em tempo de compilação.

---

## 📊 Estimativa de Impacto

| Fase | Esforço | Risco | Impacto | Prioridade |
|------|---------|-------|---------|------------|
| 5 — Decomposição App.tsx | Alto | Médio | Muito Alto | 🔴 Crítica |
| 6 — Cobertura de Testes | Médio | Baixo | Alto | 🟠 Alta |
| 7 — Backend Completo | Médio | Baixo | Médio | 🟡 Média |
| 8 — UX e Acessibilidade | Médio | Baixo | Alto | 🟡 Média |
| 9 — Documentação e DX | Baixo | Baixo | Médio | 🟢 Baixa |

---

## 🚦 Próximos Passos

**Aguardando aprovação do plano.** Após aprovação, a implementação seguirá a ordem das fases (5 → 6 → 7 → 8 → 9), com commits incrementais e validação a cada etapa.

### Perguntas para o Autor:
1. **Deseja implementar todas as fases ou apenas algumas?**
2. **Há prioridade em alguma fase específica?**
3. **Deseja incluir testes E2E (Playwright/Cypress) ou apenas unitários/de componente?**
4. **Tem interesse em Storybook para documentação de componentes?**

---

> 💡 *Este plano foi elaborado com base na análise do estado atual após as Fases 1–3. Nenhuma implementação será feita antes da aprovação.*
