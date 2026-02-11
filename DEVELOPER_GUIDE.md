# 🚀 Guia de Configuração e Desenvolvimento - TrampoHero

## 📋 Índice

1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [Instalação Inicial](#instalação-inicial)
3. [Configuração de Ambiente](#configuração-de-ambiente)
4. [Executando o Projeto](#executando-o-projeto)
5. [Estrutura do Código](#estrutura-do-código)
6. [Guia de Desenvolvimento](#guia-de-desenvolvimento)
7. [Boas Práticas](#boas-práticas)
8. [Solução de Problemas](#solução-de-problemas)
9. [Deploy](#deploy)

---

## 💻 Requisitos do Sistema

### Obrigatórios

- **Node.js**: versão 18.0.0 ou superior
- **NPM**: versão 9.0.0 ou superior (ou Yarn 1.22+)
- **Git**: para controle de versão
- **Navegador Moderno**: Chrome 90+, Firefox 88+, Safari 14+, ou Edge 90+

### Verificar Instalação

```bash
node --version    # Deve retornar v18.0.0 ou superior
npm --version     # Deve retornar 9.0.0 ou superior
git --version     # Qualquer versão recente
```

### Instalando Node.js (se necessário)

**Windows/Mac**:
- Baixe de [nodejs.org](https://nodejs.org)
- Execute o instalador

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 📦 Instalação Inicial

### 1. Clonar o Repositório

```bash
git clone https://github.com/tavs-coelho/TrampoHero.git
cd TrampoHero
```

### 2. Instalar Dependências

```bash
npm install
```

**O que isso instala**:
- React 19.2.4
- TypeScript 5.8.2
- Vite 6.2.0 (Build tool)
- Google Gemini AI SDK
- jsPDF (geração de PDFs)
- Leaflet (mapas)

**Tempo estimado**: 1-3 minutos

### 3. Verificar Instalação

```bash
npm list --depth=0
```

Deve exibir todas as dependências sem erros.

---

## ⚙️ Configuração de Ambiente

### 1. Criar Arquivo de Variáveis

Crie um arquivo `.env.local` na raiz do projeto:

```bash
touch .env.local
```

### 2. Obter Gemini API Key

1. Acesse [Google AI Studio](https://ai.google.dev)
2. Faça login com sua conta Google
3. Clique em "Get API Key"
4. Crie um novo projeto (ou use existente)
5. Copie a API Key gerada

### 3. Configurar Variáveis de Ambiente

Edite `.env.local`:

```env
# Gemini AI API Key (obrigatório)
API_KEY=SUA_GEMINI_API_KEY_AQUI

# Opcional: Configurações adicionais
VITE_APP_NAME=TrampoHero Pro
VITE_API_TIMEOUT=10000
```

**⚠️ IMPORTANTE**: 
- Nunca commite `.env.local` para o Git
- O arquivo `.gitignore` já está configurado para ignorá-lo
- Mantenha sua API key em segredo

### 4. Verificar Configuração

```bash
npm run dev
```

Se abrir sem erros, está tudo OK!

---

## 🏃 Executando o Projeto

### Modo Desenvolvimento

```bash
npm run dev
```

- Servidor local em: `http://localhost:5173`
- Hot reload automático (mudanças refletem instantaneamente)
- Erros aparecem no console do navegador

### Build de Produção

```bash
npm run build
```

- Gera pasta `dist/` com arquivos otimizados
- Minifica JavaScript e CSS
- Remove código não utilizado (tree-shaking)

### Preview da Build

```bash
npm run preview
```

- Serve a build de produção localmente
- Útil para testar antes do deploy

---

## 📁 Estrutura do Código

```
TrampoHero/
│
├── index.html              # HTML principal
├── index.tsx               # Entry point React
├── App.tsx                 # Componente principal (1542 linhas)
├── types.ts                # Definições TypeScript
│
├── services/               # Serviços externos
│   ├── geminiService.ts    # Integração Gemini AI
│   └── pdfService.ts       # Geração de PDFs
│
├── package.json            # Dependências e scripts
├── tsconfig.json           # Config TypeScript
├── vite.config.ts          # Config Vite
│
├── .env.local              # Variáveis de ambiente (não versionado)
├── .gitignore              # Arquivos ignorados pelo Git
│
└── node_modules/           # Dependências (não versionado)
```

### Detalhamento de Arquivos Chave

#### `App.tsx` (Componente Principal)

**Responsabilidades**:
- Gerenciamento de estado global
- Renderização de todas as views
- Lógica de negócio
- Integração com serviços

**Principais Seções**:
```typescript
// Estado
const [user, setUser] = useState<UserProfile>(...)
const [jobs, setJobs] = useState<Job[]>(...)
const [view, setView] = useState<View>(...)

// Handlers
const handleApply = (job: Job) => {...}
const handleCheckIn = () => {...}
const handleWithdraw = () => {...}

// Renderização
return (
  <div>
    <Header />
    {view === 'browse' && <BrowseView />}
    {view === 'wallet' && <WalletView />}
    ...
  </div>
)
```

#### `types.ts` (Definições)

**Enums**:
```typescript
enum Niche { RESTAURANT, CONSTRUCTION, EVENTS, CLEANING }
enum SubscriptionTier { FREE, PRO, ULTRA }
type JobStatus = 'open' | 'applied' | 'ongoing' | ...
```

**Interfaces Principais**:
- `UserProfile`: Dados do usuário
- `Job`: Dados de vaga
- `Transaction`: Transação financeira
- `Message`: Mensagem de chat
- `Medal`: Medalha/certificação

#### `services/geminiService.ts`

**Funções**:
- `getSmartJobInsight(job)`: Insights sobre vaga
- `generateVoiceJob(audio)`: Voz → dados estruturados
- `generateJobDescription(title, niche)`: Descrição automática
- `translateMessage(text, lang)`: Tradução
- `supportAssistant(query)`: Chatbot de suporte

#### `services/pdfService.ts`

**Função**:
- `generateContract(job, freelancer)`: Gera PDF de contrato

---

## 🛠️ Guia de Desenvolvimento

### Adicionando uma Nova View

**Exemplo**: View de Notificações

1. **Adicionar ao tipo View**:
```typescript
// App.tsx
type View = 'browse' | 'wallet' | 'active' | 'notifications';
```

2. **Criar estado se necessário**:
```typescript
const [notifications, setNotifications] = useState<Notification[]>([]);
```

3. **Criar componente**:
```typescript
const NotificationsView = () => (
  <div className="p-6">
    <h2 className="text-2xl font-black mb-4">Notificações</h2>
    {notifications.map(notif => (
      <div key={notif.id} className="bg-white p-4 rounded-xl mb-3">
        <p>{notif.text}</p>
      </div>
    ))}
  </div>
);
```

4. **Adicionar renderização condicional**:
```typescript
return (
  <div>
    {/* ... outras views */}
    {view === 'notifications' && <NotificationsView />}
  </div>
);
```

5. **Adicionar botão de navegação**:
```typescript
<button onClick={() => setView('notifications')}>
  <i className="fas fa-bell"></i>
</button>
```

---

### Criando um Novo Tipo de Medalha

1. **Adicionar ao repositório**:
```typescript
const MEDALS_REPO: Medal[] = [
  // ... existentes
  { 
    id: 'speed-demon', 
    name: 'Raio de Velocidade', 
    icon: 'fa-bolt', 
    color: 'text-yellow-500', 
    description: 'Completou 10 jobs em um dia',
    isCertified: false
  }
];
```

2. **Criar lógica de desbloqueio**:
```typescript
const checkSpeedDemon = () => {
  const today = new Date().toISOString().split('T')[0];
  const jobsToday = user.history.filter(h => h.date === today);
  
  if (jobsToday.length >= 10 && !hasMedal('speed-demon')) {
    unlockMedal('speed-demon');
  }
};
```

3. **Chamar em momento apropriado**:
```typescript
const handleCheckout = () => {
  // ... lógica existente
  checkSpeedDemon();
};
```

---

### Integrando Nova Funcionalidade de IA

**Exemplo**: Gerar título criativo para vaga

1. **Adicionar função no geminiService.ts**:
```typescript
export const generateCreativeTitle = async (niche: string, keywords: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um título criativo e chamativo para uma vaga de ${niche} 
                 que envolva: ${keywords}. Máximo 50 caracteres.`
    });
    return response.text;
  } catch (error) {
    return `Vaga de ${niche}`;
  }
};
```

2. **Usar no componente**:
```typescript
const handleGenerateTitle = async () => {
  const title = await generateCreativeTitle(
    newJobData.niche, 
    "atendimento VIP, evento corporativo"
  );
  setNewJobData(prev => ({ ...prev, title }));
};
```

---

### Adicionando Persistência ao LocalStorage

**Exemplo**: Salvar filtros preferidos

1. **Criar hook customizado**:
```typescript
const usePersistedState = <T,>(key: string, initialValue: T) => {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  
  return [state, setState] as const;
};
```

2. **Usar**:
```typescript
const [filterPrefs, setFilterPrefs] = usePersistedState('filters', {
  niche: 'All',
  minRating: 0
});
```

---

## ✅ Boas Práticas

### TypeScript

**DO** ✅:
```typescript
interface Props {
  title: string;
  onClick: (id: string) => void;
}

const Component: React.FC<Props> = ({ title, onClick }) => {
  return <button onClick={() => onClick('123')}>{title}</button>;
};
```

**DON'T** ❌:
```typescript
const Component = (props: any) => {  // Evite 'any'
  return <button>{props.title}</button>;
};
```

---

### State Management

**DO** ✅:
```typescript
// Atualize estado de forma imutável
setUser(prev => ({
  ...prev,
  wallet: {
    ...prev.wallet,
    balance: prev.wallet.balance + amount
  }
}));
```

**DON'T** ❌:
```typescript
// Mutação direta
user.wallet.balance += amount;
setUser(user);  // Não aciona re-render
```

---

### Organização de Código

**DO** ✅:
```typescript
// Funções bem nomeadas e focadas
const calculateTotalEarnings = (jobs: Job[]): number => {
  return jobs
    .filter(j => j.status === 'completed')
    .reduce((sum, j) => sum + j.payment, 0);
};

const earnings = calculateTotalEarnings(userJobs);
```

**DON'T** ❌:
```typescript
// Lógica complexa inline
const x = jobs.filter(j => j.status === 'completed')
              .reduce((s, j) => s + j.payment, 0);
```

---

### Tratamento de Erros

**DO** ✅:
```typescript
const handleSubmit = async () => {
  try {
    setLoading(true);
    const result = await apiCall();
    showToast("Sucesso!", "success");
  } catch (error) {
    console.error("API Error:", error);
    showToast("Erro ao processar. Tente novamente.", "error");
  } finally {
    setLoading(false);
  }
};
```

**DON'T** ❌:
```typescript
const handleSubmit = async () => {
  const result = await apiCall();  // Pode crashar toda a aplicação
};
```

---

### Performance

**DO** ✅:
```typescript
// Memoize cálculos pesados
const expensiveValue = useMemo(() => {
  return jobs.filter(complexCondition).sort(heavySort);
}, [jobs]);

// Debounce inputs
const debouncedSearch = useDebounce(searchTerm, 300);
```

**DON'T** ❌:
```typescript
// Recalcula a cada render
const filtered = jobs.filter(complexCondition).sort(heavySort);
```

---

## 🐛 Solução de Problemas

### Problema: "Module not found"

**Sintoma**:
```
Error: Cannot find module './services/geminiService'
```

**Solução**:
```bash
# 1. Verificar se arquivo existe
ls services/geminiService.ts

# 2. Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# 3. Reiniciar servidor dev
npm run dev
```

---

### Problema: API Key Inválida

**Sintoma**:
- Funcionalidades de IA não funcionam
- Console mostra "API_KEY is invalid"

**Solução**:
1. Verificar `.env.local`:
   ```env
   API_KEY=sua_key_aqui
   ```
2. Confirmar que não há espaços extras
3. Gerar nova key em [ai.google.dev](https://ai.google.dev)
4. Reiniciar servidor (`Ctrl+C` e `npm run dev`)

---

### Problema: Mapa não Carrega

**Sintoma**:
- Área do mapa aparece vazia/cinza

**Solução**:
1. Verificar console do navegador (F12)
2. Aguardar carregamento da biblioteca Leaflet
3. Limpar cache do navegador
4. Verificar conexão com internet (tiles do mapa são externos)

---

### Problema: Build Falha

**Sintoma**:
```
error during build:
Error: Unexpected token
```

**Solução**:
```bash
# 1. Verificar erros TypeScript
npm run tsc --noEmit

# 2. Limpar cache
rm -rf dist node_modules/.vite

# 3. Rebuild
npm run build
```

---

### Problema: LocalStorage Corrompido

**Sintoma**:
- App não carrega
- Erros de "Unexpected token in JSON"

**Solução**:
```javascript
// Console do navegador (F12)
localStorage.clear();
location.reload();
```

---

## 🚀 Deploy

### Opção 1: Vercel (Recomendado)

**Vantagens**: Grátis, CI/CD automático, CDN global

1. **Instalar Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel
```

3. **Configurar variáveis de ambiente**:
- Acesse dashboard.vercel.com
- Vá em Settings > Environment Variables
- Adicione `API_KEY`

4. **URL de produção**:
```
https://trampo-hero.vercel.app
```

---

### Opção 2: Netlify

1. **Build local**:
```bash
npm run build
```

2. **Deploy**:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

3. **Configurar variáveis**:
- Site Settings > Environment > Environment Variables
- Adicione `API_KEY`

---

### Opção 3: GitHub Pages

1. **Instalar gh-pages**:
```bash
npm install --save-dev gh-pages
```

2. **Adicionar script no package.json**:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. **Deploy**:
```bash
npm run deploy
```

⚠️ **Limitação**: GitHub Pages não suporta variáveis de ambiente server-side

---

### Checklist de Deploy

- [ ] Build sem erros (`npm run build`)
- [ ] Variáveis de ambiente configuradas
- [ ] .gitignore atualizado (não commitar `.env.local`)
- [ ] README atualizado com URL de produção
- [ ] Testes básicos passando
- [ ] Monitoramento configurado (opcional)

---

## 📊 Monitoramento e Analytics

### Google Analytics (Opcional)

1. **Criar propriedade no GA4**

2. **Adicionar ao `index.html`**:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

3. **Rastrear eventos customizados**:
```typescript
const trackEvent = (category: string, action: string) => {
  if (window.gtag) {
    window.gtag('event', action, { event_category: category });
  }
};

// Uso
trackEvent('Job', 'Apply');
trackEvent('Wallet', 'Withdraw');
```

---

## 🧪 Testes (Futuro)

### Setup de Testes

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Exemplo de Teste

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders header', () => {
    render(<App />);
    expect(screen.getByText('TrampoHero')).toBeInTheDocument();
  });
});
```

---

## 📝 Convenções de Commit

Use Conventional Commits:

```bash
feat: adiciona sistema de notificações push
fix: corrige bug no cálculo de antecipação
docs: atualiza README com instruções de deploy
style: ajusta espaçamento no header
refactor: simplifica lógica de filtros
test: adiciona testes para geminiService
chore: atualiza dependências
```

---

## 🤝 Contribuindo

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para detalhes sobre:
- Como reportar bugs
- Como sugerir features
- Processo de Pull Request
- Code of Conduct

---

## 📚 Recursos Adicionais

- [Documentação React](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vitejs.dev/guide)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 💬 Suporte

- 📧 Email: dev@trampohero.com.br
- 💬 Discord: [TrampoHero Developers](https://discord.gg/trampohero)
- 🐛 Issues: [GitHub Issues](https://github.com/tavs-coelho/TrampoHero/issues)

---

**Última atualização**: Fevereiro 2026
**Mantido por**: Equipe TrampoHero Dev
