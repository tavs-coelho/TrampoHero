# TrampoHero — Plano de Growth + SEO (Web)

## 1) Estrutura de landing pages
- `/` — Landing principal com proposta de valor dupla (Empresa + Freelancer), prova social e CTA segmentada.
- `/para-freelancers` — Benefícios, como funciona, segurança de pagamento, CTA de cadastro.
- `/para-empresas` — Publicação de vagas, velocidade de contratação, qualidade dos talentos, CTA de criação de vaga.
- `/categorias/:categoria` — Páginas por nicho (gastronomia, construção, eventos, serviços gerais).
- `/cidades/:cidade` — Páginas locais para captação orgânica e intenção regional.
- `/blog` — Hub de conteúdo para aquisição TOFU/MOFU.

## 2) SEO técnico (baseline implementado + próximos passos)
### Implementado nesta entrega
- Canonical, robots meta, Open Graph e Twitter cards no `index.html`.
- Dados estruturados (JSON-LD) para `WebSite` e `Organization`.
- `public/robots.txt` e `public/sitemap.xml` com URLs estratégicas iniciais.
- Metadata dinâmica por view via `utils/seo.ts`.

### Próximos passos
- Adicionar Search Console + Bing Webmaster.
- Publicar OG image dedicada (1200x630) em vez do ícone PWA.
- Evoluir para rotas públicas SSR/SSG para indexação profunda.

## 3) Páginas indexáveis (prioridade inicial)
1. `/`
2. `/para-freelancers`
3. `/para-empresas`
4. `/categorias/gastronomia`
5. `/categorias/construcao`
6. `/categorias/eventos`
7. `/categorias/servicos-gerais`
8. `/cidades/sao-paulo-sp`
9. `/cidades/rio-de-janeiro-rj`
10. `/blog`

## 4) Copy de conversão (mensagens base)
- **Headline principal:** "Contrate ou trabalhe hoje: vagas temporárias com segurança e velocidade."
- **Subheadline:** "O TrampoHero conecta empresas e freelancers qualificados com pagamento protegido e operação simples."
- **Prova de valor (empresa):** "Publique em minutos, convide talentos e acompanhe tudo em um painel único."
- **Prova de valor (freelancer):** "Encontre freelas próximos, receba com segurança e evolua seu perfil profissional."

## 5) CTAs para empresa e freelancer
### Empresa
- Primário: **"Criar vaga agora"**
- Secundário: **"Convidar talentos"**
- Apoio: **"Falar com especialista de contratação"**

### Freelancer
- Primário: **"Encontrar freelas perto de mim"**
- Secundário: **"Completar perfil e aumentar convites"**
- Apoio: **"Assinar Hero Prime"**

## 6) Camada de métricas (produto + negócio + operação)
### 6.1 Objetivo da camada
Medir ponta a ponta:
- **aquisição** (entrada e cadastro),
- **ativação** (primeiras ações de valor por papel),
- **conversão** (job e pagamento),
- **operação** (suporte, SLA, risco/fraude),
- **retenção** (repetição de uso),
- **financeiro** (GMV, take rate, saque, receita líquida).

### 6.2 Nomenclatura padronizada
- Padrão de nome de evento: **`snake_case`**.
- Prefixos por domínio (recomendado): `auth_`, `job_`, `application_`, `payment_`, `withdrawal_`, `support_`, `review_`, `fraud_`.
- Campos comuns em todos os eventos:
  - `event_name`
  - `occurred_at` (ISO 8601 UTC)
  - `user_id` (ou `anonymous_id` quando público)
  - `user_role` (`freelancer` | `employer` | `admin`)
  - `session_id`
  - `source` (`web` | `backend`)
  - `route` (endpoint HTTP ou view)
  - `job_id`, `transaction_id`, `support_ticket_id` (quando aplicável)

### 6.3 Eventos mínimos (obrigatórios)
1. `signup_started`
2. `signup_completed`
3. `login_success`
4. `job_created`
5. `application_submitted`
6. `application_accepted`
7. `checkin_done`
8. `checkout_done`
9. `proof_uploaded`
10. `job_approved`
11. `payment_released`
12. `withdrawal_requested`
13. `withdrawal_paid`
14. `review_submitted`
15. `support_ticket_created`

