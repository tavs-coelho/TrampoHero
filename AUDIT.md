# 🔍 TrampoHero — Auditoria de Compliance e LGPD (baseada no código)

> **Data:** Março/2026  
> **Escopo:** Backend (Node.js/Express/MongoDB), Frontend Web (React/Vite) e Mobile (Expo)  
> **Método:** inspeção estática do código e fluxos implementados  
> **Nota:** este documento é **técnico‑operacional** e **não** substitui parecer jurídico.

---

## ✅ Escopo analisado
- cadastro
- login
- upload de documentos (KYC)
- geolocalização (check‑in)
- prova fotográfica
- contratos
- dados de pagamento
- avaliações
- suporte
- retenção de dados

---

## 🗺️ Mapa de dados (inventário técnico)

> **Fontes:** `backend/src/models/*`, `backend/src/routes/*`, `services/apiService.ts`, `App.tsx`, `apps/mobile/src/services/geolocation.ts`

| Fluxo | Dados pessoais coletados (exemplos) | Onde grava / trafega | Observações de risco |
|---|---|---|---|
| Cadastro | nome, email, senha (hash), role, niche, referralCode | `User` (`backend/src/models/User.js`), `POST /api/auth/register` | dados básicos + credenciais |
| Login | email, senha; tokens JWT | `POST /api/auth/login` + `localStorage` (`services/apiService.ts`) | token em storage local |
| KYC (documentos) | imagem documento frente/verso, selfie | `User.kyc.*` + Azure Blob (`backend/src/routes/kyc.js`) | alto risco (documentos + biometria) |
| Uploads gerais | imagens (foto‑prova) | `Upload` (`backend/src/models/Upload.js`), SAS URLs | URLs permanentes podem expor arquivos |
| Geolocalização | latitude, longitude, horário | `Job.checkin`, `Attendance` (`backend/src/routes/jobs.js`, `backend/src/models/Attendance.js`) | dado sensível por contexto |
| Prova fotográfica | URL foto | `Job.proofPhoto`, `Attendance.proofPhotoUrl` | imagem de pessoa/local |
| Contratos | nome, email, vaga, local, remuneração | PDF em `backend/contracts` + `Contract` (`pdfService.js`) | PDF serve PII; rota pública estática |
| Pagamentos | wallet, transações, pixKey, IDs Stripe | `Transaction`, `User.wallet` (`wallet.js`, `payments.js`) | `pixKey` vai para `description` |
| Avaliações | rating, comentário, autor/target | `Review` (`reviews.js`) | conteúdo livre pode incluir PII |
| Suporte | assunto, descrição, mensagens, anexos | `SupportTicket` (`support.js`) | alto risco (pode conter dados sensíveis) |
| Logs/Auditoria | IP, user‑agent (admin) | `AdminAction` (`AdminAction.js`) + `morgan` | dados pessoais de navegação |
| Push | deviceToken, tags | `User.pushDevices` (`users.js`) | identificador de dispositivo |
| IA (suporte) | prompt do usuário | `/api/ai/generate` (Gemini) | dados podem sair para terceiro |

---

## 🔎 Análise por fluxo (LGPD)

### 1) Cadastro
**Dados coletados:** nome, email, senha (hash), role, niche, referralCode.  
**Base legal provável:** execução de contrato / procedimentos preliminares.  
**Riscos:** ausência de consentimento explícito para comunicações; dados ficam em `localStorage` no frontend (`trampoHeroUser`).  
**Lacunas no código:** não há registro explícito de aceite de termos/privacidade nem validação no backend.  
**Consentimento/política/termos:** incluir aceite obrigatório de Termos/Privacidade no cadastro **e** exigir flags/timestamps no `POST /api/auth/register` (persistir em coleção de consentimentos ou no `User`).

### 2) Login
**Dados coletados:** credenciais e tokens JWT.  
**Base legal provável:** execução de contrato + legítimo interesse (segurança).  
**Riscos:** token persistido em `localStorage` (`trampoHeroToken`).  
**Lacunas:** refresh token não é persistido/gerenciado no servidor.  
**Consentimento:** não aplicável, mas exigir política de segurança/sessão.

