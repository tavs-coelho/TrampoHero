# 🛠️ Plano de Melhorias — TrampoHero Pro

> **Data:** 12/02/2026  
> **Status:** Aguardando aprovação antes da implementação  
> **Objetivo:** Melhorias práticas e incrementais para levar o projeto ao próximo nível de qualidade e funcionalidade.

---

## 📋 Resumo da Análise Atual

O TrampoHero Pro é uma plataforma promissora para o mercado de trabalho temporário no Brasil, com **documentação excelente**, **tipagem TypeScript abrangente** e um **conjunto amplo de funcionalidades no frontend**. No entanto, existem pontos críticos que precisam ser resolvidos para que o projeto possa evoluir de forma sustentável.

### ✅ Pontos Fortes
- Documentação completa (5 arquivos markdown)
- Tipagem TypeScript bem definida (`types.ts` com 425 linhas)
- Funcionalidades ricas no frontend (wallet, gamificação, cursos, etc.)
- Backend com boas práticas de segurança (Helmet, bcrypt, rate limiting)
- Estratégia de monetização bem pensada

### ⚠️ Pontos Críticos Identificados
- `App.tsx` monolítico com ~1542 linhas
- Zero testes automatizados
- Sem linting/formatação configurados
- Backend com rotas mock (sem integração real com MongoDB)
- Inconsistência na variável de ambiente da API Key do Gemini
- Sem CI/CD configurado

---

## 🎯 Plano de Melhorias (Priorizado)

### Fase 1 — Qualidade de Código (Impacto imediato, baixo risco)

#### 1.1 Configuração de Linting e Formatação
- [x] Adicionar ESLint com regras para React + TypeScript
- [x] Adicionar Prettier para formatação consistente
- [x] Adicionar scripts `lint` e `format` no `package.json`

**Por quê?** Garante consistência no código e previne bugs comuns. É a base para todo o resto.

#### 1.2 Correção da Variável de Ambiente
- [x] Unificar o uso de `GEMINI_API_KEY` vs `API_KEY` em `vite.config.ts` e `services/geminiService.ts`
- [x] Atualizar `.env.example` na raiz se necessário

**Por quê?** Bug funcional — a integração com Gemini AI pode falhar silenciosamente.

#### 1.3 Configuração de Testes
- [x] Instalar Vitest + @testing-library/react + jsdom
- [x] Configurar `vitest.config.ts`
- [x] Adicionar scripts `test` e `test:coverage` no `package.json`
- [x] Criar testes iniciais para `services/geminiService.ts` e `services/pdfService.ts`

**Por quê?** Sem testes, qualquer refatoração futura é arriscada.

---

### Fase 2 — Refatoração do Frontend (Alta prioridade)

#### 2.1 Decomposição do `App.tsx`
Extrair componentes lógicos do arquivo monolítico:

- [x] `data/constants.ts` — Constantes de monetização e configuração
- [x] `data/mockData.ts` — Dados mockados (medalhas, cursos, vagas, etc.)
- [x] `utils/helpers.ts` — Funções utilitárias (formatCurrency, formatDate)
- [x] `components/Toast.tsx` — Componente de notificação
- [x] `components/SplashScreen.tsx` — Tela de splash
- [x] `components/Header.tsx` — Navegação e perfil do usuário
- [x] `components/BottomNav.tsx` — Barra de navegação inferior
- [x] `components/JobCard.tsx` — Card individual de vaga

**Por quê?** Um arquivo de 3629 linhas é muito difícil de manter, debugar e revisar. A decomposição é essencial para a saúde do projeto.

#### 2.2 Gerenciamento de Estado
- [x] Criar `contexts/AppContext.tsx` com `useReducer` para estado centralizado
- [x] Integrar AppProvider no `index.tsx`
- [ ] Migrar App.tsx para usar `useAppContext()` (futuro — quando mais componentes precisarem de estado compartilhado)

**Por quê?** O estado atual está todo concentrado em `App.tsx` com muitos `useState` interdependentes. `useReducer` dará mais previsibilidade.

---

### Fase 3 — Backend e Integração (Média prioridade)

#### 3.1 Modelos do MongoDB
- [ ] Criar `backend/src/models/User.js` (Mongoose schema)
- [ ] Criar `backend/src/models/Job.js`
- [ ] Criar `backend/src/models/Transaction.js`
- [ ] Criar `backend/src/models/Course.js`
- [ ] Criar `backend/src/models/Certificate.js`

**Por quê?** O backend não tem modelos de dados. As rotas existentes retornam dados mock. Sem modelos, não há persistência real.

#### 3.2 Integração Frontend ↔ Backend
- [ ] Criar `services/apiService.ts` — camada de abstração para chamadas HTTP
- [ ] Implementar endpoints reais de autenticação (login/registro)
- [ ] Conectar listagem de vagas ao backend
- [ ] Conectar wallet/transações ao backend

**Por quê?** Atualmente o frontend funciona 100% com dados mock/hardcoded. Para ser um produto real, precisa de persistência.

#### 3.3 Tratamento de Erros
- [ ] Criar componente `ErrorBoundary` para erros React
- [ ] Padronizar respostas de erro no backend (formato consistente)
- [ ] Adicionar tratamento de erros de rede no frontend (loading states, retry logic)

**Por quê?** Erros não tratados resultam em tela branca para o usuário. Error boundaries e feedback visual são essenciais para UX.

---

### Fase 4 — DevOps e Infraestrutura (Baixa prioridade, alto impacto a longo prazo)

#### 4.1 CI/CD com GitHub Actions
- [ ] Criar `.github/workflows/ci.yml` — Lint + Build + Test em PRs
- [ ] Criar `.github/workflows/deploy.yml` — Deploy automático (Vercel/Netlify)

**Por quê?** Automação previne regressões e garante que o código sempre compila e passa nos testes.

#### 4.2 Logging e Monitoramento
- [ ] Adicionar Morgan para logs HTTP no backend
- [ ] Adicionar Winston para logging estruturado

**Por quê?** Sem logs, é impossível diagnosticar problemas em produção.

---

## 📊 Estimativa de Impacto

| Fase | Esforço | Risco | Impacto | Prioridade |
|------|---------|-------|---------|------------|
| 1 — Qualidade de Código | Baixo | Baixo | Alto | 🔴 Crítica |
| 2 — Refatoração Frontend | Médio | Médio | Muito Alto | 🟠 Alta |
| 3 — Backend & Integração | Alto | Médio | Muito Alto | 🟡 Média |
| 4 — DevOps & Infra | Baixo | Baixo | Alto | 🟢 Baixa |

---

## 🚦 Próximos Passos

**Aguardando aprovação do plano.** Após aprovação, a implementação seguirá a ordem das fases (1 → 2 → 3 → 4), com commits incrementais e validação a cada etapa.

### Perguntas para o Autor:
1. **Deseja implementar todas as fases ou apenas algumas?**
2. **Há preferência por começar pelo backend ou frontend?**
3. **Qual é o framework de testes preferido?** (Vitest é a recomendação, mas Jest também é opção)
4. **Pretende usar Mongoose (ODM) ou o driver nativo do MongoDB?**
5. **Há interesse em adicionar Tailwind CSS para estilização dos componentes?**

---

> 💡 *Este plano foi elaborado com base na análise completa do repositório. Nenhuma implementação será feita antes da aprovação.*