### 6.4 Locais do código para instrumentar os eventos mínimos
> Implementar tracking no **backend (fonte de verdade)**; no frontend manter eventos de intenção/UX como complemento.

- `signup_started`  
  - **Frontend**: início do fluxo de cadastro/formulário (tela/ação de abrir cadastro) em `App.tsx` e componentes de auth.
- `signup_completed`  
  - **Backend**: `backend/src/routes/auth.js` em `POST /register` (após `User.create` com sucesso).
- `login_success`  
  - **Backend**: `backend/src/routes/auth.js` em `POST /login` (na resposta 200).
- `job_created`  
  - **Backend**: `backend/src/routes/jobs.js` em `POST /` (após criação da vaga).
- `application_submitted`  
  - **Backend**: `backend/src/routes/jobs.js` em `POST /:id/apply`.
- `application_accepted`  
  - **Backend**: `backend/src/routes/jobs.js` em `POST /:id/select-candidate` (candidato aprovado).
- `checkin_done`  
  - **Backend**: `backend/src/routes/jobs.js` em `POST /:id/checkin`.
- `checkout_done`  
  - **Backend**: `backend/src/routes/jobs.js` em `POST /:id/checkout`.
- `proof_uploaded`  
  - **Backend**: `backend/src/routes/jobs.js` em `POST /:id/submit-proof`.
- `job_approved`  
  - **Backend**: `backend/src/routes/jobs.js` em `POST /:id/complete`.
- `payment_released`  
  - **Backend**: `backend/src/routes/payments.js` em `POST /release-escrow/:jobId`.
- `withdrawal_requested`  
  - **Backend**: `backend/src/routes/wallet.js` em `POST /withdraw`.
- `withdrawal_paid`  
  - **Backend**: hoje o projeto já registra `withdrawal_requested` em `backend/src/routes/wallet.js` (`POST /withdraw`), mas ainda não tem um endpoint explícito para liquidação final de saque.  
  - **Recomendação v1**: implementar no `backend/src/routes/payments.js` (`POST /webhook`), pois é o caminho mais simples e consistente com os demais eventos financeiros já confirmados pelo gateway.  
  - **Fallback**: usar worker dedicado apenas se o provedor de pagamento não oferecer webhook confiável/assíncrono para liquidação.  
  - Em ambos os casos, atualizar `Withdrawal.status = completed` e `Transaction.status = completed`.
- `review_submitted`  
  - **Backend**: `backend/src/routes/reviews.js` em `POST /`.
- `support_ticket_created`  
  - **Backend**: `backend/src/routes/support.js` em `POST /`.

### 6.5 KPIs de negócio
- **Aquisição**
  - visitantes únicos
  - taxa de `signup_started`/visitante
  - taxa de `signup_completed`/`signup_started`
- **Ativação**
  - freelancer: `% que fez application_submitted em até D+1` (até 24h após signup)
  - empresa: `% que fez job_created em até D+1` (até 24h após signup)
- **Conversão marketplace**
  - `application_accepted` / `application_submitted`
  - `job_approved` / `job_created`
  - `payment_released` / `job_approved`

### 6.6 Métricas operacionais
- tempo médio de preenchimento de vaga (`job_created` → `application_accepted`)
- tempo médio de execução (`checkin_done` → `checkout_done`)
- tempo médio de aprovação (`checkout_done` → `job_approved`)
- tickets por 100 jobs e SLA de atendimento (`support_ticket_created` + dados de SLA)

### 6.7 Métricas de fraude
- taxa de tickets de fraude (`support_ticket_created` com `category = fraud`) por 100 jobs
- % jobs com `proof_uploaded` ausente antes de aprovação
- divergência de geolocalização de check-in (threshold configurável por categoria de vaga; default inicial: distância > **200m** do ponto do job em jobs presenciais, com calibração baseada em dados reais de precisão GPS)
- taxa de reversão/cancelamento de pagamentos e saques sob revisão manual

### 6.8 Métricas de retenção
- retenção D7 e D30 por papel (`freelancer` e `employer`)
- frequência de uso (jobs por usuário ativo/semana)
- repeat rate:
  - freelancer com 2+ `checkout_done` em 30 dias
  - empresa com 2+ `job_created` em 30 dias

