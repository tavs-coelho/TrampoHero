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

## 6) Analytics e eventos a instrumentar
### Eventos implementados nesta entrega
- `page_view` (por view com `app_view` e `role`)
- `cta_prime_click`
- `cta_empresa_criar_vaga_click`
- `cta_empresa_convidar_talento_click`
- `activation_apply_job_click`
- `share_job_click`

### Eventos recomendados (próxima sprint)
- `activation_first_job_completed`
- `activation_first_withdrawal_requested`
- `activation_first_job_posted`
- `activation_first_candidate_selected`
- `onboarding_role_selected`
- `kyc_submitted`

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