### 3) Upload de documentos (KYC)
**Dados coletados:** documento frente/verso + selfie (`User.kyc.*`).  
**Base legal provável:** cumprimento de obrigação legal/regulatória **ou** legítimo interesse antifraude (validar com jurídico).  
**Riscos:** imagens altamente sensíveis; URLs permanentes podem vazar.  
**Lacunas:** ausência de política de retenção/expurgo no código; ausência de consentimento explícito para biometria/identidade.  
**Consentimento:** dados biométricos (selfie) são sensíveis (LGPD Art. 11) → exigir consentimento explícito, controles reforçados e expiração automática pós‑verificação/encerramento.

### 4) Geolocalização
**Dados coletados:** latitude, longitude, timestamp (`/api/jobs/:id/checkin`).  
**Base legal provável:** execução de contrato + legítimo interesse antifraude.  
**Riscos:** rastreamento indevido; uso fora do contexto.  
**Lacunas:** não há limite/retention no backend; sem mascaramento.  
**Consentimento:** solicitar permissão contextual (uso “somente durante check‑in”).

### 5) Prova fotográfica
**Dados coletados:** URL da foto da prova.  
**Base legal provável:** execução de contrato (comprovação) + legítimo interesse.  
**Riscos:** exposição de imagens; URLs permanentes.  
**Lacunas:** ausência de política de retenção/expurgo.  
**Consentimento:** aviso de finalidade no fluxo de upload.

### 6) Contratos
**Dados coletados:** nome, email, dados da vaga, local, remuneração.  
**Base legal provável:** execução de contrato / obrigação legal.  
**Riscos:** PDFs ficam em disco e são servidos por rota **estática** `/api/contracts/files` sem autenticação (**severidade crítica**).  
**Lacunas:** ausência de controle de acesso e expiração de links.  
**Consentimento:** aceite dos termos do contrato no fluxo de conclusão.

### 7) Dados de pagamento
**Dados coletados:** wallet, transações, IDs Stripe; `pixKey` armazenado em `Transaction.description`.  
**Base legal provável:** execução de contrato + obrigação legal (contábil/fiscal).  
**Riscos:** exposição de pixKey e dados financeiros.  
**Lacunas:** não há mascaramento de pixKey no log/descrição.  
**Consentimento:** não necessário, mas política deve informar parceiros de pagamento.

### 8) Avaliações
**Dados coletados:** rating + comentário (conteúdo livre).  
**Base legal provável:** legítimo interesse (confiança/reputação).  
**Riscos:** comentário pode incluir dados sensíveis.  
**Lacunas:** ausência de moderação automática; sem política de retenção.  
**Consentimento:** informar finalidade e regras de conteúdo.

### 9) Suporte
**Dados coletados:** assunto, descrição, mensagens, anexos, IP (admin).  
**Base legal provável:** execução de contrato + legítimo interesse (suporte).  
**Riscos:** uploads podem conter documentos sensíveis; ausência de retenção.  
**Lacunas:** não há expurgo de anexos ou fechamento automático.  
**Consentimento:** aviso de que dados enviados poderão ser analisados.

### 10) Retenção de dados
**Observação:** não há TTL/cron de expurgo, nem endpoints de exclusão/portabilidade no código.  
**Risco:** retenção indefinida e ausência de gestão do ciclo de vida.  
**Necessidade:** política de retenção + implementação técnica.

---

## ⚠️ Riscos LGPD (principais)
1. **Documentos e selfie (KYC)** sem retenção/expurgo no código.  
2. **Geolocalização** armazenada sem prazo definido.  
3. **Provas fotográficas** armazenadas com URLs permanentes.  
4. **Contratos PDF** expostos via rota estática sem autenticação (**severidade crítica**).  
5. **PixKey** gravada em descrição de transações (pode ser CPF/telefone/email).  
6. **Token em localStorage** (risco XSS) sem mitigação (HttpOnly/CSP).  
7. **Ausência de consentimentos** explícitos (KYC, geolocalização, marketing, cookies).  
8. **Sem trilhas de direitos do titular** (exportar/excluir dados).  
9. **IA (Gemini)** pode receber dados pessoais sem aviso/consentimento e envolve transferência internacional.  