### 6.9 Métricas financeiras
- **GMV**: soma bruta de jobs pagos (`payment_released`)
- **Take rate**: taxa média capturada (fee / GMV)
- receita líquida de taxas
- volume e taxa de sucesso de saque (`withdrawal_requested` → `withdrawal_paid`)
- aging de saldo em carteira (tempo até saque)

### 6.10 Dashboard mínimo recomendado (v1)
- **Painel 1 — Funil (Aquisição → Ativação → Conversão)**
  - `signup_started`, `signup_completed`, `job_created`, `application_submitted`, `application_accepted`, `job_approved`, `payment_released`
- **Painel 2 — Operação**
  - tempos médios por etapa, tickets, SLA
- **Painel 3 — Fraude/Risco**
  - incidentes de fraude, anomalias de prova/check-in, saques em revisão
- **Painel 4 — Retenção**
  - coortes D7/D30 por papel, frequência semanal, repeat rate
- **Painel 5 — Financeiro**
  - GMV diário/semanal, take rate, receita líquida, funil de saque

### 6.11 Eventos já implementados nesta entrega de growth/SEO
- `page_view` (por view com `app_view` e `role`)
- `cta_prime_click`
- `cta_empresa_criar_vaga_click`
- `cta_empresa_convidar_talento_click`
- `activation_apply_job_click`
- `share_job_click`

## 7) Funil de ativação (MVP)
### Freelancer
1. Descoberta de vaga (`page_view` browse)
2. Clique em vaga (evento futuro: `job_detail_open`)
3. Candidatura (`activation_apply_job_click`)
4. Primeiro check-in
5. Primeiro checkout concluído
6. Primeiro saque

### Empresa
1. Entrada em dashboard (`page_view` dashboard)
2. Criação de vaga (`cta_empresa_criar_vaga_click`)
3. Convite de talento (`cta_empresa_convidar_talento_click`)
4. Seleção de candidato
5. Primeira vaga concluída

## 8) Páginas locais/categóricas (estratégia)
- **Locais prioritários:** São Paulo, Rio de Janeiro, Belo Horizonte, Curitiba.
- **Formato local:** "Freelas em [Cidade] para [Categoria]".
- **Formato categórico:** "[Categoria] temporária: como contratar em 24h".
- SEO on-page: título + H1 + FAQ + prova local + CTA dupla.

## 9) Estratégia de conteúdo inicial (30 dias)
- Semana 1: "Como contratar freelancer para evento sem dor de cabeça"
- Semana 2: "Checklist do freelancer para conseguir mais aprovações"
- Semana 3: "Quanto pagar em diária por nicho em 2026"
- Semana 4: "Erros que aumentam no-show em vagas temporárias"

Distribuição: blog + social + comunidades locais + newsletter curta com CTA para páginas de categoria/cidade.

---

## Backlog de Growth (priorizado por impacto)
### Alto impacto
- [ ] Criar landings públicas `/para-freelancers` e `/para-empresas` com CTA dedicada
- [ ] Instrumentar eventos de ativação de ponta a ponta (primeira conversão por perfil)
- [ ] Publicar páginas locais e categóricas com template reaproveitável

### Médio impacto
- [ ] Setup Search Console + monitoramento de indexação
- [ ] Biblioteca de provas sociais (depoimentos/cases) em landing principal
- [ ] Testes A/B de headline e CTA primária (empresa vs freelancer)

### Baixo impacto
- [ ] Interlinking editorial entre blog e páginas de categoria/cidade
- [ ] Ajustes de microcopy por etapa de formulário

## Microcopys sugeridas (prontas para uso)
- Empresa (hero): **"Publique sua vaga em 2 minutos e receba candidatos qualificados."**
- Empresa (botão): **"Criar vaga agora"**
- Freelancer (hero): **"Encontre freelas perto de você e receba com segurança."**
- Freelancer (botão): **"Quero ver vagas próximas"**
- Prime upsell: **"Ative Hero Prime e reduza custos em cada trampo."**
- Empty state vagas: **"Sem vagas neste filtro. Tente outra categoria para encontrar oportunidades hoje."**
