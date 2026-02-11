# 🤝 Guia de Contribuição - TrampoHero

Obrigado por considerar contribuir com o TrampoHero! Este documento fornece diretrizes para contribuições efetivas.

---

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Posso Contribuir?](#como-posso-contribuir)
3. [Processo de Desenvolvimento](#processo-de-desenvolvimento)
4. [Padrões de Código](#padrões-de-código)
5. [Enviando Pull Requests](#enviando-pull-requests)
6. [Reportando Bugs](#reportando-bugs)
7. [Sugerindo Features](#sugerindo-features)

---

## 📜 Código de Conduta

### Nossos Compromissos

Nós, como membros, contribuidores e líderes, nos comprometemos a tornar a participação em nossa comunidade uma experiência livre de assédio para todos.

### Padrões Esperados

**Comportamentos Encorajados** ✅:
- Usar linguagem acolhedora e inclusiva
- Respeitar pontos de vista e experiências diferentes
- Aceitar críticas construtivas com elegância
- Focar no que é melhor para a comunidade
- Demonstrar empatia com outros membros

**Comportamentos Inaceitáveis** ❌:
- Uso de linguagem ou imagens sexualizadas
- Comentários insultuosos ou depreciativos (trolling)
- Assédio público ou privado
- Publicar informações privadas de terceiros
- Conduta antiética ou antiprofissional

### Aplicação

Violações podem ser reportadas para **conduct@trampohero.com.br**. Todas as reclamações serão revisadas e investigadas.

---

## 🚀 Como Posso Contribuir?

### 1. Reportar Bugs

Encontrou um bug? Ajude-nos a melhorar:

1. **Verifique se já foi reportado** na [lista de issues](https://github.com/tavs-coelho/TrampoHero/issues)
2. Se não, **abra uma nova issue** usando o template de bug
3. Inclua:
   - Título descritivo
   - Passos para reproduzir
   - Comportamento esperado vs. atual
   - Screenshots (se aplicável)
   - Ambiente (SO, navegador, versão do Node)

### 2. Sugerir Features

Tem uma ideia? Compartilhe conosco:

1. **Verifique se já foi sugerida** na [lista de issues](https://github.com/tavs-coelho/TrampoHero/issues)
2. **Abra uma issue** usando o template de feature request
3. Explique:
   - Problema que resolve
   - Solução proposta
   - Alternativas consideradas
   - Impacto no usuário

### 3. Corrigir Bugs ou Implementar Features

1. Escolha uma issue com label `good-first-issue` ou `help-wanted`
2. Comente na issue dizendo que vai trabalhar nela
3. Siga o [Processo de Desenvolvimento](#processo-de-desenvolvimento)

### 4. Melhorar Documentação

Documentação nunca é demais! Você pode:
- Corrigir erros de digitação
- Adicionar exemplos
- Melhorar explicações
- Traduzir para outros idiomas

---

## 🛠️ Processo de Desenvolvimento

### 1. Setup Inicial

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/SEU_USUARIO/TrampoHero.git
cd TrampoHero

# Adicione o repositório original como upstream
git remote add upstream https://github.com/tavs-coelho/TrampoHero.git

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

### 2. Criar Branch

```bash
# Atualize main com upstream
git checkout main
git pull upstream main

# Crie branch descritiva
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/descricao-do-bug
```

**Padrão de Nomes de Branch**:
- `feature/nova-funcionalidade` - Para novas features
- `fix/correcao-bug` - Para correções de bugs
- `docs/atualizacao-doc` - Para documentação
- `refactor/melhoria-codigo` - Para refatorações
- `test/adicionar-testes` - Para testes

### 3. Desenvolver

```bash
# Inicie servidor de desenvolvimento
npm run dev

# Faça suas alterações
# Teste localmente
# Commit frequentemente
```

### 4. Testar

```bash
# Verifique TypeScript
npm run tsc --noEmit

# Build de produção
npm run build

# Preview da build
npm run preview

# Teste manualmente todas as funcionalidades afetadas
```

### 5. Commit

Use **Conventional Commits**:

```bash
git commit -m "feat: adiciona sistema de notificações push"
git commit -m "fix: corrige cálculo de antecipação para valores grandes"
git commit -m "docs: atualiza guia de contribuição"
git commit -m "style: ajusta espaçamento no componente de carteira"
git commit -m "refactor: simplifica lógica de filtros de vagas"
git commit -m "test: adiciona testes unitários para geminiService"
```

**Tipos de Commit**:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, ponto e vírgula, etc (sem mudança de código)
- `refactor`: Refatoração sem mudança de funcionalidade
- `test`: Adicionar ou corrigir testes
- `chore`: Tarefas de manutenção

### 6. Push e Pull Request

```bash
# Push para seu fork
git push origin feature/nome-da-feature

# Abra Pull Request no GitHub
# Preencha o template de PR
```

---

## 📝 Padrões de Código

### TypeScript

**Sempre use tipagem explícita**:

```typescript
// ✅ BOM
interface User {
  id: string;
  name: string;
  rating: number;
}

const getUser = (id: string): User | null => {
  // ...
};

// ❌ RUIM
const getUser = (id: any): any => {
  // ...
};
```

**Use enums para constantes**:

```typescript
// ✅ BOM
enum Status {
  OPEN = 'open',
  CLOSED = 'closed',
  PENDING = 'pending'
}

// ❌ RUIM
const STATUS_OPEN = 'open';
const STATUS_CLOSED = 'closed';
```

### React

**Componentes funcionais com TypeScript**:

```typescript
// ✅ BOM
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};

// ❌ RUIM
const Button = (props) => {
  return <button onClick={props.onClick}>{props.label}</button>;
};
```

**Use hooks apropriadamente**:

```typescript
// ✅ BOM - Memoização para cálculos pesados
const filteredJobs = useMemo(() => {
  return jobs.filter(j => j.niche === selectedNiche);
}, [jobs, selectedNiche]);

// ❌ RUIM - Recalcula a cada render
const filteredJobs = jobs.filter(j => j.niche === selectedNiche);
```

### CSS/Styling

**Use classes utilitárias consistentes**:

```tsx
// ✅ BOM
<div className="bg-white rounded-xl shadow-lg p-6 mb-4">
  <h2 className="text-2xl font-black text-slate-900 mb-2">Título</h2>
  <p className="text-sm text-slate-600">Descrição</p>
</div>

// ❌ RUIM
<div className="white-bg round shadow pad margin">
  <h2 className="big-title">Título</h2>
  <p className="small-text">Descrição</p>
</div>
```

### Nomenclatura

**Variáveis e Funções**: camelCase
```typescript
const userProfile = {...};
const handleCheckIn = () => {...};
```

**Componentes e Tipos**: PascalCase
```typescript
const JobCard: React.FC = () => {...};
interface UserProfile {...}
```

**Constantes**: UPPER_SNAKE_CASE
```typescript
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';
```

**Arquivos**:
- Componentes: `PascalCase.tsx` (ex: `JobCard.tsx`)
- Utilitários: `camelCase.ts` (ex: `formatDate.ts`)
- Tipos: `camelCase.ts` ou `types.ts`

---

## 🔄 Enviando Pull Requests

### Checklist Antes de Enviar

- [ ] Código segue os padrões estabelecidos
- [ ] TypeScript compila sem erros (`npm run tsc --noEmit`)
- [ ] Build de produção funciona (`npm run build`)
- [ ] Testei manualmente todas as mudanças
- [ ] Commits seguem Conventional Commits
- [ ] Branch está atualizada com `main`
- [ ] Documentação foi atualizada (se necessário)
- [ ] Adicionei comentários em código complexo

### Template de PR

```markdown
## Descrição
Breve descrição do que foi feito.

## Motivação e Contexto
Por que essa mudança é necessária? Que problema resolve?

## Tipo de Mudança
- [ ] Bug fix (correção que não quebra funcionalidade existente)
- [ ] New feature (funcionalidade que não quebra código existente)
- [ ] Breaking change (correção ou feature que quebra funcionalidade)
- [ ] Documentação

## Como Foi Testado?
Descreva os testes que executou.

## Screenshots (se aplicável)
Adicione screenshots para mudanças visuais.

## Checklist
- [ ] Meu código segue os padrões do projeto
- [ ] Revisei meu próprio código
- [ ] Comentei código complexo
- [ ] Atualizei documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Build de produção funciona
```

### Processo de Review

1. **Automated Checks**: CI/CD verifica build e TypeScript
2. **Code Review**: Mantenedores revisam o código
3. **Feedback**: Você pode precisar fazer ajustes
4. **Aprovação**: Após aprovação, PR é merged
5. **Deploy**: Mudanças vão para produção

### Tempo de Review

- **Bugs Críticos**: 1-2 dias
- **Features**: 3-7 dias
- **Documentação**: 1-3 dias

---

## 🐛 Reportando Bugs

### Template de Bug Report

```markdown
## Descrição do Bug
Descrição clara e concisa do bug.

## Passos para Reproduzir
1. Vá para '...'
2. Clique em '....'
3. Veja o erro

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Atual
O que está acontecendo.

## Screenshots
Se aplicável, adicione screenshots.

## Ambiente
- OS: [ex: Windows 10, macOS 13]
- Navegador: [ex: Chrome 120, Safari 17]
- Versão do Node: [ex: 18.17.0]
- Versão do App: [ex: 1.0.0]

## Informações Adicionais
Qualquer contexto adicional sobre o problema.
```

### Severidade

Use labels apropriadas:
- `critical`: Sistema não funciona, afeta todos os usuários
- `high`: Feature principal quebrada
- `medium`: Feature secundária com problema
- `low`: Issue cosmético ou melhoria

---

## 💡 Sugerindo Features

### Template de Feature Request

```markdown
## Problema
Descreva o problema que a feature resolve.

## Solução Proposta
Descreva como você imagina a feature funcionando.

## Alternativas Consideradas
Outras abordagens que você pensou.

## Benefícios
- Quem se beneficia?
- Qual o impacto esperado?
- Como isso alinha com a visão do produto?

## Mockups/Wireframes (opcional)
Se tiver ideias visuais, adicione aqui.

## Complexidade Estimada
- [ ] Baixa (1-2 dias)
- [ ] Média (3-7 dias)
- [ ] Alta (1-2 semanas)
- [ ] Muito Alta (2+ semanas)
```

### Priorização

Features são priorizadas usando framework RICE:
- **Reach**: Quantos usuários afeta?
- **Impact**: Qual o impacto por usuário?
- **Confidence**: Quão confiante estamos na estimativa?
- **Effort**: Quanto trabalho requer?

---

## 🧪 Escrevendo Testes

### Estrutura de Testes

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

describe('JobCard', () => {
  const mockJob = {
    id: '1',
    title: 'Test Job',
    payment: 100,
    // ...
  };

  it('should render job title', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Test Job')).toBeInTheDocument();
  });

  it('should call onApply when button is clicked', () => {
    const onApply = jest.fn();
    render(<JobCard job={mockJob} onApply={onApply} />);
    
    fireEvent.click(screen.getByText('Candidatar'));
    expect(onApply).toHaveBeenCalledWith(mockJob.id);
  });
});
```

### Cobertura de Testes

Alvos:
- **Componentes Críticos**: 80%+
- **Serviços/Utils**: 90%+
- **Tipos**: N/A (verificado pelo TypeScript)

---

## 📚 Recursos Úteis

- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Best Practices](https://react.dev/learn)
- [Conventional Commits](https://www.conventionalcommits.org)
- [Git Flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)

---

## 💬 Comunicação

### Canais

- **GitHub Issues**: Bugs e feature requests
- **GitHub Discussions**: Perguntas e ideias gerais
- **Discord**: Chat em tempo real (convite no README)
- **Email**: dev@trampohero.com.br (questões privadas)

### Boas Práticas

- ✅ Seja respeitoso e construtivo
- ✅ Forneça contexto suficiente
- ✅ Use buscas antes de perguntar
- ✅ Compartilhe conhecimento
- ❌ Evite spam ou off-topic

---

## 🏆 Reconhecimento

Contribuidores são creditados em:
- README.md (seção de agradecimentos)
- CONTRIBUTORS.md (lista completa)
- Release notes (mudanças significativas)

### Top Contribuidores

Contribuições significativas podem resultar em:
- Badge de "Core Contributor"
- Acesso antecipado a novas features
- Swag do TrampoHero (adesivos, camisetas)

---

## ❓ Dúvidas?

Se tiver qualquer dúvida sobre como contribuir:

1. Leia este guia completamente
2. Verifique a [documentação](DOCUMENTATION.md)
3. Procure em [GitHub Discussions](https://github.com/tavs-coelho/TrampoHero/discussions)
4. Entre em contato: dev@trampohero.com.br

---

**Obrigado por contribuir com o TrampoHero! 🚀**

Juntos, estamos construindo o futuro do trabalho temporário no Brasil.

---

<div align="center">

[⬆ Voltar ao topo](#-guia-de-contribuição---trampohero)

</div>
