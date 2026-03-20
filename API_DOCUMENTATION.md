# 🔌 API Documentation - TrampoHero Services

## Índice

1. [Gemini AI Service](#gemini-ai-service)
2. [PDF Generation Service](#pdf-generation-service)
3. [Padrões e Convenções](#padrões-e-convenções)
4. [Error Handling](#error-handling)
5. [Exemplos de Uso](#exemplos-de-uso)

---

## Gemini AI Service

Serviço de integração com a API do Google Gemini para funcionalidades de IA.

**Arquivo**: `/services/geminiService.ts`

### Configuração

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.API_KEY || '' 
});

// Modelo padrão
const MODEL = 'gemini-3-flash-preview';
```

### Funções Disponíveis

#### 1. `getSmartJobInsight`

Gera insights comerciais sobre uma vaga.

**Assinatura**:
```typescript
async function getSmartJobInsight(job: Job): Promise<string>
```

**Parâmetros**:
- `job` (Job): Objeto da vaga contendo título e detalhes

**Retorno**:
- `string`: Frase de destaque comercial curta

**Exemplo**:
```typescript
const job = {
  id: '1',
  title: 'Garçom de Gala',
  // ... outros campos
};

const insight = await getSmartJobInsight(job);
// Retorno: "Oportunidade exclusiva para profissionais com experiência em eventos de luxo!"
```

**Fallback**:
Em caso de erro, retorna: `"Oportunidade urgente para profissionais qualificados."`

---

#### 2. `getRecurrentSuggestion`

Gera sugestões para recontratar freelancer de alta performance.

**Assinatura**:
```typescript
async function getRecurrentSuggestion(
  freelancerName: string, 
  rating: number
): Promise<string>
```

**Parâmetros**:
- `freelancerName` (string): Nome do freelancer
- `rating` (number): Nota recebida (0.0 a 5.0)

**Retorno**:
- `string`: Sugestão personalizada de recontratação

**Exemplo**:
```typescript
const suggestion = await getRecurrentSuggestion("Maria Silva", 5.0);
// Retorno: "Maria Silva foi excelente! Garanta sua agenda para a próxima semana antes que outros contratem."
```

**Fallback**:
```typescript
`${freelancerName} foi excelente! Que tal garantir sua agenda para a próxima semana?`
```

---

#### 3. `generateVoiceJob`

Converte comando de voz em dados estruturados de vaga.

**Assinatura**:
```typescript
async function generateVoiceJob(
  audioPrompt: string
): Promise<VoiceJobData | null>
```

**Parâmetros**:
- `audioPrompt` (string): Transcrição do comando de voz

**Retorno**:
```typescript
interface VoiceJobData {
  title: string;
  payment: number;
  niche: Niche;  // 'Gastronomia' | 'Construção' | 'Eventos' | 'Serviços Gerais'
  startTime: string;  // Formato HH:MM
}
```

**Exemplo**:
```typescript
const command = "Preciso de um ajudante de cozinha para hoje às 19h pagando 150 reais";
const jobData = await generateVoiceJob(command);

// Retorno:
// {
//   title: "Ajudante de Cozinha",
//   payment: 150,
//   niche: "Gastronomia",
//   startTime: "19:00"
// }
```

**Fallback**:
Retorna `null` em caso de erro ou comando incompreensível.

---

#### 4. `generateJobDescription`

Gera descrição profissional para uma vaga.

**Assinatura**:
```typescript
async function generateJobDescription(
  title: string, 
  niche: string
): Promise<string>
```

**Parâmetros**:
- `title` (string): Título da vaga
- `niche` (string): Nicho profissional

**Retorno**:
- `string`: Descrição atraente e profissional (máx. 200 caracteres)

**Exemplo**:
```typescript
const description = await generateJobDescription(
  "Garçom para Casamento", 
  "Gastronomia"
);

// Retorno: "Buscamos garçom com experiência em eventos sociais. Uniforme próprio. Pontualidade essencial. Pagamento garantido via plataforma."
```

**Fallback**:
```
"Descrição gerada automaticamente: Oportunidade para prestação de serviço pontual com pagamento garantido."
```

---

#### 5. `getSavingsReport`

Calcula economia de contratar freelancers vs. CLT.

**Assinatura**:
```typescript
async function getSavingsReport(
  jobCount: number, 
  totalPaid: number
): Promise<string>
```

**Parâmetros**:
- `jobCount` (number): Número de freelancers contratados
- `totalPaid` (number): Valor total pago em R$

**Retorno**:
- `string`: Análise comparativa com CLT

**Exemplo**:
```typescript
const report = await getSavingsReport(15, 4500);

// Retorno: "Você economizou aproximadamente R$ 2.800 em encargos trabalhistas este mês. Isso representa 38% de economia vs. contratação CLT."
```

**Fallback**:
```
"Sua economia este mês foi de aproximadamente 35% em comparação a contratos fixos."
```

---

#### 6. `translateMessage`

Traduz mensagens para outros idiomas.

**Assinatura**:
```typescript
async function translateMessage(
  text: string, 
  targetLang: string = "Português"
): Promise<string>
```

**Parâmetros**:
- `text` (string): Texto a ser traduzido
- `targetLang` (string): Idioma de destino (padrão: "Português")

**Retorno**:
- `string`: Texto traduzido

**Exemplo**:
```typescript
const translated = await translateMessage(
  "I'll be there at 9am", 
  "Português"
);

// Retorno: "Estarei lá às 9h da manhã"
```

**Fallback**:
Retorna o texto original em caso de erro.

---

#### 7. `supportAssistant`

Assistente virtual de suporte ao cliente.

**Assinatura**:
```typescript
async function supportAssistant(query: string): Promise<string>
```

**Parâmetros**:
- `query` (string): Pergunta ou solicitação do usuário

**Configuração**:
```typescript
{
  model: 'gemini-3-flash-preview',
  config: {
    systemInstruction: "Você é o Suporte Hero do app TrampoHero. Ajude com dúvidas sobre Hero Pay (antecipação), Hero Prime, e cursos da Academy."
  }
}
```

**Retorno**:
- `string`: Resposta contextualizada

**Exemplo**:
```typescript
const response = await supportAssistant("Como funciona a antecipação?");

// Retorno: "O Hero Pay permite antecipar seus recebíveis com taxas de 3% a 5% para usuários Free, ou GRATUITAMENTE para assinantes Hero Prime. O valor cai na sua carteira em segundos!"
```

**Fallback**:
```
"Desculpe, estou com instabilidade. Tente novamente em instantes."
```

---

## PDF Generation Service

Serviço para geração de contratos em PDF.

**Arquivo**: `/services/pdfService.ts`

### Dependências

```typescript
import { jsPDF } from "jspdf";
import { Job, UserProfile } from "../types";
```

### Função Principal

#### `generateContract`

Gera contrato de prestação de serviços em PDF.

**Assinatura**:
```typescript
function generateContract(
  job: Job, 
  freelancer: UserProfile
): boolean
```

**Parâmetros**:
- `job` (Job): Dados da vaga/serviço
- `freelancer` (UserProfile): Dados do freelancer

**Retorno**:
- `boolean`: `true` se gerado com sucesso

**Estrutura do PDF**:

1. **Header**
   - Logo/Nome: "TrampoHero Pro" (Indigo 600)
   - Título: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS"

2. **Informações do Contrato**
   - Contratante (nome da empresa)
   - Contratado (nome + ID do freelancer)
   - Serviço contratado
   - Nicho profissional
   - Data e hora do check-in
   - Local de prestação
   - Valor acordado (destaque em verde)

3. **Termos de Uso**
   ```
   Pelo presente instrumento, as partes acima qualificadas celebram 
   contrato de prestação de serviços pontual. O Contratado compromete-se 
   a realizar o serviço com zelo e pontualidade. O Contratante 
   compromete-se a liberar o pagamento via plataforma TrampoHero após 
   a conclusão. Em caso de 'No-Show' ou cancelamento, aplicam-se as 
   taxas previstas nos Termos de Uso.
   ```

4. **Assinaturas Digitais**
   - Placeholder para Contratante
   - Placeholder para Freelancer

5. **Hash de Validação**
   - Identificador único gerado aleatoriamente

**Exemplo**:
```typescript
const job = {
  id: '123',
  employer: 'Buffet Delícia',
  title: 'Garçom de Gala',
  niche: Niche.RESTAURANT,
  location: 'Av. Paulista, 1000 - SP',
  payment: 180,
  // ... outros campos
};

const freelancer = {
  id: 'user-456',
  name: 'Alex Silva',
  // ... outros campos
};

const success = generateContract(job, freelancer);
// Gera arquivo: "Contrato_TrampoHero_123.pdf"
// E aciona download automático no navegador
```

**Customizações Visuais**:
```typescript
// Cores
Header: #4F46E5 (Indigo 600)
Título: #1E293B (Slate 800)
Valor: #16A34A (Green 600)
Termos: Gray 100

// Fontes
Helvetica Bold: Títulos
Helvetica Normal: Conteúdo
Tamanho: 10pt a 22pt
```

---

## Padrões e Convenções

### Tratamento de Erros

Todas as funções de serviço seguem o padrão:

```typescript
async function serviceName(...params): Promise<ReturnType> {
  try {
    // Lógica principal
    const response = await ai.models.generateContent({...});
    return response.text;
  } catch (error) {
    // Log do erro (opcional)
    console.error('Service error:', error);
    
    // Retorno de fallback
    return fallbackValue;
  }
}
```

**Princípios**:
- ✅ Nunca lançar exceções não tratadas
- ✅ Sempre ter fallback funcional
- ✅ Degradação graciosa
- ✅ Não bloquear fluxo do usuário

---

### Configuração de Ambiente

**Variável Necessária**:
```bash
# .env.local
API_KEY=your_gemini_api_key_here
```

**Obter API Key**:
1. Acesse [Google AI Studio](https://ai.google.dev)
2. Crie um novo projeto
3. Gere uma API key
4. Configure limites de uso (recomendado)

---

### Rate Limiting

**Limites do Gemini (Free Tier)**:
- 60 requests/minuto
- 1.500 requests/dia
- 1 milhão de tokens/dia

**Recomendações**:
1. Implementar cache para respostas comuns
2. Debounce em inputs do usuário
3. Queue para requests em lote
4. Monitorar quota via dashboard

---

## Error Handling

### Tipos de Erro Possíveis

#### 1. Network Errors
```typescript
// Timeout, conexão perdida
{
  type: 'NetworkError',
  message: 'Failed to fetch'
}
```

**Ação**: Retry automático após 2s

---

#### 2. API Errors
```typescript
// Quota excedida, key inválida
{
  type: 'APIError',
  status: 429,
  message: 'Quota exceeded'
}
```

**Ação**: Fallback para resposta padrão

---

#### 3. Parse Errors
```typescript
// JSON inválido do Gemini
{
  type: 'ParseError',
  message: 'Unexpected token'
}
```

**Ação**: Retornar null e logar

---

### Logging e Monitoramento

**Estrutura de Log**:
```typescript
interface ServiceLog {
  timestamp: string;
  service: string;
  function: string;
  params: any;
  success: boolean;
  duration: number;  // ms
  error?: string;
}
```

**Exemplo de Implementação**:
```typescript
const logService = async (fn: Function, ...args) => {
  const start = Date.now();
  const log: ServiceLog = {
    timestamp: new Date().toISOString(),
    service: 'gemini',
    function: fn.name,
    params: args,
    success: false,
    duration: 0
  };
  
  try {
    const result = await fn(...args);
    log.success = true;
    return result;
  } catch (error) {
    log.error = error.message;
    throw error;
  } finally {
    log.duration = Date.now() - start;
    console.log(log);
  }
};
```

---

## Exemplos de Uso

### Fluxo Completo: Criação de Vaga por Voz

```typescript
// 1. Usuário fala
const voiceInput = "Preciso de garçom amanhã 18h pagando 200 reais";

// 2. Converter voz para dados estruturados
const jobData = await generateVoiceJob(voiceInput);

if (!jobData) {
  showToast("Não entendi, tente novamente", "error");
  return;
}

// 3. Gerar descrição automática
const description = await generateJobDescription(
  jobData.title, 
  jobData.niche
);

// 4. Criar vaga completa
const newJob: Job = {
  id: generateId(),
  employerId: user.id,
  title: jobData.title,
  employer: user.name,
  employerRating: user.rating,
  niche: jobData.niche,
  location: user.defaultLocation,
  coordinates: user.defaultCoordinates,
  payment: jobData.payment,
  paymentType: 'dia',
  description: description,
  date: getTomorrowDate(),
  startTime: jobData.startTime,
  status: 'open'
};

setJobs(prev => [newJob, ...prev]);
showToast("Vaga criada com sucesso!", "success");
```

---

### Fluxo Completo: Contratação com Contrato

```typescript
// 1. Empregador aprova candidato
const handleApprove = async (candidateId: string) => {
  // 2. Verificar saldo
  if (user.wallet.balance < job.payment) {
    showToast("Saldo insuficiente", "error");
    return;
  }
  
  // 3. Debitar escrow
  const transaction: Transaction = {
    id: generateId(),
    type: 'job_payment',
    amount: -job.payment,
    date: now(),
    description: `Escrow: ${job.title}`
  };
  
  updateWallet(transaction);
  
  // 4. Gerar contrato PDF
  const freelancer = await getFreelancerProfile(candidateId);
  const success = generateContract(job, freelancer);
  
  if (success) {
    // 5. Enviar por email
    sendEmail(freelancer.email, `Contrato_${job.id}.pdf`);
    
    // 6. Notificar freelancer
    sendPushNotification(candidateId, "Você foi contratado!");
    
    showToast("Contratação confirmada!", "success");
  }
};
```

---

### Fluxo Completo: Suporte Multilíngue

```typescript
// 1. Freelancer estrangeiro envia mensagem
const incomingMessage = "I will arrive at 9am sharp";

// 2. Detectar idioma (simplificado)
const isEnglish = /^[A-Za-z\s]+$/.test(incomingMessage);

// 3. Traduzir se necessário
let displayMessage = incomingMessage;
if (isEnglish && user.language === 'pt-BR') {
  displayMessage = await translateMessage(incomingMessage, "Português");
}

// 4. Exibir no chat
const message: Message = {
  id: generateId(),
  senderId: freelancerId,
  text: incomingMessage,
  translatedText: isEnglish ? displayMessage : undefined,
  timestamp: now()
};

setMessages(prev => [...prev, message]);

// UI mostra:
// "I will arrive at 9am sharp"
// 🌐 Tradução: "Chegarei às 9h em ponto"
```

---

## Performance e Otimização

### Cache de Respostas

```typescript
const cache = new Map<string, { value: string, expiry: number }>();

async function cachedGenerate(
  fn: Function, 
  ...args: any[]
): Promise<string> {
  const key = JSON.stringify(args);
  const cached = cache.get(key);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }
  
  const result = await fn(...args);
  cache.set(key, {
    value: result,
    expiry: Date.now() + 3600000  // 1 hora
  });
  
  return result;
}

// Uso
const description = await cachedGenerate(
  generateJobDescription, 
  "Garçom", 
  "Gastronomia"
);
```

---

### Debouncing para Inputs

```typescript
import { useDebounce } from './hooks/useDebounce';

const JobDescriptionInput = () => {
  const [title, setTitle] = useState('');
  const debouncedTitle = useDebounce(title, 500);
  
  useEffect(() => {
    if (debouncedTitle) {
      generateJobDescription(debouncedTitle, niche)
        .then(setDescription);
    }
  }, [debouncedTitle]);
  
  return (
    <input 
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="Digite o título..."
    />
  );
};
```

---

## Testes

### Exemplo de Teste Unitário

```typescript
import { generateJobDescription } from './geminiService';

describe('Gemini Service', () => {
  it('should generate job description', async () => {
    const description = await generateJobDescription(
      'Garçom',
      'Gastronomia'
    );
    
    expect(description).toBeTruthy();
    expect(description.length).toBeLessThanOrEqual(200);
    expect(description).not.toContain('##');  // Sem markdown
  });
  
  it('should return fallback on error', async () => {
    // Simular erro
    jest.spyOn(ai.models, 'generateContent').mockRejectedValue(
      new Error('API Error')
    );
    
    const description = await generateJobDescription('Test', 'Test');
    
    expect(description).toBe(
      'Descrição gerada automaticamente: Oportunidade para prestação de serviço pontual com pagamento garantido.'
    );
  });
});
```

---

**Última atualização**: Fevereiro 2026
**Versão da API**: 1.0.0
# Suporte (Support)

## Fluxo operacional (resumo)

1. Usuário abre ticket em `/api/support` com categoria, incidente e contexto (job/disputa/transação).
2. Priorização automática define `priority` e `SLA` por categoria.
3. Casos de fraude/disputa entram em `manual_review` automaticamente.
4. Admin acompanha via `/api/admin/tickets` e responde/atribui/encerra.
5. Histórico do atendimento fica em `history` + `messages` no ticket.

## Categorias e incidentes

- Categorias: `payment`, `job`, `account`, `kyc`, `technical`, `dispute`, `fraud`, `compliance`, `other`
- Incidentes: `general`, `dispute_company_freelancer`, `fraud_report`

## SLA por categoria (horas)

- `fraud`: 1h
- `dispute`: 8h
- `payment`: 8h
- `account`: 12h
- `kyc`, `compliance`, `technical`, `job`: 24h
- `other`: 48h

## Status do ticket

- `open`
- `in_progress`
- `waiting_user`
- `manual_review`
- `resolved`
- `closed`

## Endpoints novos/atualizados de suporte

- `POST /api/support`  
  Abre ticket com priorização automática, SLA, incidente e histórico inicial.

- `GET /api/support`  
  Lista tickets do usuário (ou todos para admin), com filtros opcionais por `status`, `category`, `incidentType`.

- `GET /api/support/operations/meta`  
  Retorna metadados operacionais (SLA, status, categorias, templates, regras de priorização).

- `POST /api/support/:id/manual-review` (admin)  
  Move ticket para revisão manual e registra auditoria.