---

## ✅ Ações técnicas obrigatórias (curto prazo)
1. **Controle de acesso para contratos (prioridade imediata)**: exigir autenticação antes de servir PDF.  
2. **Mascarar/omitir `pixKey` (prioridade alta)** em `Transaction.description` e mover para campo dedicado com criptografia.  
3. **Implementar retenção** (cron + política) para KYC, fotos, geolocalização e suporte.  
4. **Registro de consentimentos** (coleção `consents` com propósito/base legal/dados e revogação).  
5. **Rotas de direitos do titular**: exportar dados e excluir conta.  
6. **Limitar URLs de mídia** (SAS de leitura com expiração).  
7. **Auditoria de acesso** a documentos sensíveis (logs).  
8. **Mitigar token em localStorage (prioridade alta)**: migrar para cookies HttpOnly + CSP.  
9. **Minimizar dados antes de IA** (redação/anonimização do prompt).  

---

## ⚖️ Ações jurídicas/operacionais
1. **Revisar bases legais** com jurídico por fluxo (especialmente KYC/biometria).  
2. **Política de Privacidade atualizada** com fluxos reais do código.  
3. **Termos de Uso** com cláusula de provas (foto/GPS) e contratos.  
4. **Contrato com operadores** (Stripe, Azure, Google/Gemini) + cláusulas de transferência internacional.  
5. **Procedimento de incidente** (prazo de 72h ANPD).  
6. **Nomeação formal do DPO** e canal de atendimento.  

---

## ✅ Checklist do que precisa existir no sistema
- [ ] Registro de consentimento (tipo, propósito, base legal, categorias de dados, timestamp, revogação)  
- [ ] Avisos de privacidade por fluxo (KYC, GPS, foto, IA)  
- [ ] Exportar meus dados (JSON/PDF)  
- [ ] Excluir conta + expurgo/anônimização  
- [ ] Retenção por tipo de dado (cron + política)  
- [ ] Controle de acesso a contratos e mídia  
- [ ] Registro de auditoria para acessos sensíveis  
- [ ] Política de cookies + banner  
- [ ] Tela de preferências de privacidade  
- [ ] Relatório interno de risco (RIPD) para dados de alto risco  

---

## 🧭 Sugestões de telas e flags de consentimento

| Tela/Fluxo | Flags sugeridas | Observação |
|---|---|---|
| Cadastro | `aceite_termos`, `aceite_privacidade` | obrigatório |
| Preferências | `consent_marketing`, `consent_analytics` | opcional/revogável |
| KYC | `consent_kyc_documentos`, `consent_biometria` | explícito |
| Check‑in GPS | `consent_gps_execucao_contrato` | contextual e granular |
| Prova fotográfica | `consent_foto_prova` | contextual |
| Suporte + IA | `consent_ai_support` | avisar envio a terceiros |
| Push | `consent_push_notifications` | opcional |
| Cookies | `consent_cookies_essenciais` (implícito), `consent_cookies_marketing` | banner |

---

## 📌 Evidências principais (código)
- `backend/src/models/User.js` — dados pessoais, KYC, wallet, pushDevices  
- `backend/src/routes/auth.js` — cadastro/login/refresh  
- `backend/src/routes/kyc.js` + `backend/src/routes/uploads.js` — upload de documentos  
- `backend/src/routes/jobs.js` + `backend/src/models/Attendance.js` — GPS e foto‑prova  
- `backend/src/services/pdfService.js` + `backend/src/routes/contracts.js` — contratos  
- `backend/src/routes/wallet.js` + `backend/src/routes/payments.js` — pagamentos  
- `backend/src/routes/reviews.js` — avaliações  
- `backend/src/routes/support.js` — suporte  
- `services/apiService.ts` + `App.tsx` — storage local / tokens

---

## ✅ Conclusão
O código já implementa fluxos críticos, mas **falta governança técnica** para LGPD: gestão de consentimento, retenção, direitos do titular e controle de acesso a documentos sensíveis. As ações acima são o mínimo técnico‑operacional para alinhar o produto ao compliance.
