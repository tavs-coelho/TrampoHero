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

### Fase 5 — Decomposição Completa do App.tsx (Impacto muito alto)

O `App.tsx` ainda tem **2999 linhas** com 30+ handlers e 18 view sections inline. Precisa ser decomposto em componentes de view individuais.

#### 5.1 Extrair Views Principais
- [ ] `components/views/BrowseView.tsx` — Lista/mapa de vagas com filtros
- [ ] `components/views/ActiveJobView.tsx` — Job em andamento com check-in/checkout
- [ ] `components/views/WalletView.tsx` — Carteira, transações, saque, antecipação
- [ ] `components/views/ChatView.tsx` — Suporte via chat com IA
- [ ] `components/views/AcademyView.tsx` — Hero Academy, cursos e exames
- [ ] `components/views/ProfileView.tsx` — Perfil do usuário, medalhas, certificados
- [ ] `components/views/DashboardView.tsx` — Painel do empregador com gestão de vagas

**Impacto:** App.tsx deve cair de 2999 para ~500 linhas (roteamento + estado principal)

#### 5.2 Extrair Views Secundárias
- [ ] `components/views/CoinsView.tsx` — TrampoCoins e resgate
- [ ] `components/views/InsuranceView.tsx` — TrampoProtect planos
- [ ] `components/views/CreditView.tsx` — TrampoCredit e empréstimos
- [ ] `components/views/ReferralsView.tsx` — Sistema de indicação
- [ ] `components/views/AnalyticsView.tsx` — Análise de desempenho
- [ ] `components/views/ChallengesView.tsx` — Desafios semanais
- [ ] `components/views/RankingView.tsx` — Ranking de talentos
- [ ] `components/views/StoreView.tsx` — TrampoStore e carrinho
- [ ] `components/views/AdsView.tsx` — Gestão de anúncios (employer)
- [ ] `components/views/TalentsView.tsx` — Listagem de talentos

#### 5.3 Extrair Modais
- [ ] `components/modals/CreateJobModal.tsx` — Criação de vaga manual/voz
- [ ] `components/modals/PrimeModal.tsx` — Assinatura Hero Prime
- [ ] `components/modals/PaymentModal.tsx` — Depósito via PIX/Cartão
- [ ] `components/modals/ExamModal.tsx` — Prova de curso da Academy
- [ ] `components/modals/JobDetailModal.tsx` — Detalhe de vaga + aplicação

#### 5.4 Migrar Estado para AppContext
- [ ] Mover todos os `useState` do App.tsx para `useAppContext()`
- [ ] Mover handlers para hooks customizados (`useJobActions`, `useWalletActions`, `useCourseActions`)
- [ ] Remover prop drilling — componentes acessam estado via context

**Por quê?** App.tsx com 2999 linhas continua inviável para manutenção. Cada view deve ser um arquivo independente, testável isoladamente.

---

### Fase 6 — Cobertura de Testes (Alta prioridade)

Atualmente existem apenas **22 testes** (services). Nenhum componente React tem teste.

#### 6.1 Testes de Componentes
- [ ] Testes para `Toast.tsx` — renderização, tipos, botão fechar
- [ ] Testes para `SplashScreen.tsx` — renderização
- [ ] Testes para `Header.tsx` — role switching, prime badge, navegação
- [ ] Testes para `BottomNav.tsx` — navegação entre views, estado ativo
- [ ] Testes para `JobCard.tsx` — renderização de dados, badge destaque, click
- [ ] Testes para `ErrorBoundary.tsx` — captura de erros, botão retry

#### 6.2 Testes de Hooks e Context
- [ ] Testes para `AppContext.tsx` — reducer actions, estado inicial, provider
- [ ] Testes para `apiService.ts` — chamadas HTTP, token management, erros

#### 6.3 Testes de Integração
- [ ] Testes E2E básicos com Playwright ou Cypress (fluxo principal: browse → apply → active)
- [ ] Teste de fluxo de pagamento (wallet → deposit → withdraw)

**Meta:** Atingir **60%+ de cobertura** de código

**Por quê?** Sem testes em componentes, refatorações futuras podem quebrar a UI silenciosamente. Testes de integração garantem que fluxos críticos funcionam.

---

### Fase 7 — Backend Completo (Média prioridade)

4 rotas ainda usam mock data: `challenges.js`, `ranking.js`, `store.js`, `ads.js`

#### 7.1 Modelos Faltantes
- [ ] `backend/src/models/Challenge.js` — Desafios semanais
- [ ] `backend/src/models/Product.js` — Produtos da TrampoStore
- [ ] `backend/src/models/Order.js` — Pedidos da loja
- [ ] `backend/src/models/Advertisement.js` — Campanhas de anúncios

#### 7.2 Atualizar Rotas Restantes
- [ ] `routes/challenges.js` — CRUD com modelo Challenge, progresso por usuário
- [ ] `routes/ranking.js` — Ranking calculado a partir de jobs completados
- [ ] `routes/store.js` — Produtos e pedidos com modelos reais
- [ ] `routes/ads.js` — Campanhas de anúncios com modelo Advertisement

#### 7.3 Seeds e Fixtures
- [ ] Criar `backend/src/seeds/seed.js` — Script para popular o banco com dados iniciais
- [ ] Migrar dados de `data/mockData.ts` para seed script

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
