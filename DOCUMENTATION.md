# 📚 Documentação Completa - TrampoHero Pro

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Funcionalidades](#funcionalidades)
4. [Fluxos de Usuário](#fluxos-de-usuário)
5. [Integrações e Serviços](#integrações-e-serviços)
6. [Estratégia de Monetização](#estratégia-de-monetização)
7. [Segurança e Conformidade](#segurança-e-conformidade)
8. [Guia de Desenvolvimento](#guia-de-desenvolvimento)

---

## 🎯 Visão Geral

### O que é o TrampoHero?

**TrampoHero Pro** é uma plataforma completa de marketplace de trabalhos temporários (bicos/gigs) que conecta freelancers qualificados a empresas que precisam de serviços pontuais. A plataforma combina tecnologia de ponta com validação rigorosa para garantir segurança e confiabilidade em todas as transações.

### Missão

Democratizar o acesso ao trabalho temporário de qualidade, proporcionando renda extra para trabalhadores autônomos e agilidade para empresas que precisam de mão-de-obra qualificada.

### Diferenciais Competitivos

- ✅ **Validação por Geolocalização GPS**: Check-in/Check-out automático
- ✅ **Prova Fotográfica**: Registro visual da prestação de serviço
- ✅ **Sistema Escrow**: Pagamentos garantidos em fundo bloqueado
- ✅ **Contratos Digitais**: Geração automática de PDFs legais
- ✅ **IA Integrada**: Assistente virtual, traduções e recomendações
- ✅ **Sistema de Medalhas**: Gamificação e certificações profissionais
- ✅ **Antecipação de Recebíveis**: Liquidez imediata via Hero Pay
- ✅ **Marketplace de Talentos**: Busca avançada com filtros inteligentes

---

## 🏗️ Arquitetura

### Stack Tecnológico

```
Frontend: React 19 + TypeScript
UI Framework: Custom Design System com Tailwind CSS
State Management: React Hooks (useState, useMemo, useEffect)
Mapping: Leaflet.js
AI: Google Gemini API
PDF Generation: jsPDF
Build Tool: Vite
```

### Estrutura de Arquivos

```
TrampoHero/
├── App.tsx                 # Componente principal
├── types.ts                # Definições TypeScript
├── services/
│   ├── geminiService.ts    # Integrações com IA
│   └── pdfService.ts       # Geração de contratos
├── package.json            # Dependências
├── tsconfig.json           # Configuração TypeScript
├── vite.config.ts          # Configuração Vite
└── index.html              # HTML base
```

### Modelos de Dados

#### UserProfile
```typescript
{
  id: string;
  name: string;
  bio: string;
  niche: Niche;              // Gastronomia, Construção, Eventos, Serviços Gerais
  rating: number;            // 0.0 a 5.0
  tier: SubscriptionTier;    // Free, Pro, Ultra
  isPrime: boolean;          // Assinatura Premium
  wallet: {
    balance: number;         // Saldo disponível
    pending: number;         // Pendente de liberação
    scheduled: number;       // Agendado para próxima semana
    transactions: Transaction[];
  };
  role: 'freelancer' | 'employer';
  medals: Medal[];           // Conquistas e certificações
  history: WorkHistory[];
  favorites: string[];       // IDs de favoritos
  invitations: Invitation[]; // Convites enviados
  invoices: Invoice[];       // Notas fiscais
}
```

#### Job
```typescript
{
  id: string;
  employerId: string;
  title: string;
  employer: string;
  employerRating: number;
  niche: Niche;
  location: string;
  coordinates: { lat: number, lng: number };
  payment: number;
  paymentType: 'dia' | 'hora' | 'job';
  description: string;
  date: string;
  startTime: string;
  status: JobStatus;         // open, applied, ongoing, completed, paid, cancelled
  checkInTime?: string;
  checkOutTime?: string;
  proofPhoto?: string;
  isAnticipated?: boolean;
  isBoosted?: boolean;       // Vaga em destaque (paga)
  isEscrowGuaranteed?: boolean;  // Fundo garantidor ativo
  minRatingRequired?: number;    // Avaliação mínima para candidatar
}
```

---

## ⚡ Funcionalidades

### Para Freelancers

#### 1. Busca de Vagas
- **Lista Visual**: Cards com informações detalhadas
- **Mapa Interativo**: Visualização geográfica com marcadores customizados
- **Filtros**: Por nicho, data, localização
- **Ordenação Inteligente**: Vagas em destaque aparecem primeiro

#### 2. Sistema de Check-in/Check-out
- **Validação GPS**: Garante presença física no local
- **Contrato Automático**: PDF gerado no check-in
- **Prova Fotográfica**: Upload de foto durante o serviço
- **Controle de Jornada**: Registro preciso de horários

#### 3. Carteira Digital (Hero Wallet)
- **Saldo Disponível**: Valores que podem ser sacados
- **Saldo Pendente**: Aguardando aprovação do empregador
- **Saldo Agendado**: Pagamentos da próxima semana
- **Histórico de Transações**: Completo e detalhado
- **Saque PIX**: Transferências instantâneas
- **Hero Pay**: Antecipação de recebíveis com taxas competitivas

#### 4. Sistema de Medalhas e Certificações
- **Medalhas de Conquista**: Por pontualidade, qualidade, dedicação
- **Certificações Profissionais**: Via Hero Academy
- **Exibição Pública**: Aumenta credibilidade no perfil
- **Gamificação**: Incentiva boas práticas

#### 5. Hero Academy
- **Cursos Rápidos**: 15-20 minutos
- **Certificações**: Validadas pela plataforma
- **Gratuitos**: Inclusos para usuários Pro
- **Temas Variados**: Atendimento, segurança, técnicas especializadas

#### 6. Hero Prime (Assinatura Premium)
- ✨ **Taxa Zero**: Saques sem custo
- ✨ **Antecipação Gratuita**: Hero Pay sem taxas
- ✨ **Seguro Automático**: Cobertura em acidentes de trabalho
- ✨ **Prioridade**: Aparece primeiro para empregadores
- ✨ **Badge Exclusivo**: Destaque visual no perfil

### Para Empregadores

#### 1. Criação de Vagas
- **Manual**: Formulário completo com todos os campos
- **Por Voz**: Criação via comando de voz com IA
- **Descrição Automática**: IA gera descrição profissional
- **Boost Pago**: Destaque da vaga no topo

#### 2. Marketplace de Talentos
- **Busca Avançada**: Por nicho, avaliação, preço/hora
- **Perfis Detalhados**: Histórico, medalhas, certificações
- **Convites Diretos**: Enviar propostas para talentos específicos
- **Favoritos**: Salvar freelancers de confiança

#### 3. Sistema de Contratação
- **Aprovação de Candidatos**: Análise de perfis
- **Escrow Automático**: Valor bloqueado até conclusão
- **Gestão de Vagas**: Dashboard com todas as contratações
- **Relatórios**: Economia vs. contratação CLT

#### 4. Gateway de Pagamento
- **Recarga via PIX**: Instantânea
- **Cartão de Crédito**: Parcelamento disponível
- **Saldo em Carteira**: Para futuras contratações
- **Histórico Completo**: Todas as movimentações

#### 5. Notas Fiscais Automatizadas
- **Geração Automática**: Para cada serviço concluído
- **Download em PDF**: Arquivos prontos para contabilidade
- **Histórico Organizado**: Fácil acesso para auditorias

#### 6. Chat de Suporte com IA
- **Assistente Virtual**: Responde dúvidas instantaneamente
- **Traduções**: Para comunicação com freelancers estrangeiros
- **Disponível 24/7**: Sem fila de espera

---

## 🔄 Fluxos de Usuário

### Fluxo do Freelancer

```
1. Cadastro/Login
   ↓
2. Escolher Nicho Profissional
   ↓
3. Navegar Vagas (Lista ou Mapa)
   ↓
4. Candidatar-se a Vaga
   ↓
5. Aguardar Aprovação do Empregador
   ↓
6. Check-in no Local (GPS validado)
   ↓
7. Executar Serviço
   ↓
8. Upload de Prova Fotográfica
   ↓
9. Check-out
   ↓
10. Receber Avaliação
    ↓
11. Valor Agendado na Carteira
    ↓
12. Opção: Antecipar via Hero Pay ou Aguardar
    ↓
13. Saque via PIX
```

### Fluxo do Empregador

```
1. Cadastro/Login
   ↓
2. Alternar para Modo Empresa
   ↓
3. Adicionar Saldo à Carteira
   ↓
4. Criar Vaga (Manual ou Voz)
   ↓
5. Vaga Publicada no Marketplace
   ↓
6. Receber Candidaturas
   ↓
7. Analisar Perfis (Avaliações, Medalhas, Histórico)
   ↓
8. Aprovar Candidato (Escrow bloqueado)
   ↓
9. Freelancer faz Check-in
   ↓
10. Acompanhar Serviço
    ↓
11. Validar Conclusão
    ↓
12. Avaliar Freelancer
    ↓
13. Pagamento Liberado Automaticamente
    ↓
14. Nota Fiscal Gerada
```

---

## 🤖 Integrações e Serviços

### Google Gemini AI

#### Funcionalidades Implementadas

1. **Job Description Generator**
   - Input: Título da vaga + Nicho
   - Output: Descrição profissional otimizada (máx. 200 caracteres)

2. **Voice Job Creation**
   - Input: Comando de voz transcrito
   - Output: JSON estruturado com dados da vaga

3. **Recurrent Suggestions**
   - Input: Nome do freelancer + Nota
   - Output: Sugestão para recontratar

4. **Savings Report**
   - Input: Número de contratações + Valor total pago
   - Output: Análise de economia vs. CLT

5. **Translation Service**
   - Input: Texto + Idioma destino
   - Output: Tradução (para comunicação internacional)

6. **Support Assistant**
   - Input: Pergunta do usuário
   - Output: Resposta contextualizada sobre a plataforma

#### Configuração

```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

**Modelo usado**: `gemini-3-flash-preview` (rápido e econômico)

### jsPDF - Geração de Contratos

#### Características

- **Header Corporativo**: Logo e título profissional
- **Dados Completos**: Contratante, contratado, serviço, valor
- **Termos de Uso**: Cláusulas legais incluídas
- **Assinaturas Digitais**: Placeholder para validação
- **Hash de Validação**: Identificador único por documento

#### Uso

```typescript
generateContract(job: Job, freelancer: UserProfile)
```

---

## 💰 Estratégia de Monetização

### Receitas Atuais

#### 1. Taxas sobre Transações (Freemium)
- **Freelancer Free**: 2,5% em saques via PIX
- **Empregador Free**: 1,5% sobre cada contratação

#### 2. Antecipação de Recebíveis (Hero Pay)
- **Freelancer Free**: 3% a 5% sobre valor antecipado
- **Freelancer Prime**: Gratuito (benefício exclusivo)
- **Margem Estimada**: 4% em média (não-Prime)

#### 3. Assinatura Hero Prime
- **Valor**: R$ 29,90/mês
- **Benefícios**: Taxa zero + Antecipação grátis + Seguro
- **Target**: Freelancers que faturam +R$ 1.500/mês

#### 4. Boost de Vagas
- **Valor**: R$ 15 por vaga/semana
- **Benefício**: Topo da lista + Destaque visual
- **Target**: Empresas com urgência de contratação

#### 5. Marketplace de Talentos Premium
- **Acesso Básico**: Gratuito (top 6 talentos)
- **Acesso Premium**: R$ 99/mês (busca ilimitada + filtros avançados)
- **Target**: Empresas que contratam frequentemente

### Projeção de Receita Mensal (10.000 usuários ativos)

| Fonte de Receita | Usuários | Valor Médio | Receita Mensal |
|------------------|----------|-------------|----------------|
| Taxas de Saque | 5.000 | R$ 5,00 | R$ 25.000 |
| Hero Pay | 2.000 | R$ 12,00 | R$ 24.000 |
| Hero Prime | 500 | R$ 29,90 | R$ 14.950 |
| Boost de Vagas | 200 | R$ 15,00 | R$ 3.000 |
| Marketplace Premium | 50 | R$ 99,00 | R$ 4.950 |
| **TOTAL** | | | **R$ 71.900** |

**Projeção Anual**: ~R$ 862.800

---

## 🔒 Segurança e Conformidade

### Validações de Segurança

1. **Geolocalização**
   - Check-in só liberado se GPS confirmar presença no local
   - Raio de tolerância: 100 metros

2. **Sistema Escrow**
   - Pagamentos bloqueados até conclusão do serviço
   - Proteção contra fraudes para ambas as partes

3. **Prova Fotográfica**
   - Registro visual obrigatório
   - Timestamp automático

4. **Contratos Digitais**
   - Hash de validação único
   - Assinaturas digitais

### Conformidade Legal

- ✅ **LGPD**: Dados armazenados localmente (localStorage)
- ✅ **Termos de Uso**: Incluídos nos contratos PDF
- ✅ **Notas Fiscais**: Geração automática para compliance contábil

### Dados Sensíveis

**Nunca armazenados**:
- Números de cartão de crédito completos
- CVVs
- Senhas em texto plano

**Armazenados localmente** (navegador):
- Perfil do usuário
- Histórico de transações
- Mensagens do chat

---

## 🛠️ Guia de Desenvolvimento

### Pré-requisitos

- Node.js 18+ 
- NPM 9+
- Gemini API Key (Google AI Studio)

### Instalação

```bash
# Clonar repositório
git clone https://github.com/tavs-coelho/TrampoHero.git
cd TrampoHero

# Instalar dependências
npm install

# Configurar variáveis de ambiente
echo "API_KEY=sua_gemini_api_key_aqui" > .env.local

# Executar em desenvolvimento
npm run dev
```

### Build para Produção

```bash
npm run build
npm run preview
```

### Estrutura de Componentes

```
App (Principal)
├── SplashScreen
├── Toast (Notificações)
├── Header (Navegação)
├── BottomNav (Menu inferior)
├── Views
│   ├── Browse (Lista/Mapa de vagas)
│   ├── Active (Trabalho ativo)
│   ├── Wallet (Carteira)
│   ├── Dashboard (Painel empregador)
│   ├── Talents (Marketplace)
│   ├── Academy (Cursos)
│   ├── Chat (Suporte)
│   └── Profile (Perfil)
└── Modals
    ├── JobDetailsModal
    ├── PrimeModal
    ├── PaymentModal
    └── CreateJobModal
```

### Adicionando Novas Features

#### Exemplo: Adicionar novo tipo de medalha

1. **Atualizar MEDALS_REPO**:
```typescript
const MEDALS_REPO: Medal[] = [
  // ... existentes
  { 
    id: 'nova-medalha', 
    name: 'Nome da Medalha', 
    icon: 'fa-icon-name', 
    color: 'text-color-500', 
    description: 'Descrição da conquista' 
  }
];
```

2. **Criar lógica de desbloqueio**:
```typescript
const handleUnlockMedal = (medalId: string) => {
  const medal = MEDALS_REPO.find(m => m.id === medalId);
  if (medal) {
    setUser(prev => ({
      ...prev,
      medals: [...prev.medals, medal]
    }));
  }
};
```

### Testes e Debugging

#### Modo Debug
Abra o console do navegador (F12) para ver logs detalhados.

#### Dados Mockados
- Usuário inicial: `INITIAL_USER`
- Vagas iniciais: `INITIAL_JOBS`
- Talentos: `TOP_TALENTS`

#### Reset de Dados
```javascript
localStorage.clear();
window.location.reload();
```

### Variáveis CSS Customizadas

```css
/* Principais cores da marca */
--primary: #4F46E5;      /* Indigo-600 */
--secondary: #10B981;    /* Emerald-500 */
--accent: #F59E0B;       /* Amber-500 */
--dark: #1E293B;         /* Slate-800 */
--light: #F8FAFC;        /* Slate-50 */
```

---

## 📈 Roadmap de Funcionalidades

### Q1 2024
- [ ] Integração com gateway de pagamento real (Stripe/MercadoPago)
- [ ] Sistema de avaliações e reviews
- [ ] Notificações push
- [ ] Versão mobile nativa (React Native)

### Q2 2024
- [ ] Verificação de identidade (KYC)
- [ ] Sistema de disputas
- [ ] Programa de indicação (referral)
- [ ] Analytics dashboard para empresas

### Q3 2024
- [ ] API pública para integrações
- [ ] Marketplace de serviços recorrentes
- [ ] Agendamento avançado
- [ ] Integrações contábeis (Conta Azul, Omie)

### Q4 2024
- [ ] Expansão internacional
- [ ] Multi-idioma completo
- [ ] Sistema de créditos corporativos
- [ ] Planos Enterprise customizados

---

## 🤝 Contribuindo

### Como Contribuir

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

### Padrões de Código

- **TypeScript**: Tipagem rigorosa obrigatória
- **Formatação**: Prettier com config padrão
- **Naming**: camelCase para funções, PascalCase para componentes
- **Comentários**: Em português para contexto de negócio

---

## 📞 Suporte

Para dúvidas ou problemas:
- 📧 Email: suporte@trampohero.com.br
- 💬 Chat: Disponível no app 24/7
- 📚 Docs: https://docs.trampohero.com.br

---

**Última atualização**: Fevereiro 2026
**Versão**: 1.0.0
**Licença**: Proprietário - TrampoHero Inc.
