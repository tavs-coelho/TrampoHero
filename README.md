<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 💼 TrampoHero Pro

**Plataforma Inteligente de Marketplace para Trabalhos Temporários**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

[Demo](https://ai.studio/apps/drive/12afug-qYZaHniab0TNHNzJkuPjqdh1j3) • [Documentação](DOCUMENTATION.md) • [API Docs](API_DOCUMENTATION.md) • [Guia Dev](DEVELOPER_GUIDE.md)

</div>

---

## 🎯 O que é o TrampoHero?

**TrampoHero Pro** é uma plataforma completa que revoluciona o mercado de trabalhos temporários (bicos/gigs) no Brasil. Conectamos freelancers qualificados a empresas que precisam de mão-de-obra pontual, com tecnologia de ponta e segurança máxima.

### ✨ Principais Diferenciais

- 🗺️ **Geolocalização GPS**: Validação automática de presença
- 📸 **Prova Fotográfica**: Registro visual do serviço prestado
- 💰 **Sistema Escrow**: Pagamentos garantidos e seguros
- 📄 **Contratos Digitais**: Geração automática de PDFs legais
- 🤖 **IA Integrada**: Assistente virtual, traduções e recomendações
- 🏆 **Sistema de Medalhas**: Gamificação e certificações profissionais
- ⚡ **Antecipação de Recebíveis**: Liquidez imediata via Hero Pay
- 🎓 **Hero Academy**: Cursos profissionalizantes gratuitos

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** 18+ ([Download](https://nodejs.org))
- **NPM** 9+ (incluído com Node.js)
- **Gemini API Key** ([Obter aqui](https://ai.google.dev))

### Instalação em 3 Passos

1. **Clone e instale dependências**:
   ```bash
   git clone https://github.com/tavs-coelho/TrampoHero.git
   cd TrampoHero
   npm install
   ```

2. **Configure a API Key**:
   ```bash
   echo "API_KEY=sua_gemini_api_key_aqui" > .env.local
   ```

3. **Execute o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

   Acesse: **http://localhost:5173** 🎉

---

## 📚 Documentação Completa

Criamos documentação extensiva para ajudar você a entender e contribuir com o projeto:

### 📖 Guias Disponíveis

| Documento | Descrição | Link |
|-----------|-----------|------|
| **Documentação Geral** | Visão completa do app, arquitetura e funcionalidades | [DOCUMENTATION.md](DOCUMENTATION.md) |
| **API Documentation** | Referência de todas as APIs e serviços | [API_DOCUMENTATION.md](API_DOCUMENTATION.md) |
| **Developer Guide** | Setup, desenvolvimento e boas práticas | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) |
| **Novas Features** | Propostas de funcionalidades e maximização de lucros | [NEW_FEATURES_PROPOSAL.md](NEW_FEATURES_PROPOSAL.md) |
| **Documentos Legais** | Termos de Uso, Privacidade e Conformidade LGPD | [legal/README.md](legal/README.md) |

---

## 🎨 Funcionalidades Principais

### Para Freelancers 👷

- ✅ **Busca de Vagas**: Lista ou mapa interativo com filtros avançados
- ✅ **Check-in/Check-out GPS**: Validação automática de presença
- ✅ **Carteira Digital**: Saldo disponível, pendente e agendado
- ✅ **Hero Pay**: Antecipe seus recebíveis com taxas competitivas
- ✅ **Hero Prime**: Assinatura premium com benefícios exclusivos
- ✅ **Hero Academy**: Cursos gratuitos com certificações
- ✅ **Sistema de Medalhas**: Conquistas e certificações profissionais

### Para Empregadores 🏢

- ✅ **Criação de Vagas**: Manual ou por comando de voz com IA
- ✅ **Marketplace de Talentos**: Busca avançada por habilidades
- ✅ **Sistema Escrow**: Pagamento bloqueado até conclusão
- ✅ **Notas Fiscais**: Geração automática em PDF
- ✅ **Convites Diretos**: Envie propostas para talentos favoritos
- ✅ **Dashboard Analytics**: Relatórios de economia e performance
- ✅ **Contratos Digitais**: PDFs legais gerados automaticamente

---

## 🛠️ Stack Tecnológico

```
Frontend:       React 19 + TypeScript 5.8
UI:             Custom Design System (Tailwind CSS inspired)
State:          React Hooks (useState, useMemo, useEffect)
Mapping:        Leaflet.js
AI:             Google Gemini API
PDF:            jsPDF
Build:          Vite 6.2
```

---

## 📁 Estrutura do Projeto

```
TrampoHero/
├── App.tsx                    # Componente principal (1542 linhas)
├── types.ts                   # Definições TypeScript
├── services/
│   ├── geminiService.ts       # Integração com Gemini AI
│   └── pdfService.ts          # Geração de contratos PDF
├── package.json               # Dependências e scripts
├── vite.config.ts             # Configuração Vite
├── DOCUMENTATION.md           # 📖 Documentação completa
├── API_DOCUMENTATION.md       # 🔌 Referência de APIs
├── DEVELOPER_GUIDE.md         # 🛠️ Guia de desenvolvimento
└── NEW_FEATURES_PROPOSAL.md   # 💡 Propostas de features
```

---

## 💰 Modelo de Negócio

### Fontes de Receita

1. **Taxas sobre Transações**
   - Freelancer Free: 2,5% em saques
   - Empregador: 1,5% sobre contratações

2. **Hero Pay** (Antecipação)
   - Free: 3-5% sobre valor antecipado
   - Prime: Gratuito

3. **Assinatura Hero Prime**
   - R$ 29,90/mês
   - Benefícios: Taxa zero + Antecipação grátis + Seguro

4. **Boost de Vagas**
   - R$ 15 por vaga destacada/semana

5. **Marketplace Premium**
   - R$ 99/mês (acesso ilimitado a talentos)

### Projeção (10.000 usuários ativos)
- **Receita Mensal**: ~R$ 71.900
- **Receita Anual**: ~R$ 862.800
- **Potencial com novas features**: +R$ 2.209.680/ano

📊 Veja mais detalhes em [NEW_FEATURES_PROPOSAL.md](NEW_FEATURES_PROPOSAL.md)

---

## 🔒 Segurança

- ✅ **LGPD Compliant**: Conformidade com Lei Geral de Proteção de Dados - [Ver Documentação](legal/LGPD_COMPLIANCE.md)
- ✅ **Termos de Uso**: Proteção jurídica contra vínculos empregatícios - [Ver Termos](legal/TERMOS_DE_USO.md)
- ✅ **Política de Privacidade**: Transparência no tratamento de dados - [Ver Política](legal/POLITICA_DE_PRIVACIDADE.md)
- ✅ **Sistema Escrow**: Proteção para ambas as partes
- ✅ **Validação GPS**: Anti-fraude de presença
- ✅ **Contratos Digitais**: Hash de validação único
- ✅ **Sem Armazenamento de Cartões**: PCI-DSS não necessário

---

## 🚀 Deploy

### Vercel (Recomendado)

```bash
npm i -g vercel
vercel
```

### Netlify

```bash
npm run build
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

**⚠️ Importante**: Configure a variável `API_KEY` no painel de cada plataforma.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

Consulte [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) para mais detalhes.

---

## 📊 Roadmap

### Q1 2024
- [ ] Integração com gateway de pagamento real (Stripe/MercadoPago)
- [ ] Sistema de avaliações e reviews
- [ ] Notificações push
- [ ] App mobile nativo (React Native)

### Q2 2024
- [ ] Verificação de identidade (KYC)
- [ ] Programa de indicação (referral)
- [ ] Analytics dashboard avançado

### Q3-Q4 2024
- [ ] API pública para integrações
- [ ] Expansão internacional
- [ ] Sistema de créditos corporativos

Veja roadmap completo em [NEW_FEATURES_PROPOSAL.md](NEW_FEATURES_PROPOSAL.md)

---

## 🐛 Problemas Conhecidos

Nenhum problema crítico no momento. Para reportar bugs, abra uma [Issue](https://github.com/tavs-coelho/TrampoHero/issues).

---

## 📞 Suporte

- 📧 **Email**: suporte@trampohero.com.br
- 💬 **Chat**: Disponível no app 24/7
- 📚 **Docs**: Veja os arquivos de documentação neste repositório
- 🐛 **Issues**: [GitHub Issues](https://github.com/tavs-coelho/TrampoHero/issues)

---

## 📄 Licença

Proprietário © 2026 TrampoHero Inc. Todos os direitos reservados.

---

## 👥 Equipe

Desenvolvido com ❤️ por:
- **Tavs Coelho** - [GitHub](https://github.com/tavs-coelho)

---

## 🌟 Agradecimentos

- Google Gemini AI pela integração de IA
- Comunidade React e TypeScript
- Todos os contribuidores e early adopters

---

<div align="center">

**[⬆ Voltar ao topo](#-trampohero-pro)**

Made with ⚡ by TrampoHero Team

</div>
