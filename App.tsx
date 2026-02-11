
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Niche, Job, UserProfile, SubscriptionTier, Message, Medal, Course, Transaction, Invitation, Invoice, TrampoCoin, InsurancePlan, UltraPlan, CourseQuestion, CourseProgress, Certificate } from './types';
import { translateMessage, supportAssistant, getRecurrentSuggestion, generateVoiceJob, generateJobDescription } from './services/geminiService';
import { generateContract } from './services/pdfService';

declare const L: any;

// --- CONSTANTES ---
const MAX_RECENT_ITEMS = 5; // Número máximo de itens recentes a exibir (convites e notas fiscais)

// Constantes de Monetização
const COINS_PER_CURRENCY_UNIT = 10; // 1 coin a cada R$ 10 trabalhados
const COIN_TO_CURRENCY_RATE = 0.1; // 100 coins = R$ 10
const COINS_REDEMPTION_THRESHOLD = 100; // Mínimo de coins para resgatar
const STREAK_BONUS_THRESHOLD = 30; // Dias para ativar bonus de streak
const STREAK_BONUS_MULTIPLIER = 1.5; // +50% de bonus
const CREDIT_FEE_RATE = 0.039; // 3.9% ao mês
const REFERRAL_BONUS_FREELANCER = 20; // R$ 20 por indicação de freelancer
const REFERRAL_BONUS_EMPLOYER = 100; // R$ 100 por indicação de empregador
const ANALYTICS_PREMIUM_PRICE = 79; // R$ 79/mês

// --- DADOS MOCKADOS ---
const MEDALS_REPO: Medal[] = [
  { id: 'm1', name: 'Pontualidade', icon: 'fa-clock', color: 'text-amber-500', description: 'Chegou no horário em 5 trampos' },
  { id: 'm2', name: 'Mestre da Prova', icon: 'fa-camera', color: 'text-blue-500', description: 'Fotos de prova impecáveis' },
  { id: 'm3', name: 'Herói do FDS', icon: 'fa-calendar-star', color: 'text-purple-500', description: 'Trabalhou sábado e domingo' },
  { id: 'cert-1', name: 'Certificado Gastronomia', icon: 'fa-utensils', color: 'text-indigo-600', description: 'Certificado pela Hero Academy', isCertified: true },
  { id: 'm4', name: 'Segurança Certificada', icon: 'fa-hard-hat', color: 'text-orange-600', description: 'Certificado em Segurança do Trabalho', isCertified: true },
  { id: 'm5', name: 'Especialista em Plantas', icon: 'fa-drafting-compass', color: 'text-blue-600', description: 'Certificado em Leitura de Plantas', isCertified: true },
  { id: 'm6', name: 'Eletricista Básico', icon: 'fa-bolt', color: 'text-yellow-600', description: 'Certificado em Instalações Elétricas', isCertified: true },
  { id: 'm7', name: 'Organizador de Eventos', icon: 'fa-calendar-check', color: 'text-purple-600', description: 'Certificado em Organização de Eventos', isCertified: true },
  { id: 'm8', name: 'Cerimonialista', icon: 'fa-user-tie', color: 'text-slate-700', description: 'Certificado em Cerimonial e Protocolo', isCertified: true },
  { id: 'm9', name: 'Recepcionista Pro', icon: 'fa-handshake', color: 'text-pink-600', description: 'Certificado em Recepção de Eventos', isCertified: true },
  { id: 'm10', name: 'Limpeza Profissional', icon: 'fa-spray-can', color: 'text-green-600', description: 'Certificado em Técnicas de Limpeza', isCertified: true },
  { id: 'm11', name: 'Limpeza Hospitalar', icon: 'fa-hospital', color: 'text-red-600', description: 'Certificado em Limpeza Hospitalar', isCertified: true },
  { id: 'm12', name: 'Sustentabilidade', icon: 'fa-recycle', color: 'text-emerald-600', description: 'Certificado em Gestão de Resíduos', isCertified: true }
];

const COURSES: Course[] = [
  // ========== GASTRONOMIA ==========
  { 
    id: 'c1', 
    title: 'Excelência no Atendimento ao Cliente', 
    duration: '2h', 
    badgeId: 'cert-1', 
    description: 'Aprenda técnicas profissionais de atendimento para encantar clientes em restaurantes e eventos gastronômicos.',
    price: 0, 
    level: 'basic',
    niche: Niche.RESTAURANT,
    certificateIssuer: 'TrampoHero Academy',
    passingScore: 70,
    examQuestions: [
      { id: 'q1', question: 'Qual é a primeira impressão mais importante no atendimento ao cliente?', options: ['O uniforme', 'O sorriso e cordialidade', 'A rapidez', 'O conhecimento do cardápio'], correctAnswer: 1 },
      { id: 'q2', question: 'Como lidar com um cliente insatisfeito?', options: ['Ignorar a reclamação', 'Ouvir atentamente e oferecer solução', 'Culpar a cozinha', 'Pedir para falar com outro garçom'], correctAnswer: 1 },
      { id: 'q3', question: 'Qual a ordem correta de servir em uma mesa formal?', options: ['Da esquerda para direita', 'Mulheres e idosos primeiro', 'Começar pelo anfitrião', 'Ordem de chegada'], correctAnswer: 1 },
      { id: 'q4', question: 'O que fazer quando não sabe responder uma pergunta do cliente sobre o menu?', options: ['Inventar uma resposta', 'Dizer que não sabe', 'Consultar a cozinha ou gerente', 'Mudar de assunto'], correctAnswer: 2 },
      { id: 'q5', question: 'Qual a importância da higiene pessoal no atendimento?', options: ['É secundária', 'É fundamental para transmitir profissionalismo', 'Só importa na cozinha', 'Depende do tipo de restaurante'], correctAnswer: 1 }
    ]
  },
  { 
    id: 'c2', 
    title: 'Manipulação Segura de Alimentos', 
    duration: '3h', 
    badgeId: 'cert-1', 
    description: 'Normas de higiene, conservação e manipulação de alimentos segundo ANVISA.',
    price: 0, 
    level: 'basic',
    niche: Niche.RESTAURANT,
    certificateIssuer: 'TrampoHero Academy',
    passingScore: 80,
    examQuestions: [
      { id: 'q1', question: 'Qual a temperatura ideal para conservação de alimentos refrigerados?', options: ['Entre 0°C e 5°C', 'Entre 5°C e 10°C', 'Entre 10°C e 15°C', 'Qualquer temperatura abaixo de 20°C'], correctAnswer: 0 },
      { id: 'q2', question: 'Com que frequência deve-se lavar as mãos durante a manipulação de alimentos?', options: ['No início do turno', 'A cada 2 horas', 'Sempre que trocar de tarefa ou tocar superfícies contaminadas', 'Apenas quando visível sujeira'], correctAnswer: 2 },
      { id: 'q3', question: 'O que caracteriza contaminação cruzada?', options: ['Alimento vencido', 'Transferência de micro-organismos entre alimentos', 'Alimento mal cozido', 'Excesso de tempero'], correctAnswer: 1 },
      { id: 'q4', question: 'Qual o tempo máximo que alimentos quentes podem permanecer fora da refrigeração?', options: ['30 minutos', '1 hora', '2 horas', '4 horas'], correctAnswer: 2 },
      { id: 'q5', question: 'Por que não devemos usar o mesmo utensílio para alimentos crus e cozidos?', options: ['Por questão de sabor', 'Para evitar contaminação cruzada', 'Para economizar tempo', 'Não há problema em usar'], correctAnswer: 1 },
      { id: 'q6', question: 'Qual a forma correta de descongelar alimentos?', options: ['Na pia em temperatura ambiente', 'No micro-ondas ou refrigerador', 'Sob água quente', 'Ao sol'], correctAnswer: 1 }
    ]
  },
  { 
    id: 'c3', 
    title: 'Barista Profissional - Básico', 
    duration: '4h', 
    badgeId: 'cert-1', 
    description: 'Técnicas de preparo de café expresso, cappuccino e drinks à base de café.',
    price: 0, 
    level: 'intermediate',
    niche: Niche.RESTAURANT,
    certificateIssuer: 'TrampoHero Academy',
    passingScore: 75,
    examQuestions: [
      { id: 'q1', question: 'Qual a pressão ideal para extração de café expresso?', options: ['5-7 bars', '9-10 bars', '15-20 bars', '25-30 bars'], correctAnswer: 1 },
      { id: 'q2', question: 'Quanto tempo deve durar a extração de um café expresso?', options: ['10-15 segundos', '25-30 segundos', '45-60 segundos', 'Mais de 1 minuto'], correctAnswer: 1 },
      { id: 'q3', question: 'Qual a temperatura ideal do leite vaporizado?', options: ['50-55°C', '60-65°C', '75-80°C', '90-95°C'], correctAnswer: 1 },
      { id: 'q4', question: 'O que é "crema" no café expresso?', options: ['Leite vaporizado', 'Camada de espuma dourada no topo', 'Açúcar cristalizado', 'Chocolate em pó'], correctAnswer: 1 },
      { id: 'q5', question: 'Como obter uma microespuma perfeita no leite?', options: ['Ferver o leite', 'Vaporizar com técnica correta', 'Bater no liquidificador', 'Adicionar fermento'], correctAnswer: 1 }
    ]
  },
  
  // ========== CONSTRUÇÃO ==========
  { 
    id: 'c4', 
    title: 'Segurança em Obras e Uso de EPIs', 
    duration: '3h', 
    badgeId: 'm4', 
    description: 'Prevenção de acidentes, normas NR-18 e uso correto de equipamentos de proteção individual.',
    price: 0, 
    level: 'basic',
    niche: Niche.CONSTRUCTION,
    certificateIssuer: 'TrampoHero Academy',
    passingScore: 85,
    examQuestions: [
      { id: 'q1', question: 'Qual EPI é obrigatório em TODAS as obras?', options: ['Luvas', 'Capacete', 'Óculos de proteção', 'Protetor auricular'], correctAnswer: 1 },
      { id: 'q2', question: 'Qual a altura mínima que exige uso de cinto de segurança?', options: ['1 metro', '2 metros', '3 metros', '5 metros'], correctAnswer: 1 },
      { id: 'q3', question: 'O que fazer ao identificar um risco na obra?', options: ['Ignorar e continuar trabalhando', 'Comunicar imediatamente ao encarregado', 'Corrigir sozinho sem avisar', 'Esperar o fim do expediente'], correctAnswer: 1 },
      { id: 'q4', question: 'Para que serve a NR-18?', options: ['Regular salários', 'Estabelecer condições de segurança na construção civil', 'Definir jornada de trabalho', 'Regular férias'], correctAnswer: 1 },
      { id: 'q5', question: 'Qual a função do EPI?', options: ['Decoração', 'Proteger o trabalhador de riscos', 'Identificar cargo', 'Manter uniforme'], correctAnswer: 1 },
      { id: 'q6', question: 'Quem é responsável por fornecer os EPIs?', options: ['O próprio trabalhador', 'O empregador', 'O sindicato', 'O governo'], correctAnswer: 1 }
    ]
  },
  { 
    id: 'c5', 
    title: 'Leitura e Interpretação de Plantas', 
    duration: '5h', 
    badgeId: 'm5', 
    description: 'Aprenda a ler e interpretar projetos arquitetônicos e plantas baixas.',
    price: 0, 
    level: 'intermediate',
    niche: Niche.CONSTRUCTION,
    certificateIssuer: 'TrampoHero Academy',
    passingScore: 75,
    examQuestions: [
      { id: 'q1', question: 'O que representa uma linha tracejada em uma planta baixa?', options: ['Parede demolida', 'Elemento acima do plano de corte', 'Erro no projeto', 'Parede externa'], correctAnswer: 1 },
      { id: 'q2', question: 'Qual a escala mais comum para plantas baixas residenciais?', options: ['1:10', '1:50', '1:100', '1:500'], correctAnswer: 1 },
      { id: 'q3', question: 'O que significa a sigla "NPT" em uma planta?', options: ['Nível Padrão Térreo', 'Nível do Piso Terminado', 'Nova Parede Traseira', 'Não Permitido Trabalho'], correctAnswer: 1 },
      { id: 'q4', question: 'Como são representadas as portas em planta baixa?', options: ['Círculo cheio', 'Arco indicando abertura', 'Linha reta', 'Quadrado'], correctAnswer: 1 },
      { id: 'q5', question: 'O que é planta de situação?', options: ['Planta interna do imóvel', 'Localização do terreno no quarteirão', 'Detalhes de acabamento', 'Planta do telhado'], correctAnswer: 1 }
    ]
  },
  { 
    id: 'c6', 
    title: 'Instalações Elétricas Residenciais Básicas', 
    duration: '6h', 
    badgeId: 'm6', 
    description: 'Fundamentos de eletricidade, circuitos residenciais e segurança elétrica.',
    price: 0, 
    level: 'intermediate',
    niche: Niche.CONSTRUCTION,
    certificateIssuer: 'TrampoHero Academy',
    passingScore: 80,
    examQuestions: [
      { id: 'q1', question: 'Qual a tensão padrão em residências brasileiras?', options: ['110V ou 220V', 'Apenas 110V', 'Apenas 220V', '380V'], correctAnswer: 0 },
      { id: 'q2', question: 'Para que serve o fio terra?', options: ['Iluminação', 'Proteção contra choques elétricos', 'Economia de energia', 'Reserva'], correctAnswer: 1 },
      { id: 'q3', question: 'Qual a cor padrão do fio neutro?', options: ['Verde', 'Azul', 'Preto', 'Vermelho'], correctAnswer: 1 },
      { id: 'q4', question: 'O que é disjuntor?', options: ['Dispositivo de iluminação', 'Proteção contra sobrecarga', 'Tomada especial', 'Tipo de fio'], correctAnswer: 1 },
      { id: 'q5', question: 'Por que não devemos sobrecarregar tomadas?', options: ['Gasta mais energia', 'Pode causar superaquecimento e incêndio', 'Estraga os eletrodomésticos', 'Não há problema'], correctAnswer: 1 },
      { id: 'q6', question: 'Qual ferramenta essencial para trabalhos elétricos?', options: ['Martelo', 'Alicate isolado', 'Serrote', 'Trena'], correctAnswer: 1 }
    ]
  },
  
  // ========== EVENTOS ==========
  { 
    id: 'c7', 
    title: 'Organização e Logística de Eventos', 
    duration: '4h', 
    badgeId: 'm7', 
    description: 'Planejamento, coordenação e execução de eventos corporativos e sociais.',
    price: 0, 
    level: 'basic',
    niche: Niche.EVENTS,
    certificateIssuer: 'TrampoHero Academy',
    passingScore: 70,
    examQuestions: [
      { id: 'q1', question: 'Qual a primeira etapa no planejamento de um evento?', options: ['Contratar fornecedores', 'Definir objetivos e público-alvo', 'Escolher decoração', 'Enviar convites'], correctAnswer: 1 },
      { id: 'q2', question: 'O que é briefing de evento?', options: ['Lista de convidados', 'Documento com informações e requisitos do evento', 'Tipo de decoração', 'Nome da equipe'], correctAnswer: 1 },
      { id: 'q3', question: 'Quanto tempo antes deve-se começar a planejar um evento médio?', options: ['1 semana', '2 semanas', '1-3 meses', '6 meses'], correctAnswer: 2 },
      { id: 'q4', question: 'O que é cronograma de evento?', options: ['Lista de gastos', 'Programação detalhada das atividades', 'Lista de convidados', 'Menu do buffet'], correctAnswer: 1 },
      { id: 'q5', question: 'Por que é importante ter plano B em eventos?', options: ['Para gastar mais dinheiro', 'Para prevenir imprevistos', 'Não é importante', 'Apenas para eventos externos'], correctAnswer: 1 }
    ]
  },
  { 
    id: 'c8', 
    title: 'Cerimonial e Protocolo', 
    duration: '3h', 
    badgeId: 'm8', 
    description: 'Regras de etiqueta, precedência e organização de eventos formais.',
    price: 0, 
    level: 'intermediate',
    niche: Niche.EVENTS,
    certificateIssuer: 'TrampoHero Academy',
    passingScore: 75,
    examQuestions: [
      { id: 'q1', question: 'O que é precedência em eventos oficiais?', options: ['Ordem de chegada', 'Hierarquia de autoridades e posições', 'Ordem alfabética', 'Idade dos participantes'], correctAnswer: 1 },
      { id: 'q2', question: 'Qual a ordem correta de apresentação?', options: ['Mais jovem ao mais velho', 'Mais velho ao mais jovem', 'Homem à mulher', 'Por ordem alfabética'], correctAnswer: 1 },
      { id: 'q3', question: 'Em um jantar formal, como usar os talheres?', options: ['De dentro para fora', 'De fora para dentro', 'Qualquer ordem', 'Apenas garfo'], correctAnswer: 1 },
      { id: 'q4', question: 'O que é dress code?', options: ['Marca de roupa', 'Código de vestimenta', 'Tipo de evento', 'Horário do evento'], correctAnswer: 1 },
      { id: 'q5', question: 'Qual a diferença entre cerimonial e protocolo?', options: ['São sinônimos', 'Cerimonial é execução, protocolo são regras', 'Protocolo é só para governo', 'Não há diferença'], correctAnswer: 1 }
    ]
  },
  { 
    id: 'c9', 
    title: 'Recepção e Atendimento em Eventos', 
    duration: '2h', 
    badgeId: 'm9', 
    description: 'Técnicas de recepção, credenciamento e atendimento ao público em eventos.',
    price: 0, 
    level: 'basic',
    niche: Niche.EVENTS,
    certificateIssuer: 'TrampoHero Academy',
    passingScore: 70,
    examQuestions: [
      { id: 'q1', question: 'Qual a postura ideal de um recepcionista de eventos?', options: ['Séria e distante', 'Simpática e prestativa', 'Engraçada e informal', 'Indiferente'], correctAnswer: 1 },
      { id: 'q2', question: 'Como lidar com convidado sem convite?', options: ['Barrar na entrada', 'Consultar organização antes de permitir entrada', 'Deixar entrar mesmo assim', 'Chamar segurança'], correctAnswer: 1 },
      { id: 'q3', question: 'O que é credenciamento?', options: ['Cobrar ingresso', 'Registro e identificação de participantes', 'Tirar fotos', 'Entregar brindes'], correctAnswer: 1 },
      { id: 'q4', question: 'Como orientar convidados sobre localização?', options: ['Apontar vagamente', 'Dar instruções claras ou acompanhar', 'Não é responsabilidade', 'Dar mapa e deixar procurar'], correctAnswer: 1 },
      { id: 'q5', question: 'Qual a importância da pontualidade na recepção?', options: ['Não é importante', 'Chegar antes dos primeiros convidados para preparação', 'Chegar junto com convidados', 'Pode chegar atrasado'], correctAnswer: 1 }
    ]
  },
  
  // ========== SERVIÇOS GERAIS / LIMPEZA ==========
  { 
    id: 'c10', 
    title: 'Técnicas Profissionais de Limpeza', 
    duration: '3h', 
    badgeId: 'm10', 
    description: 'Métodos eficientes de limpeza, produtos adequados e organização do trabalho.',
    price: 0, 
    level: 'basic',
    niche: Niche.CLEANING,
    certificateIssuer: 'TrampoHero Academy',
    passingScore: 75,
    examQuestions: [
      { id: 'q1', question: 'Qual a ordem correta de limpeza de um ambiente?', options: ['Chão, móveis, teto', 'Teto, móveis, chão', 'Móveis, chão, teto', 'Qualquer ordem'], correctAnswer: 1 },
      { id: 'q2', question: 'Por que não devemos misturar água sanitária com outros produtos?', options: ['Para economizar produto', 'Pode formar gases tóxicos', 'Não limpa bem', 'Não há problema'], correctAnswer: 1 },
      { id: 'q3', question: 'Qual a função do EPI na limpeza?', options: ['Embelezar uniforme', 'Proteger contra produtos químicos', 'Não é necessário', 'Apenas em indústrias'], correctAnswer: 1 },
      { id: 'q4', question: 'Como deve ser a diluição de produtos de limpeza?', options: ['Quanto mais concentrado melhor', 'Conforme instruções do fabricante', 'Sempre usar puro', 'Diluir bastante para economizar'], correctAnswer: 1 },
      { id: 'q5', question: 'O que fazer com resíduos de limpeza?', options: ['Jogar no ralo', 'Descartar conforme regulamentação', 'Guardar para reutilizar', 'Jogar no lixo comum'], correctAnswer: 1 },
      { id: 'q6', question: 'Qual a importância da ventilação durante limpeza?', options: ['Não é importante', 'Evitar intoxicação por produtos químicos', 'Apenas para cheiro', 'Só no verão'], correctAnswer: 1 }
    ]
  },
  { 
    id: 'c11', 
    title: 'Limpeza Hospitalar e Ambientes Sensíveis', 
    duration: '4h', 
    badgeId: 'm11', 
    description: 'Protocolos de limpeza em ambientes que exigem alto padrão de higienização.',
    price: 0, 
    level: 'intermediate',
    niche: Niche.CLEANING,
    certificateIssuer: 'TrampoHero Academy',
    passingScore: 85,
    examQuestions: [
      { id: 'q1', question: 'Qual a diferença entre limpeza e desinfecção?', options: ['São sinônimos', 'Limpeza remove sujeira, desinfecção elimina micro-organismos', 'Desinfecção é mais rápida', 'Limpeza usa mais água'], correctAnswer: 1 },
      { id: 'q2', question: 'O que são áreas críticas em ambiente hospitalar?', options: ['Áreas sujas', 'Áreas que exigem esterilização (centro cirúrgico, UTI)', 'Áreas administrativas', 'Áreas externas'], correctAnswer: 1 },
      { id: 'q3', question: 'Qual a sequência correta na limpeza hospitalar?', options: ['Áreas sujas primeiro', 'Áreas limpas para áreas sujas', 'Tanto faz', 'Áreas grandes primeiro'], correctAnswer: 1 },
      { id: 'q4', question: 'Por que usar código de cores em panos e baldes?', options: ['Estética', 'Prevenir contaminação cruzada', 'Facilitar compra', 'Não há motivo específico'], correctAnswer: 1 },
      { id: 'q5', question: 'Qual a importância da higienização das mãos?', options: ['Apenas estética', 'Principal medida de prevenção de infecções', 'Só antes do almoço', 'Não é tão importante'], correctAnswer: 1 },
      { id: 'q6', question: 'Como descartar materiais perfurocortantes?', options: ['Lixo comum', 'Caixa coletora específica', 'Embrulhar em papel', 'Jogar no vaso'], correctAnswer: 1 }
    ]
  },
  { 
    id: 'c12', 
    title: 'Gestão de Resíduos e Sustentabilidade', 
    duration: '2h', 
    badgeId: 'm12', 
    description: 'Coleta seletiva, reciclagem e práticas sustentáveis em serviços de limpeza.',
    price: 0, 
    level: 'basic',
    niche: Niche.CLEANING,
    certificateIssuer: 'TrampoHero Academy',
    passingScore: 70,
    examQuestions: [
      { id: 'q1', question: 'Qual a cor do contentor para papel reciclável?', options: ['Verde', 'Azul', 'Vermelho', 'Amarelo'], correctAnswer: 1 },
      { id: 'q2', question: 'O que são os 3 Rs da sustentabilidade?', options: ['Reusar, Reciclar, Reparar', 'Reduzir, Reutilizar, Reciclar', 'Reclamar, Rejeitar, Reciclar', 'Recolher, Reusar, Renovar'], correctAnswer: 1 },
      { id: 'q3', question: 'Por que separar resíduos é importante?', options: ['Facilita reciclagem e reduz impacto ambiental', 'Apenas questão estética', 'Não é importante', 'Só obrigatório em empresas'], correctAnswer: 0 },
      { id: 'q4', question: 'O que são resíduos orgânicos?', options: ['Plásticos', 'Restos de alimentos e materiais de origem vegetal/animal', 'Vidros', 'Metais'], correctAnswer: 1 },
      { id: 'q5', question: 'Como contribuir para sustentabilidade na limpeza?', options: ['Usar mais produtos químicos', 'Economizar água e usar produtos biodegradáveis', 'Usar sempre produtos descartáveis', 'Não há como contribuir'], correctAnswer: 1 }
    ]
  }
];

const INSURANCE_PLANS = {
  freelancer: {
    name: 'TrampoProtect Freelancer',
    price: 19.90,
    coverage: [
      { type: 'Acidentes de trabalho', maxAmount: 10000 },
      { type: 'Furto de equipamentos', maxAmount: 3000 },
      { type: 'Responsabilidade civil', maxAmount: 5000 }
    ]
  },
  employer: {
    name: 'TrampoProtect Empregador',
    price: 49.90,
    coverage: [
      { type: 'Danos causados', maxAmount: 20000 },
      { type: 'No-Show reembolso', maxAmount: 0 },
      { type: 'Furtos internos', maxAmount: 10000 }
    ]
  }
};

const TOP_TALENTS = [
  { id: 't1', name: 'Mariana Costa', role: 'Garçonete', rating: 4.9, niche: Niche.RESTAURANT, hourly: 25 },
  { id: 't2', name: 'Carlos Oliveira', role: 'Eletricista', rating: 5.0, niche: Niche.CONSTRUCTION, hourly: 60 },
  { id: 't3', name: 'Fernanda Lima', role: 'Recepcionista', rating: 4.8, niche: Niche.EVENTS, hourly: 30 },
  { id: 't4', name: 'João Kleber', role: 'Limpeza Pesada', rating: 4.7, niche: Niche.CLEANING, hourly: 20 },
  { id: 't5', name: 'Ana Souza', role: 'Bartender', rating: 5.0, niche: Niche.RESTAURANT, hourly: 35 },
  { id: 't6', name: 'Pedro Santos', role: 'Pintor', rating: 4.6, niche: Niche.CONSTRUCTION, hourly: 40 },
];

const INITIAL_JOBS: Job[] = [
  {
    id: '1', employerId: 'emp-1', title: 'Garçom de Gala (URGENTE)', employer: 'Buffet Delícia', employerRating: 4.8,
    niche: Niche.RESTAURANT, location: 'Av. Paulista, 1000 - SP', coordinates: { lat: -23.5614, lng: -46.6559 },
    payment: 180, paymentType: 'dia', description: 'Traje social próprio exigido para recepção de gala.', date: new Date().toISOString().split('T')[0],
    startTime: '18:00', status: 'open', isBoosted: true, isEscrowGuaranteed: true, minRatingRequired: 4.5
  },
  {
    id: '2', employerId: 'emp-2', title: 'Ajudante de Reforma', employer: 'Construtora Forte', employerRating: 4.2,
    niche: Niche.CONSTRUCTION, location: 'Rua Augusta, 500 - SP', coordinates: { lat: -23.5505, lng: -46.6333 },
    payment: 120, paymentType: 'dia', description: 'Auxílio geral em obra civil leve.', date: new Date().toISOString().split('T')[0],
    startTime: '08:00', status: 'open', minRatingRequired: 3.5
  },
  {
    id: '3', employerId: 'emp-1', title: 'Limpeza Pós-Evento', employer: 'Buffet Delícia', employerRating: 4.8,
    niche: Niche.CLEANING, location: 'Consolação, SP', coordinates: { lat: -23.5550, lng: -46.6600 },
    payment: 150, paymentType: 'job', description: 'Limpeza fina após casamento.', date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '02:00', status: 'open', isEscrowGuaranteed: true, minRatingRequired: 4.0
  }
];

const INITIAL_USER: UserProfile = {
  id: 'user-123', name: 'Alex Silva', bio: 'Freelancer Pro', niche: Niche.RESTAURANT, rating: 4.8,
  tier: SubscriptionTier.PRO, isPrime: false, 
  wallet: { 
    balance: 1250.40, 
    pending: 300, 
    scheduled: 180, 
    transactions: [
      { id: 't1', type: 'job_payment', amount: 150.00, date: '2023-10-25', description: 'Pgto. Buffet Delícia' },
      { id: 't2', type: 'withdrawal', amount: -500.00, date: '2023-10-24', description: 'Saque PIX' }
    ] 
  },
  role: 'freelancer', medals: [MEDALS_REPO[0], MEDALS_REPO[1]], history: [{ jobId: 'old-1', employerId: 'emp-1', date: '2023-10-01', rating: 5 }],
  favorites: ['emp-1'], 
  invitations: [], 
  invoices: [],
  trampoCoins: {
    userId: 'user-123',
    balance: 250,
    earned: [
      { id: 'tc1', type: 'coin_earned', amount: 0, date: '2023-10-25', description: '+25 TrampoCoins', coins: 25 }
    ],
    redeemed: [],
    streak: 15,
    lastActivity: new Date().toISOString(),
    streakBonus: false
  },
  referralCode: 'ALEX-HERO-123',
  analyticsAccess: 'free',
  courseProgress: [],
  certificates: []
};

// --- COMPONENTE TOAST ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => (
  <div className={`fixed top-20 right-4 z-[60] animate-in slide-in-from-right duration-300 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-xs backdrop-blur-md border ${
    type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : 
    type === 'error' ? 'bg-red-500/90 text-white border-red-400' : 
    'bg-slate-800/90 text-white border-slate-700'
  }`}>
    <i className={`fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} text-xl`}></i>
    <p className="font-bold text-xs">{message}</p>
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><i className="fas fa-times"></i></button>
  </div>
);

// --- COMPONENTE SPLASH SCREEN ---
const SplashScreen = () => (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center animate-out fade-out duration-1000 delay-1000 fill-mode-forwards pointer-events-none">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/50 mb-6 animate-bounce">
            <i className="fas fa-bolt text-4xl text-white"></i>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">TrampoHero</h1>
        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Conectando Talentos</p>
    </div>
);

// --- APP PRINCIPAL ---
const App: React.FC = () => {
  // Estado com persistência básica
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('trampoHeroUser');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [view, setView] = useState<'browse' | 'wallet' | 'active' | 'chat' | 'dashboard' | 'academy' | 'profile' | 'talents' | 'coins' | 'insurance' | 'credit' | 'analytics' | 'contracts' | 'referrals'>('browse');
  const [browseMode, setBrowseMode] = useState<'list' | 'map'>('list');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('trampoHeroMessages');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to parse messages from localStorage:', error);
      return [];
    }
  });
  const [inputText, setInputText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Estados de Criação de Vaga
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [newJobData, setNewJobData] = useState({ title: '', payment: '', niche: Niche.RESTAURANT, date: '', startTime: '', description: '' });
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // Estado Modal Prime
  const [showPrimeModal, setShowPrimeModal] = useState(false);

  // Estados de Pagamento (Gateway)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });

  // Estados de Exame/Curso
  const [showExamModal, setShowExamModal] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showExamResult, setShowExamResult] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [generatedCertificate, setGeneratedCertificate] = useState<Certificate | null>(null);

  // Filtros
  const [filterNiche, setFilterNiche] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');

  // Refs
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efeitos
  useEffect(() => {
    setTimeout(() => setShowSplash(false), 2000);
  }, []);

  useEffect(() => {
    localStorage.setItem('trampoHeroUser', JSON.stringify(user));
  }, [user]);

  // Persiste mensagens do chat
  useEffect(() => {
    localStorage.setItem('trampoHeroMessages', JSON.stringify(messages));
  }, [messages]);

  // Função helper para Toasts
  const showToast = (msg: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Carregar Job via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('jobId');
    if (jobId) {
      const job = jobs.find(j => j.id === jobId);
      if (job) setSelectedJob(job);
    }
  }, []);

  const activeJob = useMemo(() => jobs.find(j => j.id === user.activeJobId), [jobs, user.activeJobId]);
  
  const sortedOpenJobs = useMemo(() => {
    let filtered = jobs.filter(j => j.status === 'open');
    if (filterNiche !== 'All') {
        filtered = filtered.filter(j => j.niche === filterNiche);
    }
    // Ordenação: Boosted primeiro, depois valor maior
    return filtered.sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return b.payment - a.payment;
    });
  }, [jobs, filterNiche]);

  const filteredEmployerJobs = useMemo(() => {
    return jobs.filter(j => j.employerId === 'emp-1').filter(j => {
      const matchNiche = filterNiche === 'All' || j.niche === filterNiche;
      const matchStatus = filterStatus === 'All' || j.status === filterStatus;
      const matchDate = !filterDate || j.date === filterDate;
      return matchNiche && matchStatus && matchDate;
    });
  }, [jobs, filterNiche, filterStatus, filterDate]);

  useEffect(() => {
    if (user.role === 'employer') {
      getRecurrentSuggestion("Alex Silva", 5).then(setAiSuggestion);
    }
  }, [user.role]);

  // Scroll Chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lógica do Mapa
  useEffect(() => {
    if (view === 'browse' && browseMode === 'map' && mapContainerRef.current) {
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([-23.5614, -46.6559], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
        markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
      }

      sortedOpenJobs.forEach(job => {
        const icon = L.divIcon({
          className: 'custom-icon',
          html: `<div class="hero-marker ${job.isBoosted ? 'ring-4 ring-amber-400 scale-125' : ''}"><i class="fas ${job.niche === Niche.RESTAURANT ? 'fa-utensils' : 'fa-briefcase'} text-xs"></i></div>`,
          iconSize: [30, 30], iconAnchor: [15, 15]
        });

        const popupDiv = document.createElement('div');
        popupDiv.className = "p-3 min-w-[220px] font-['Inter']";
        popupDiv.innerHTML = `
            <h4 class="font-black text-slate-900 text-sm mb-1 line-clamp-1">${job.title}</h4>
            <p class="text-[10px] text-slate-400 font-bold uppercase mb-3 truncate"><i class="fas fa-building mr-1"></i> ${job.employer}</p>
            <div class="flex items-center justify-between border-t border-slate-100 pt-3 mb-4">
              <div>
                <p class="text-[8px] font-black text-slate-400 uppercase">Valor</p>
                <p class="text-xs font-black text-indigo-600">R$ ${job.payment}</p>
              </div>
              <div class="text-right">
                <p class="text-[8px] font-black text-slate-400 uppercase">Avaliação Min.</p>
                <p class="text-xs font-black text-amber-500"><i class="fas fa-star text-[8px] mr-1"></i> ${job.minRatingRequired || 'N/A'}</p>
              </div>
            </div>
            <button class="w-full py-2 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all btn-details">
              Ver Detalhes
            </button>
        `;

        const btn = popupDiv.querySelector('.btn-details');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                setSelectedJob(job);
            });
        }

        const marker = L.marker([job.coordinates.lat, job.coordinates.lng], { icon });
        
        marker.bindPopup(popupDiv, {
            closeButton: false,
            className: 'hero-popup',
            maxWidth: 260
        });

        if (markersLayerRef.current) {
          markersLayerRef.current.addLayer(marker);
        }
      });

      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [view, browseMode, sortedOpenJobs]);

  const handleApply = (job: Job) => {
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'applied' } : j));
    setUser(prev => ({ ...prev, activeJobId: job.id, wallet: { ...prev.wallet, scheduled: prev.wallet.scheduled + job.payment } }));
    setSelectedJob(null);
    setView('active');
    setIsCheckedIn(false);
    showToast("Vaga aceita! Prepare-se para o trabalho.", "success");
  };

  const handleCheckIn = () => {
    if (!activeJob) return;
    showToast("Verificando localização GPS...", "info");
    setTimeout(() => {
      setIsCheckedIn(true);
      generateContract(activeJob, user);
      showToast(`Check-in confirmado! Contrato enviado para ${user.name.toLowerCase().replace(' ','')}@email.com`, "success");
    }, 1500);
  };
  
  const handleCheckout = () => {
    if (!activeJob) return;
    if (confirm("Confirmar finalização do serviço? Certifique-se de que o contratante está ciente.")) {
        const jobPayment = activeJob.payment;
        const coinsEarned = Math.floor(jobPayment / COINS_PER_CURRENCY_UNIT);
        
        setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, status: 'completed' } : j));
        setUser(prev => {
            const newStreak = prev.trampoCoins ? prev.trampoCoins.streak + 1 : 1;
            const streakBonus = newStreak >= STREAK_BONUS_THRESHOLD;
            const actualCoins = streakBonus ? Math.floor(coinsEarned * STREAK_BONUS_MULTIPLIER) : coinsEarned;
            
            return {
                ...prev, 
                activeJobId: undefined,
                history: [...prev.history, { jobId: activeJob.id, employerId: activeJob.employerId, date: new Date().toISOString().split('T')[0] }],
                trampoCoins: prev.trampoCoins ? {
                    ...prev.trampoCoins,
                    balance: prev.trampoCoins.balance + actualCoins,
                    earned: [...prev.trampoCoins.earned, {
                        id: `tc-${Date.now()}`,
                        type: 'coin_earned',
                        amount: 0,
                        date: new Date().toISOString().split('T')[0],
                        description: `+${actualCoins} TrampoCoins${streakBonus ? ' (Streak Bonus +50%)' : ''}`,
                        coins: actualCoins
                    }],
                    streak: newStreak,
                    lastActivity: new Date().toISOString(),
                    streakBonus
                } : prev.trampoCoins
            };
        });
        setIsCheckedIn(false);
        setView('browse');
        showToast(`Trabalho concluído! +${actualCoins} TrampoCoins ganhos 🎉`, "success");
    }
  };

  const handleSubscribePrime = () => {
      setUser(prev => ({ ...prev, isPrime: true, tier: SubscriptionTier.PRO }));
      setShowPrimeModal(false);
      showToast("Bem-vindo ao Hero Prime! Benefícios ativos.", "success");
  };

  const handleUnsubscribePrime = () => {
      if(confirm("Tem certeza que deseja cancelar? Você perderá o seguro e taxas zero.")) {
          setUser(prev => ({ ...prev, isPrime: false, tier: SubscriptionTier.FREE }));
          setShowPrimeModal(false);
          showToast("Assinatura cancelada com sucesso.", "info");
      }
  };

  const handleWithdraw = () => {
    if (user.wallet.balance <= 0) {
      showToast("Saldo indisponível para saque.", "error");
      return;
    }
    const pixKey = prompt("Digite sua chave PIX (CPF, Celular ou Email):");
    if (!pixKey) return;
    const amountToWithdraw = user.wallet.balance;
    const fee = user.isPrime ? 0 : 2.50; // Taxa de saque para não-Prime
    
    if (confirm(`Confirmar saque de R$ ${amountToWithdraw.toFixed(2)} para a chave PIX: ${pixKey}?\nTaxa: R$ ${fee.toFixed(2)} ${user.isPrime ? '(Prime: Isento)' : ''}`)) {
        showToast("Processando transferência...", "info");
        setTimeout(() => {
            const newTransaction: Transaction = {
                id: Date.now().toString(),
                type: 'withdrawal',
                amount: -(amountToWithdraw + fee),
                date: new Date().toLocaleDateString('pt-BR'),
                description: `Saque PIX (${pixKey})`,
                fee: fee
            };
            setUser(prev => ({
                ...prev,
                wallet: { ...prev.wallet, balance: 0, transactions: [newTransaction, ...prev.wallet.transactions] }
            }));
            showToast("PIX realizado com sucesso!", "success");
        }, 2000);
    }
  };

  const handleAnticipate = () => {
    // Taxa variável entre 3% e 5% para não-Prime, 0% para Prime
    const randomFee = (Math.random() * (0.05 - 0.03) + 0.03); 
    const feeRate = user.isPrime ? 0 : randomFee;
    
    const scheduled = user.wallet.scheduled;
    if (scheduled <= 0) {
        showToast("Você não possui saldo agendado para antecipar.", "info");
        return;
    }

    const feeAmount = scheduled * feeRate;
    const netAmount = scheduled - feeAmount;
    const feePercentage = (feeRate * 100).toFixed(1);

    if (confirm(`Hero Pay - Antecipação de Recebíveis\n\nDeseja antecipar seus ganhos da próxima semana?\n\nValor Bruto: R$ ${scheduled.toFixed(2)}\nTaxa (${feePercentage}%): -R$ ${feeAmount.toFixed(2)}\n\nValor Líquido a Receber: R$ ${netAmount.toFixed(2)}`)) {
      const newTransaction: Transaction = {
        id: Date.now().toString(), type: 'anticipation', amount: netAmount, date: new Date().toLocaleDateString('pt-BR'),
        description: `Antecipação Hero Pay (${feePercentage}%)`, fee: feeAmount
      };
      setUser(prev => ({ 
        ...prev, 
        wallet: { 
          ...prev.wallet, balance: prev.wallet.balance + netAmount, scheduled: 0, transactions: [newTransaction, ...prev.wallet.transactions]
        } 
      }));
      showToast(`R$ ${netAmount.toFixed(2)} antecipados com sucesso!`, "success");
    }
  };

  const handleShare = async (job: Job) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?jobId=${job.id}`;
    const shareData = { title: `TrampoHero: ${job.title}`, text: `Vaga de ${job.niche} pagando R$ ${job.payment}!`, url: shareUrl };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copiado!", "success");
      }
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const newMessage: Message = { id: Date.now().toString(), senderId: user.id, text: inputText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    
    // Chat de suporte para ambos os papéis (freelancer e employer)
    const fallbackMessage = user.role === 'employer' 
      ? "Olá! Sou o assistente TrampoHero para empregadores. Como posso ajudá-lo com suas vagas e contratações?"
      : "Olá! Como posso ajudá-lo?";
    
    const response = await supportAssistant(inputText);
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      senderId: 'bot', 
      text: response || fallbackMessage, 
      timestamp: new Date().toISOString() 
    }]);
  };

  const simulateVoiceCreate = async () => {
    setIsRecording(true);
    showToast("Ouvindo... Fale a vaga.", "info");
    
    setTimeout(async () => {
      setIsRecording(false);
      const res = await generateVoiceJob("Preciso de um ajudante de cozinha para hoje 19h pagando 150 reais");
      if (res) {
        const newJob: Job = {
          id: Date.now().toString(), employerId: 'emp-1', title: res.title || "Vaga por Voz",
          employer: 'Buffet Delícia', employerRating: 4.8, niche: res.niche || Niche.RESTAURANT,
          location: 'Vila Madalena, SP', coordinates: { lat: -23.555, lng: -46.685 },
          payment: res.payment || 150, paymentType: 'dia', description: 'Criada via assistente de voz.',
          date: new Date().toISOString().split('T')[0], startTime: res.startTime || '19:00', status: 'open', minRatingRequired: 3.0
        };
        setJobs(prev => [newJob, ...prev]);
        showToast("Vaga criada por voz!", "success");
      } else {
        showToast("Não entendi, tente novamente.", "error");
      }
    }, 2500);
  };

  // Funções de Criação de Vaga Manual
  const handleAutoDescription = async () => {
    if (!newJobData.title) return showToast("Digite um título primeiro", "error");
    setIsGeneratingDesc(true);
    const desc = await generateJobDescription(newJobData.title, newJobData.niche);
    setNewJobData(prev => ({ ...prev, description: desc }));
    setIsGeneratingDesc(false);
  };

  const handleCreateJob = () => {
    if (!newJobData.title || !newJobData.payment) return showToast("Preencha título e valor.", "error");
    const newJob: Job = {
        id: Date.now().toString(),
        employerId: user.id,
        title: newJobData.title,
        employer: user.name,
        employerRating: 5.0,
        niche: newJobData.niche,
        location: 'São Paulo, SP', // Mock
        coordinates: { lat: -23.5505, lng: -46.6333 },
        payment: parseFloat(newJobData.payment),
        paymentType: 'dia',
        description: newJobData.description || "Sem descrição.",
        date: newJobData.date || new Date().toISOString().split('T')[0],
        startTime: newJobData.startTime || "09:00",
        status: 'open',
        minRatingRequired: 0
    };
    setJobs(prev => [newJob, ...prev]);
    setShowCreateJobModal(false);
    showToast("Vaga publicada com sucesso!", "success");
    setNewJobData({ title: '', payment: '', niche: Niche.RESTAURANT, date: '', startTime: '', description: '' });
  };

  // --- NOVAS FUNÇÕES PARA FUNCIONALIDADES FALTANTES ---
  const handleInviteTalent = (talentName: string, talentId?: string) => {
      // Cria novo convite e adiciona ao perfil do usuário
      // Gera ID único usando crypto API se disponível, ou fallback robusto
      const generateUniqueId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        // Fallback robusto: timestamp + performance.now() para melhor unicidade
        const timestamp = Date.now();
        const performanceTime = typeof performance !== 'undefined' ? performance.now() : Math.random() * 10000;
        const randomPart = Math.random().toString(36).slice(2);
        return `inv-${timestamp}-${performanceTime.toFixed(0)}-${randomPart}`;
      };
      
      const newInvitation: Invitation = {
          id: generateUniqueId(),
          talentName: talentName,
          talentId: talentId || `talent-${generateUniqueId()}`, // Usa ID fornecido ou gera novo (melhor fornecer ID existente)
          jobId: selectedJob?.id,
          jobTitle: selectedJob?.title || "Vaga Geral",
          status: 'pending',
          sentDate: new Date().toLocaleDateString('pt-BR')
      };
      
      setUser(prev => ({
          ...prev,
          invitations: [...(prev.invitations || []), newInvitation]
      }));
      
      showToast(`Convite enviado para ${talentName}! Você pode acompanhar na aba "Convites".`, "success");
  };

  const handleManageJob = (job: Job) => {
      setSelectedJob(job);
  };

  const handleCloseJob = (jobId: string) => {
      if(confirm("Deseja encerrar esta vaga? Nenhuma nova candidatura será aceita.")) {
          setJobs(prev => prev.map(j => j.id === jobId ? {...j, status: 'completed' } : j));
          setSelectedJob(null);
          showToast("Vaga encerrada com sucesso.", "success");
      }
  }

  // --- LÓGICA DE APROVAÇÃO E PAGAMENTO DE CANDIDATOS ---
  const handleApproveCandidate = (candidateName: string) => {
    // 1. Verificar qual vaga está selecionada
    if (!selectedJob) return;

    // 2. Verificar saldo do empregador
    if (user.wallet.balance < selectedJob.payment) {
        if(confirm(`Saldo insuficiente para aprovar ${candidateName}.\nValor do Serviço: R$ ${selectedJob.payment.toFixed(2)}\nSeu Saldo: R$ ${user.wallet.balance.toFixed(2)}\n\nDeseja recarregar sua carteira agora?`)) {
            setDepositAmount((selectedJob.payment - user.wallet.balance + 10).toString()); // Sugere valor faltante + margem
            setShowPaymentModal(true);
        }
        return;
    }

    // 3. Confirmar contratação e Debitar
    if(confirm(`Confirmar contratação de ${candidateName}?\n\nSerá debitado R$ ${selectedJob.payment.toFixed(2)} da sua carteira e retido em Escrow até a conclusão do serviço.`)) {
        // Debita do empregador
        const newTransaction: Transaction = {
            id: Date.now().toString(),
            type: 'job_payment',
            amount: -selectedJob.payment,
            date: new Date().toLocaleDateString('pt-BR'),
            description: `Contratação: ${candidateName} (${selectedJob.title})`
        };

        setUser(prev => ({
            ...prev,
            wallet: {
                ...prev.wallet,
                balance: prev.wallet.balance - selectedJob.payment,
                transactions: [newTransaction, ...prev.wallet.transactions]
            }
        }));

        // Atualiza status da vaga
        setJobs(prev => prev.map(j => j.id === selectedJob.id ? {...j, status: 'ongoing'} : j));
        setSelectedJob(null);
        showToast(`${candidateName} contratado! Valor retido em segurança.`, "success");
    }
  };

  const handleOpenAddBalance = () => {
    setDepositAmount('');
    setShowPaymentModal(true);
  };

  const handleProcessPayment = () => {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
          showToast("Valor inválido.", "error");
          return;
      }

      if (paymentMethod === 'card') {
         if (cardData.number.length < 13 || !cardData.name || !cardData.cvv) {
             showToast("Dados do cartão incompletos.", "error");
             return;
         }
      }

      setIsProcessingPayment(true);
      
      // Simulação de delay de rede
      setTimeout(() => {
          setIsProcessingPayment(false);
          const newTransaction: Transaction = {
              id: Date.now().toString(),
              type: 'deposit',
              amount: amount,
              date: new Date().toLocaleDateString('pt-BR'),
              description: `Depósito via ${paymentMethod === 'pix' ? 'PIX' : 'Cartão'}`
          };

          setUser(prev => ({
              ...prev,
              wallet: {
                  ...prev.wallet,
                  balance: prev.wallet.balance + amount,
                  transactions: [newTransaction, ...prev.wallet.transactions]
              }
          }));

          setShowPaymentModal(false);
          showToast(`Depósito de R$ ${amount.toFixed(2)} confirmado!`, "success");
          setDepositAmount('');
          setCardData({ number: '', name: '', expiry: '', cvv: '' });
      }, 2000);
  };

  const handleShowInvoices = () => {
    // Gera notas fiscais para jobs completados se ainda não existirem
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.employerId === user.id);
    const existingInvoiceJobIds = (user.invoices || []).map(inv => inv.jobId);
    
    // Gera invoices para jobs que ainda não tem
    const newInvoices: Invoice[] = completedJobs
      .filter(job => !existingInvoiceJobIds.includes(job.id))
      .map(job => ({
        id: `inv-${job.id}`,
        jobId: job.id,
        jobTitle: job.title,
        amount: job.payment,
        date: new Date().toLocaleDateString('pt-BR')
        // downloadUrl removido - será implementado com geração real de PDF
      }));
    
    if (newInvoices.length > 0) {
      setUser(prev => ({
        ...prev,
        invoices: [...(prev.invoices || []), ...newInvoices]
      }));
      showToast(`${newInvoices.length} nota(s) fiscal(is) gerada(s) com sucesso!`, "success");
    } else if ((user.invoices || []).length > 0) {
      showToast(`Você tem ${user.invoices.length} nota(s) fiscal(is) disponível(is).`, "info");
    } else {
      showToast("Nenhum trabalho concluído para gerar notas fiscais.", "info");
    }
    
    // Mostra painel de invoices
    setView('profile');
  };

  const handleStartCourse = (course: Course) => {
     // Verifica se já tem o curso
     if(user.medals.find(m => m.id === course.badgeId)) {
         showToast("Você já completou este curso!", "info");
         return;
     }

     // Se for curso pago, poderia verificar pagamento aqui
     if(course.price && course.price > 0) {
         showToast("Compra de cursos em desenvolvimento. Em breve!", "info");
         return;
     }

     // Inicia o curso - abre o modal de exame
     setCurrentCourse(course);
     setCurrentQuestionIndex(0);
     setUserAnswers([]);
     setShowExamResult(false);
     setGeneratedCertificate(null);
     setShowExamModal(true);
     showToast(`Leia o material (ebook será adicionado) e faça a prova!`, "info");
  };

  const handleAnswerQuestion = (answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (!currentCourse) return;
    
    if (currentQuestionIndex < currentCourse.examQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Última pergunta - calcular resultado
      finishExam();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishExam = () => {
    if (!currentCourse) return;
    
    // Calcula pontuação
    let correctAnswers = 0;
    currentCourse.examQuestions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / currentCourse.examQuestions.length) * 100);
    setExamScore(score);
    
    const passed = score >= currentCourse.passingScore;
    
    if (passed) {
      // Gera certificado
      const certificate: Certificate = {
        id: `cert-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        courseId: currentCourse.id,
        courseTitle: currentCourse.title,
        issuer: currentCourse.certificateIssuer,
        issueDate: new Date().toISOString().split('T')[0],
        score: score,
        certificateNumber: `TH-${Date.now().toString(36).toUpperCase()}`
      };
      
      // Armazena certificado para exibição no resultado
      setGeneratedCertificate(certificate);
      
      // Adiciona medalha
      const medal = MEDALS_REPO.find(m => m.id === currentCourse.badgeId);
      
      // Atualiza usuário
      setUser(prev => ({
        ...prev,
        medals: medal ? [...prev.medals, medal] : prev.medals,
        certificates: [...(prev.certificates || []), certificate],
        courseProgress: [
          ...(prev.courseProgress || []),
          {
            courseId: currentCourse.id,
            userId: user.id,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            examScore: score,
            examAttempts: 1,
            passed: true,
            certificateId: certificate.id
          }
        ]
      }));
      
      showToast(`Parabéns! Você foi aprovado com ${score}%!`, "success");
    } else {
      setGeneratedCertificate(null);
      showToast(`Você obteve ${score}%. Nota mínima: ${currentCourse.passingScore}%`, "error");
    }
    
    setShowExamResult(true);
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter'] pb-24">
      {showSplash && <SplashScreen />}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header com Navegação para Perfil */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3" onClick={() => setView('browse')}>
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-slate-800 transition-colors">
            <i className="fas fa-bolt text-indigo-400"></i>
          </div>
          <div className="cursor-pointer">
            <span className="font-black text-lg tracking-tighter block leading-none">TrampoHero</span>
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">PRO Version</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user.role === 'freelancer' && (
             user.isPrime ? (
                <div onClick={() => setShowPrimeModal(true)} className="bg-indigo-600 text-white flex items-center gap-1 text-[8px] font-black px-3 py-1.5 rounded-full animate-pulse shadow-lg shadow-indigo-300 cursor-pointer">
                    <i className="fas fa-crown"></i> PRIME ATIVO
                </div>
              ) : (
                <div onClick={() => setShowPrimeModal(true)} className="text-slate-300 hover:text-amber-500 cursor-pointer transition-colors">
                    <i className="fas fa-crown text-xl"></i>
                </div>
              )
          )}
          <div onClick={() => setView('profile')} className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
             <i className="fas fa-user text-slate-500 text-xs"></i>
          </div>
          <button onClick={() => setUser(prev => ({ ...prev, role: prev.role === 'freelancer' ? 'employer' : 'freelancer' }))} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border bg-white text-slate-500 border-slate-200 hover:bg-slate-50 transition-colors">
            {user.role === 'freelancer' ? 'Modo Empresa' : 'Modo Freelancer'}
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full p-4">
        {user.role === 'employer' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {view === 'dashboard' || view === 'browse' ? (
              <>
                <header className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-slate-900">Painel de Controle</h2>
                  <div className="flex gap-2">
                    <button onClick={simulateVoiceCreate} className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                      <i className={`fas ${isRecording ? 'fa-microphone' : 'fa-microphone-lines'}`}></i>
                    </button>
                    <button onClick={() => setShowCreateJobModal(true)} className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"><i className="fas fa-plus"></i></button>
                  </div>
                </header>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Vagas Ativas</p>
                       <p className="text-xl font-black text-indigo-600">{filteredEmployerJobs.filter(j => j.status === 'open').length}</p>
                   </div>
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Candidatos</p>
                       <p className="text-xl font-black text-emerald-500">12</p>
                   </div>
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Em Andamento</p>
                       <p className="text-xl font-black text-amber-500">{filteredEmployerJobs.filter(j => j.status === 'ongoing').length}</p>
                   </div>
                </div>

                {/* Talentos em Destaque (Carrossel) */}
                <div className="mb-8">
                   <div className="flex justify-between items-end mb-4 px-2">
                      <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Talentos na Região</h3>
                      <button onClick={() => setView('talents')} className="text-[10px] font-bold text-indigo-600">Ver todos</button>
                   </div>
                   <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                      {TOP_TALENTS.slice(0, 4).map(talent => (
                          <div key={talent.id} className="min-w-[140px] bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col items-center relative">
                             <div className="w-12 h-12 bg-slate-100 rounded-full mb-2 flex items-center justify-center font-black text-slate-500 text-sm">
                                {talent.name.split(' ').map(n=>n[0]).join('')}
                             </div>
                             <h4 className="font-bold text-slate-900 text-xs mb-1 text-center line-clamp-1">{talent.name}</h4>
                             <p className="text-[10px] text-slate-500 mb-2">{talent.role}</p>
                             <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full mb-3">
                                <i className="fas fa-star text-[8px] text-amber-400"></i>
                                <span className="text-[9px] font-bold text-amber-600">{talent.rating}</span>
                             </div>
                             <button onClick={() => handleInviteTalent(talent.name, talent.id)} className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-bold uppercase active:scale-95 transition-transform">Convidar</button>
                          </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 px-2">Gerenciar Minhas Vagas</h3>
                  {filteredEmployerJobs.length === 0 ? (
                    <div className="text-center py-10 opacity-50 bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <i className="fas fa-folder-open text-4xl mb-2 text-slate-300"></i>
                        <p className="text-xs font-bold text-slate-400">Nenhuma vaga criada.</p>
                        <button onClick={() => setShowCreateJobModal(true)} className="mt-4 text-[10px] font-black text-indigo-600 uppercase">Criar Primeira Vaga</button>
                    </div>
                  ) : (
                    filteredEmployerJobs.map(job => (
                        <div key={job.id} onClick={() => handleManageJob(job)} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center active:scale-[0.99]">
                           <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-2 h-2 rounded-full ${job.status === 'open' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                    <h4 className="font-bold text-slate-800 text-sm">{job.title}</h4>
                                </div>
                                <p className="text-[10px] text-slate-400">{new Date(job.date).toLocaleDateString('pt-BR')} • {job.paymentType === 'dia' ? 'Diária' : 'Total'}</p>
                           </div>
                           <div className="text-right">
                                <p className="font-black text-slate-900 text-sm">R$ {job.payment}</p>
                                <button className="text-[9px] font-bold text-indigo-600 uppercase mt-1">Gerenciar</button>
                           </div>
                        </div>
                    ))
                  )}
                </div>
              </>
            ) : view === 'talents' ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center gap-4 mb-2">
                        <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><i className="fas fa-arrow-left"></i></button>
                        <h2 className="text-2xl font-black text-slate-900">Talentos Disponíveis</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {TOP_TALENTS.map(talent => (
                            <div key={talent.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full mb-3 flex items-center justify-center font-black text-slate-500 text-lg">
                                    {talent.name.split(' ').map(n=>n[0]).join('')}
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">{talent.name}</h4>
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold mb-2 uppercase">{talent.niche}</span>
                                <div className="flex items-center gap-1 mb-4">
                                    <i className="fas fa-star text-xs text-amber-400"></i>
                                    <span className="text-xs font-bold text-slate-700">{talent.rating}</span>
                                </div>
                                <button onClick={() => handleInviteTalent(talent.name, talent.id)} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Convidar</button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : view === 'profile' ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-white p-8 rounded-[3rem] text-center border border-slate-100 shadow-lg">
                        <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
                            <i className="fas fa-building text-3xl text-indigo-600"></i>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
                        <p className="text-indigo-600 font-bold text-sm mb-4"><i className="fas fa-check-circle mr-1"></i> Empresa Verificada</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-[10px] text-slate-400 font-black uppercase">Reputação</p>
                                <p className="text-xl font-black text-slate-900"><i className="fas fa-star text-amber-400 mr-1"></i> 5.0</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-[10px] text-slate-400 font-black uppercase">Vagas Criadas</p>
                                <p className="text-xl font-black text-slate-900">{filteredEmployerJobs.length}</p>
                            </div>
                        </div>
                        <div className="mt-4 bg-slate-900 p-4 rounded-2xl text-white">
                             <p className="text-[10px] opacity-60 font-black uppercase">Total Investido em Talentos</p>
                             <p className="text-2xl font-black">R$ 4.250,00</p>
                        </div>
                    </div>
                </div>
            ) : view === 'wallet' ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                   <header className="mb-2">
                      <h2 className="text-2xl font-black text-slate-900">Carteira Corporativa</h2>
                   </header>
                   <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-10"><i className="fas fa-building-columns text-9xl"></i></div>
                       <p className="text-[10px] font-bold opacity-60 uppercase mb-2 tracking-widest">Saldo Disponível para Contratação</p>
                       <h2 className="text-5xl font-black mb-8 tracking-tighter">R$ {user.wallet.balance.toFixed(2)}</h2>
                       <div className="flex gap-3 relative z-10">
                           <button onClick={handleOpenAddBalance} className="flex-1 bg-white text-slate-900 py-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-slate-100 active:scale-95 transition-all">Adicionar Saldo</button>
                           <button onClick={handleShowInvoices} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">Notas Fiscais</button>
                       </div>
                   </div>

                   <div className="px-2">
                       <h4 className="font-black text-slate-900 text-sm mb-4 uppercase tracking-widest opacity-40">Histórico de Pagamentos</h4>
                       <div className="space-y-3">
                           <div className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                               <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><i className="fas fa-arrow-up"></i></div>
                                   <div>
                                       <p className="font-bold text-slate-800 text-sm">Pgto. Mariana Costa</p>
                                       <p className="text-[10px] text-slate-400">Ontem às 18:30</p>
                                   </div>
                               </div>
                               <p className="font-black text-slate-900">- R$ 180,00</p>
                           </div>
                           <div className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                               <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><i className="fas fa-plus"></i></div>
                                   <div>
                                       <p className="font-bold text-slate-800 text-sm">Recarga via PIX</p>
                                       <p className="text-[10px] text-slate-400">20/10/2023</p>
                                   </div>
                               </div>
                               <p className="font-black text-emerald-600">+ R$ 5.000,00</p>
                           </div>
                       </div>
                   </div>
                </div>
            ) : view === 'chat' ? (
                <div className="flex flex-col h-[calc(100vh-12rem)] animate-in fade-in duration-500">
                    <div className="flex items-center gap-4 mb-6 border-b pb-4">
                        <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><i className="fas fa-arrow-left"></i></button>
                        <div>
                             <h2 className="font-black text-slate-900">Suporte Empresarial</h2>
                             <p className="text-[10px] font-bold text-indigo-600 uppercase">Prioridade Alta</p>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="text-center mt-10 opacity-40">
                                <i className="fas fa-headset text-4xl mb-2"></i>
                                <p className="text-xs font-bold">Olá! Como posso ajudar sua empresa hoje?</p>
                            </div>
                        )}
                        {messages.map(m => (
                            <div key={m.id} className={`flex flex-col ${m.senderId === user.id ? 'items-end' : 'items-start'}`}>
                                <div className={`p-4 rounded-[1.8rem] max-w-[85%] text-sm font-medium ${m.senderId === user.id ? 'bg-slate-900 text-white' : 'bg-white border shadow-sm'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="mt-6 flex gap-3 bg-white p-3 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 px-4 bg-transparent focus:outline-none text-sm font-medium" placeholder="Digite sua dúvida..." />
                        <button onClick={handleSendMessage} className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors"><i className="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            ) : view === 'active' ? (
                 <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-in fade-in duration-500">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <i className="fas fa-users-viewfinder text-4xl text-slate-300"></i>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Monitoramento de Jobs</h3>
                    <p className="text-slate-400 text-sm mb-8">Acompanhe aqui o status em tempo real dos freelancers contratados.</p>
                    <button onClick={() => setView('dashboard')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-colors">
                        Voltar ao Painel
                    </button>
                </div>
            ) : null}
          </div>
        ) : (
          /* FREELANCER CONTENT */
          <>
            {view === 'browse' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900">Freelas Próximos</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setBrowseMode(m => m === 'list' ? 'map' : 'list')} className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
                      <i className={`fas ${browseMode === 'list' ? 'fa-map' : 'fa-list'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Filtros de Categoria (Pills) */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button onClick={() => setFilterNiche('All')} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${filterNiche === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>Todos</button>
                    {Object.values(Niche).map(n => (
                        <button key={n} onClick={() => setFilterNiche(n)} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${filterNiche === n ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>
                            {n}
                        </button>
                    ))}
                </div>

                {browseMode === 'map' ? (
                  <div className="relative h-[500px] w-full mb-6">
                    <div ref={mapContainerRef} className="h-full w-full shadow-2xl rounded-[3rem] border-4 border-white overflow-hidden z-0"></div>
                    <div className="absolute top-4 right-4 z-[1] bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">
                      Clique nos ícones
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {!user.isPrime && (
                      <div onClick={() => setShowPrimeModal(true)} className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl cursor-pointer relative overflow-hidden group hover:shadow-2xl transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><i className="fas fa-crown text-5xl"></i></div>
                        <h3 className="text-lg font-black mb-1">Seja Hero Prime</h3>
                        <p className="text-xs opacity-80 mb-4">Saque grátis, seguro e vagas VIP.</p>
                        <span className="text-[10px] font-bold uppercase bg-white/20 px-3 py-1 rounded-full group-hover:bg-white group-hover:text-indigo-600 transition-colors">Assinar agora</span>
                      </div>
                    )}
                    {sortedOpenJobs.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <i className="fas fa-search text-4xl mb-4"></i>
                            <p className="font-bold">Nenhum bico encontrado nesta categoria.</p>
                        </div>
                    ) : (
                        sortedOpenJobs.map(job => (
                        <div key={job.id} onClick={() => setSelectedJob(job)} className={`bg-white p-6 rounded-[3rem] border transition-all cursor-pointer relative active:scale-[0.98] ${job.isBoosted ? 'border-amber-400 shadow-amber-100 shadow-xl' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
                            {job.isBoosted && <div className="absolute -top-3 left-8 bg-amber-400 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest"><i className="fas fa-bolt mr-1"></i> Destaque</div>}
                            <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black text-indigo-500 uppercase">{job.niche}</span>
                            <p className="font-black text-slate-900 text-lg">R$ {job.payment}</p>
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{job.title}</h3>
                            <div className="flex items-center gap-3 mt-3">
                            <p className="text-[10px] text-slate-400 font-bold uppercase"><i className="fas fa-building mr-1"></i> {job.employer}</p>
                            {job.isEscrowGuaranteed && <span className="text-[8px] text-emerald-600 font-black uppercase flex items-center gap-1"><i className="fas fa-shield-check"></i> Seguro</span>}
                            </div>
                        </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            )}
            
            {view === 'active' && (
              activeJob ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <header>
                        <h2 className="text-2xl font-black text-slate-900">Job em Andamento</h2>
                        <p className="text-slate-500 text-sm">Realize o check-in para iniciar.</p>
                    </header>
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">{activeJob.title}</h3>
                        <p className="text-slate-400 text-sm mb-6 flex items-center gap-2"><i className="fas fa-map-marker-alt text-indigo-500"></i> {activeJob.location}</p>
                        
                        <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
                                <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${isCheckedIn ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {isCheckedIn ? 'Em Progresso' : 'Aguardando Chegada'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">Horário</span>
                                <span className="text-lg font-black text-slate-800">{activeJob.startTime}</span>
                            </div>
                        </div>

                        {!isCheckedIn ? (
                            <button onClick={handleCheckIn} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-3">
                                <i className="fas fa-map-pin"></i> Realizar Check-in
                            </button>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <i className="fas fa-check-circle text-4xl text-emerald-500 mb-2"></i>
                                    <p className="font-bold text-emerald-700">Check-in Realizado</p>
                                    <p className="text-xs text-emerald-600 mt-1">Contrato enviado por e-mail.</p>
                                </div>
                                <button onClick={handleCheckout} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all">
                                    Finalizar Job (Checkout)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-in fade-in duration-500">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <i className="fas fa-briefcase text-4xl text-slate-300"></i>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Sem Job Ativo</h3>
                    <p className="text-slate-400 text-sm mb-8">Você não aceitou nenhum trabalho ainda. Explore as vagas disponíveis!</p>
                    <button onClick={() => setView('browse')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-colors">
                        Procurar Vagas
                    </button>
                </div>
              )
            )}

            {view === 'wallet' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full"></div>
                   <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-2">Saldo Total</p>
                   <h3 className="text-6xl font-black mb-10 tracking-tighter">R$ {user.wallet.balance.toFixed(2)}</h3>
                   <div className="flex gap-4">
                      <button onClick={handleWithdraw} className="flex-1 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-xs shadow-lg active:scale-95 transition-transform">Sacar via PIX</button>
                      <button onClick={() => setShowPrimeModal(true)} className={`flex-1 py-5 rounded-[2rem] font-black text-xs transition-colors ${user.isPrime ? 'bg-indigo-600/50 text-white' : 'bg-indigo-600 text-white shadow-indigo-400 shadow-lg'}`}>
                        {user.isPrime ? 'Hero Prime Ativo' : 'Hero Prime'}
                      </button>
                   </div>
                </div>
                
                {/* HERO PAY CARD */}
                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-10"><i className="fas fa-bolt text-8xl text-amber-400"></i></div>
                   <div className="flex justify-between items-center mb-6 relative z-10">
                      <div>
                         <h4 className="font-black text-xl text-white italic tracking-tighter"><i className="fas fa-bolt text-amber-400 mr-2"></i>HERO PAY</h4>
                         <p className="text-[10px] text-slate-300">Receba seus agendamentos agora.</p>
                      </div>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full ${user.isPrime ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-900'}`}>
                         {user.isPrime ? 'TAXA ZERO' : 'TAXA 3% - 5%'}
                      </span>
                   </div>
                   <div className="flex justify-between items-end relative z-10">
                      <div>
                         <p className="text-slate-400 text-xs mb-1 uppercase tracking-widest font-bold">Saldo Agendado</p>
                         <p className="text-3xl font-black text-white">R$ {user.wallet.scheduled.toFixed(2)}</p>
                      </div>
                      <button onClick={handleAnticipate} disabled={user.wallet.scheduled === 0} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${user.wallet.scheduled === 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-amber-400 text-slate-900 hover:bg-amber-300 shadow-lg shadow-amber-900/50 active:scale-95'}`}>
                         Antecipar
                      </button>
                   </div>
                </div>

                {/* Histórico de Transações */}
                <div className="px-4">
                  <h4 className="font-black text-sm text-slate-900 mb-4">Histórico Recente</h4>
                  <div className="space-y-3">
                    {user.wallet.transactions.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Nenhuma transação.</p>
                    ) : (
                      user.wallet.transactions.map(t => (
                        <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                              t.type === 'anticipation' ? 'bg-amber-500' :
                              t.type === 'job_payment' ? 'bg-emerald-500' : 
                              t.type === 'withdrawal' ? 'bg-red-500' : 'bg-slate-400'
                            }`}>
                              <i className={`fas ${
                                t.type === 'anticipation' ? 'fa-bolt' :
                                t.type === 'job_payment' ? 'fa-briefcase' : 
                                t.type === 'withdrawal' ? 'fa-university' : 'fa-arrow-down'
                              }`}></i>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{t.description}</p>
                              <p className="text-[10px] text-slate-400">{t.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-black text-sm ${t.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                              {t.amount > 0 ? '+' : ''} R$ {t.amount.toFixed(2)}
                            </p>
                            {t.fee !== undefined && (
                                <p className={`text-[9px] font-bold ${t.fee === 0 ? 'text-emerald-500' : 'text-amber-600'}`}>
                                    Taxa: R$ {t.fee.toFixed(2)} {t.fee === 0 ? '(Prime)' : ''}
                                </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {view === 'academy' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <header>
                  <h2 className="text-2xl font-black text-slate-900">Hero Academy</h2>
                  <p className="text-slate-500 text-sm mb-4">Capacite-se com cursos gratuitos da plataforma e certificados reconhecidos.</p>
                  
                  {/* Filtro por nicho */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button 
                      onClick={() => setFilterNiche('All')}
                      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        filterNiche === 'All' 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todos
                    </button>
                    {Object.values(Niche).map(niche => (
                      <button 
                        key={niche}
                        onClick={() => setFilterNiche(niche)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                          filterNiche === niche 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {niche}
                      </button>
                    ))}
                  </div>
                </header>

                {/* Cursos agrupados por nicho */}
                <div className="space-y-6">
                  {Object.values(Niche).map(niche => {
                    const nicheCourses = COURSES.filter(c => 
                      c.niche === niche && (filterNiche === 'All' || filterNiche === niche)
                    );
                    
                    if (nicheCourses.length === 0) return null;
                    
                    return (
                      <div key={niche}>
                        <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                          <i className={`fas ${
                            niche === Niche.RESTAURANT ? 'fa-utensils' :
                            niche === Niche.CONSTRUCTION ? 'fa-hard-hat' :
                            niche === Niche.EVENTS ? 'fa-calendar-check' :
                            'fa-spray-can'
                          } text-indigo-600`}></i>
                          {niche}
                        </h3>
                        <div className="grid gap-4">
                          {nicheCourses.map(course => {
                            const isCompleted = user.medals.find(m => m.id === course.badgeId);
                            return (
                              <div 
                                key={course.id} 
                                className={`bg-white p-6 rounded-[2.5rem] border transition-all ${
                                  isCompleted 
                                    ? 'border-emerald-200 shadow-sm' 
                                    : 'border-slate-100 shadow-sm hover:shadow-md'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex gap-2 flex-wrap">
                                    <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">
                                      <i className="fas fa-clock mr-1"></i> {course.duration}
                                    </span>
                                    {course.price && course.price > 0 ? (
                                      <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">
                                        R$ {course.price}
                                      </span>
                                    ) : (
                                      <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">
                                        GRÁTIS
                                      </span>
                                    )}
                                    <span className="bg-slate-100 text-slate-600 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">
                                      {course.level === 'basic' ? 'Básico' : 
                                       course.level === 'intermediate' ? 'Intermediário' : 
                                       course.level === 'advanced' ? 'Avançado' : 'Certificação'}
                                    </span>
                                    <span className="bg-purple-50 text-purple-600 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">
                                      <i className="fas fa-question-circle mr-1"></i> {course.examQuestions.length} questões
                                    </span>
                                  </div>
                                  <i className={`fas ${MEDALS_REPO.find(m => m.id === course.badgeId)?.icon || 'fa-award'} ${
                                    isCompleted ? 'text-emerald-500' : 'text-slate-200'
                                  } text-2xl`}></i>
                                </div>
                                <h4 className="font-black text-slate-800 text-lg mb-1">{course.title}</h4>
                                <p className="text-xs text-slate-400 mb-3">{course.description}</p>
                                {!course.provider && (
                                  <p className="text-[9px] text-indigo-600 font-bold mb-3">
                                    <i className="fas fa-certificate mr-1"></i>Emissor: {course.certificateIssuer}
                                  </p>
                                )}
                                {course.provider && (
                                  <p className="text-[9px] text-indigo-600 font-bold mb-3">
                                    <i className="fas fa-graduation-cap mr-1"></i>Parceiro: {course.provider}
                                  </p>
                                )}
                                <button 
                                  onClick={() => handleStartCourse(course)} 
                                  className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                    isCompleted
                                      ? 'bg-emerald-50 text-emerald-600 cursor-default'
                                      : course.price && course.price > 0 
                                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                                  }`}
                                  disabled={!!isCompleted}
                                >
                                  {isCompleted ? (
                                    <>
                                      <i className="fas fa-check-circle mr-2"></i>Concluído
                                    </>
                                  ) : course.price && course.price > 0 ? (
                                    <>
                                      <i className="fas fa-shopping-cart mr-2"></i>Comprar Curso
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-play mr-2"></i>Iniciar Curso
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Info sobre ebooks */}
                <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-6 text-center">
                  <i className="fas fa-book-open text-3xl text-indigo-600 mb-3"></i>
                  <h3 className="font-black text-slate-900 mb-2">Material de Estudo</h3>
                  <p className="text-xs text-slate-600">
                    Em breve, ebooks interativos estarão disponíveis para complementar seu aprendizado antes das provas!
                  </p>
                </div>
              </div>
            )}

            {view === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-white p-8 rounded-[3rem] text-center border border-slate-100 shadow-lg">
                    <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
                        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white text-3xl font-black">{user.name.charAt(0)}</div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
                    <p className="text-indigo-600 font-bold text-sm mb-4">{user.tier} Member</p>
                    
                    {user.isPrime && (
                        <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-[10px] font-black text-emerald-600 uppercase">Seguro de Vida Ativo</p>
                                <p className="text-xs font-bold text-slate-700">Cobertura até R$ 20.000</p>
                            </div>
                            <i className="fas fa-shield-halved text-emerald-500 text-xl"></i>
                        </div>
                    )}

                    <div className="flex justify-center gap-2 mb-6">
                        {user.medals.map(m => (
                            <div key={m.id} title={m.name} className="w-8 h-8 rounded-full bg-slate-50 border flex items-center justify-center text-slate-400">
                                <i className={`fas ${m.icon} ${m.color}`}></i>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-[10px] text-slate-400 font-black uppercase">Reputação</p>
                            <p className="text-xl font-black text-slate-900"><i className="fas fa-star text-amber-400 mr-1"></i> {user.rating}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-[10px] text-slate-400 font-black uppercase">Jobs</p>
                            <p className="text-xl font-black text-slate-900">{user.history.length}</p>
                        </div>
                    </div>
                </div>

                {/* Seção de Convites Enviados (Apenas para Empregadores) */}
                {user.role === 'employer' && (user.invitations || []).length > 0 && (
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
                      <i className="fas fa-envelope text-indigo-600"></i>
                      Convites Enviados
                    </h3>
                    <div className="space-y-3">
                      {user.invitations.slice(0, MAX_RECENT_ITEMS).map(inv => (
                        <div key={inv.id} className="bg-slate-50 p-4 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{inv.talentName}</p>
                            <p className="text-[10px] text-slate-400">{inv.jobTitle} • {inv.sentDate}</p>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${
                            inv.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                            inv.status === 'declined' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {inv.status === 'accepted' ? 'Aceito' : inv.status === 'declined' ? 'Recusado' : 'Pendente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seção de Notas Fiscais (Apenas para Empregadores) */}
                {user.role === 'employer' && (user.invoices || []).length > 0 && (
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
                      <i className="fas fa-file-invoice text-indigo-600"></i>
                      Notas Fiscais
                    </h3>
                    <div className="space-y-3">
                      {user.invoices.slice(0, MAX_RECENT_ITEMS).map(invoice => (
                        <div key={invoice.id} className="bg-slate-50 p-4 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{invoice.jobTitle}</p>
                            <p className="text-[10px] text-slate-400">{invoice.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-slate-900 text-sm">R$ {invoice.amount.toFixed(2)}</p>
                            <button 
                              onClick={() => {
                                showToast(`Gerando PDF da nota fiscal ${invoice.id}...`, "info");
                                setTimeout(() => {
                                  showToast("PDF gerado! Download iniciado.", "success");
                                }, 1500);
                              }}
                              className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              <i className="fas fa-file-pdf mr-1"></i>Gerar PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seção de Certificados */}
                {(user.certificates || []).length > 0 && (
                  <div className="bg-white p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm">
                    <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
                      <i className="fas fa-certificate text-indigo-600"></i>
                      Meus Certificados
                    </h3>
                    <div className="space-y-3">
                      {user.certificates.map(cert => (
                        <div key={cert.id} className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl border-2 border-indigo-200">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-award text-white text-xl"></i>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-black text-slate-900 text-sm mb-1">{cert.courseTitle}</h4>
                              <p className="text-[10px] text-slate-600 mb-2">
                                <i className="fas fa-building mr-1"></i>{cert.issuer}
                              </p>
                              <div className="flex items-center gap-3 text-[9px] text-slate-500">
                                <span><i className="fas fa-calendar mr-1"></i>{cert.issueDate}</span>
                                <span><i className="fas fa-star mr-1 text-amber-500"></i>{cert.score}%</span>
                                <span className="font-mono bg-white px-2 py-0.5 rounded">#{cert.certificateNumber}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                showToast("Gerando certificado em PDF...", "info");
                                setTimeout(() => {
                                  showToast("Certificado baixado com sucesso!", "success");
                                }, 1500);
                              }}
                              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-bold hover:bg-indigo-700 transition-colors"
                            >
                              <i className="fas fa-download mr-1"></i>PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Menu de Novas Funcionalidades */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
                    <i className="fas fa-sparkles text-indigo-600"></i>
                    Recursos Exclusivos
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setView('coins')} className="p-4 bg-amber-50 rounded-xl text-left hover:bg-amber-100 transition-colors">
                      <i className="fas fa-coins text-amber-500 text-xl mb-2"></i>
                      <p className="text-xs font-black text-slate-900">TrampoCoins</p>
                      <p className="text-[9px] text-slate-500">Fidelidade</p>
                    </button>
                    <button onClick={() => setView('insurance')} className="p-4 bg-emerald-50 rounded-xl text-left hover:bg-emerald-100 transition-colors">
                      <i className="fas fa-shield-check text-emerald-500 text-xl mb-2"></i>
                      <p className="text-xs font-black text-slate-900">TrampoProtect</p>
                      <p className="text-[9px] text-slate-500">Seguro</p>
                    </button>
                    <button onClick={() => setView('credit')} className="p-4 bg-indigo-50 rounded-xl text-left hover:bg-indigo-100 transition-colors">
                      <i className="fas fa-hand-holding-dollar text-indigo-500 text-xl mb-2"></i>
                      <p className="text-xs font-black text-slate-900">TrampoCredit</p>
                      <p className="text-[9px] text-slate-500">Adiantamento</p>
                    </button>
                    <button onClick={() => setView('referrals')} className="p-4 bg-pink-50 rounded-xl text-left hover:bg-pink-100 transition-colors">
                      <i className="fas fa-user-plus text-pink-500 text-xl mb-2"></i>
                      <p className="text-xs font-black text-slate-900">Indique</p>
                      <p className="text-[9px] text-slate-500">Ganhe R$ 20</p>
                    </button>
                    <button onClick={() => setView('analytics')} className="p-4 bg-blue-50 rounded-xl text-left hover:bg-blue-100 transition-colors">
                      <i className="fas fa-chart-line text-blue-500 text-xl mb-2"></i>
                      <p className="text-xs font-black text-slate-900">Analytics</p>
                      <p className="text-[9px] text-slate-500">Métricas</p>
                    </button>
                  </div>
                </div>

                <button onClick={() => setView('academy')} className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-lg">
                    Ir para Hero Academy
                </button>
              </div>
            )}

            {view === 'chat' && (
              <div className="flex flex-col h-[calc(100vh-12rem)] animate-in fade-in duration-500">
                 <div className="flex items-center gap-4 mb-6 border-b pb-4">
                    <button onClick={() => setView('browse')} className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><i className="fas fa-arrow-left"></i></button>
                    <h2 className="font-black text-slate-900">Suporte Hero IA</h2>
                 </div>
                 <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="text-center mt-10 opacity-40">
                            <i className="fas fa-robot text-4xl mb-2"></i>
                            <p className="text-xs font-bold">Olá! Como posso ajudar?</p>
                        </div>
                    )}
                    {messages.map(m => (
                      <div key={m.id} className={`flex flex-col ${m.senderId === user.id ? 'items-end' : 'items-start'}`}>
                        <div className={`p-4 rounded-[1.8rem] max-w-[85%] text-sm font-medium ${m.senderId === user.id ? 'bg-indigo-600 text-white' : 'bg-white border shadow-sm'}`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                 </div>
                 <div className="mt-6 flex gap-3 bg-white p-3 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 px-4 bg-transparent focus:outline-none text-sm font-medium" placeholder="Digite sua mensagem..." />
                    <button onClick={handleSendMessage} className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors"><i className="fas fa-paper-plane"></i></button>
                 </div>
              </div>
            )}
          </>
        )}

        {/* ==================== FEATURE 1: TRAMPOCOINS VIEW ==================== */}
        {view === 'coins' && user.trampoCoins && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">TrampoCoins</h2>
                <p className="text-slate-500 text-sm">Sistema de fidelidade e recompensas</p>
              </div>
              <button onClick={() => setView('wallet')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
            </header>

            {/* Saldo de Coins */}
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full"></div>
              <div className="flex items-center gap-3 mb-4">
                <i className="fas fa-coins text-4xl"></i>
                <div>
                  <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Seu Saldo</p>
                  <h3 className="text-5xl font-black tracking-tighter">{user.trampoCoins.balance}</h3>
                  <p className="text-xs opacity-70 mt-1">TrampoCoins = R$ {(user.trampoCoins.balance * COIN_TO_CURRENCY_RATE).toFixed(2)}</p>
                </div>
              </div>
              
              {/* Streak Bonus */}
              <div className="mt-6 bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Streak Atual</p>
                    <p className="text-2xl font-black">{user.trampoCoins.streak} dias 🔥</p>
                  </div>
                  {user.trampoCoins.streakBonus && (
                    <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full">+50% BONUS</span>
                  )}
                </div>
                <div className="mt-3 bg-white/30 h-2 rounded-full overflow-hidden">
                  <div className="bg-white h-full rounded-full" style={{width: `${Math.min((user.trampoCoins.streak / STREAK_BONUS_THRESHOLD) * 100, 100)}%`}}></div>
                </div>
                <p className="text-xs mt-2 opacity-80">
                  {user.trampoCoins.streak >= STREAK_BONUS_THRESHOLD 
                    ? 'Bonus ativo! Continue trabalhando para manter.' 
                    : `${STREAK_BONUS_THRESHOLD - user.trampoCoins.streak} dias para +50% bonus`}
                </p>
              </div>
            </div>

            {/* Como Funciona */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
                <i className="fas fa-lightbulb text-amber-500"></i> Como Ganhar Coins
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-black">1</div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">Trabalhe e Ganhe</p>
                    <p className="text-xs text-slate-500">1 coin a cada R$ 10 trabalhados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black">2</div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">Mantenha o Streak</p>
                    <p className="text-xs text-slate-500">30 dias = +50% bonus em coins</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-black">3</div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">Resgate Descontos</p>
                    <p className="text-xs text-slate-500">100 coins = R$ 10 de desconto</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resgatar */}
            <button 
              onClick={() => {
                if (user.trampoCoins.balance >= COINS_REDEMPTION_THRESHOLD) {
                  const redeemValue = COINS_REDEMPTION_THRESHOLD * COIN_TO_CURRENCY_RATE;
                  showToast(`${COINS_REDEMPTION_THRESHOLD} TrampoCoins resgatados! R$ ${redeemValue.toFixed(2)} adicionados à carteira`, "success");
                  setUser(prev => prev.trampoCoins ? {
                    ...prev,
                    wallet: { ...prev.wallet, balance: prev.wallet.balance + redeemValue },
                    trampoCoins: { ...prev.trampoCoins, balance: prev.trampoCoins.balance - COINS_REDEMPTION_THRESHOLD }
                  } : prev);
                } else {
                  showToast(`Você precisa de ${COINS_REDEMPTION_THRESHOLD - user.trampoCoins.balance} coins para resgatar`, "error");
                }
              }}
              disabled={user.trampoCoins.balance < COINS_REDEMPTION_THRESHOLD}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest ${user.trampoCoins.balance >= COINS_REDEMPTION_THRESHOLD ? 'bg-slate-900 text-white shadow-xl active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              Resgatar {COINS_REDEMPTION_THRESHOLD} Coins = R$ {(COINS_REDEMPTION_THRESHOLD * COIN_TO_CURRENCY_RATE).toFixed(0)}
            </button>
              Resgatar 100 Coins = R$ 10
            </button>
          </div>
        )}

        {/* ==================== FEATURE 3: INSURANCE VIEW ==================== */}
        {view === 'insurance' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">TrampoProtect</h2>
                <p className="text-slate-500 text-sm">Seguro para freelancers</p>
              </div>
              <button onClick={() => setView('wallet')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
            </header>

            {/* Status do Seguro */}
            {user.insurance ? (
              <div className="bg-emerald-50 p-6 rounded-[2.5rem] border-2 border-emerald-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-shield-check text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-black text-emerald-900">Protegido</h3>
                    <p className="text-sm text-emerald-700">Plano ativo até {user.insurance.nextBillingDate}</p>
                  </div>
                </div>
                <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm">Gerenciar Plano</button>
              </div>
            ) : (
              <>
                {/* Plano Freelancer */}
                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-indigo-200 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-xl text-slate-900">Plano Freelancer</h3>
                    <span className="text-2xl font-black text-indigo-600">R$ 19,90<span className="text-sm text-slate-400">/mês</span></span>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <i className="fas fa-check-circle text-emerald-500"></i>
                      <span>Acidentes de trabalho até R$ 10.000</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <i className="fas fa-check-circle text-emerald-500"></i>
                      <span>Furto de equipamentos até R$ 3.000</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <i className="fas fa-check-circle text-emerald-500"></i>
                      <span>Responsabilidade civil até R$ 5.000</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <i className="fas fa-check-circle text-emerald-500"></i>
                      <span>Auxílio-doença R$ 50/dia</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      showToast("Seguro TrampoProtect contratado com sucesso!", "success");
                      setUser(prev => ({
                        ...prev,
                        insurance: {
                          type: 'freelancer',
                          plan: INSURANCE_PLANS.freelancer,
                          startDate: new Date().toISOString(),
                          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          isActive: true,
                          claims: []
                        }
                      }));
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95"
                  >
                    Contratar Agora
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== FEATURE 6: TRAMPOCREDIT VIEW ==================== */}
        {view === 'credit' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">TrampoCredit</h2>
                <p className="text-slate-500 text-sm">Adiantamento salarial rápido</p>
              </div>
              <button onClick={() => setView('wallet')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
            </header>

            {/* Limite Disponível */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[3rem] text-white shadow-2xl">
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-2">Limite Disponível</p>
              <h3 className="text-5xl font-black mb-4">R$ 500,00</h3>
              <p className="text-sm opacity-80">Baseado no seu histórico de trabalho</p>
            </div>

            {/* Solicitar Crédito */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-900 text-lg mb-4">Solicitar Adiantamento</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Valor</label>
                  <input type="number" placeholder="R$ 250,00" className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 focus:outline-indigo-500" />
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-800"><strong>Taxa:</strong> {(CREDIT_FEE_RATE * 100).toFixed(1)}% ao mês</p>
                  <p className="text-xs text-amber-800 mt-1"><strong>Aprovação:</strong> Instantânea</p>
                </div>
                <button 
                  onClick={() => showToast("Solicitação de crédito enviada! Aprovação em instantes.", "success")}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95"
                >
                  Solicitar Agora
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== FEATURE 8: REFERRALS VIEW ==================== */}
        {view === 'referrals' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Indique e Ganhe</h2>
                <p className="text-slate-500 text-sm">Programa de indicações</p>
              </div>
              <button onClick={() => setView('wallet')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
            </header>

            {/* Código de Indicação */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 rounded-[3rem] text-white shadow-2xl">
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-2">Seu Código</p>
              <div className="flex items-center justify-between bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <span className="text-2xl font-black tracking-wider">{user.referralCode}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(user.referralCode || '');
                    showToast("Código copiado!", "success");
                  }}
                  className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-black"
                >
                  COPIAR
                </button>
              </div>
              <p className="text-sm mt-4 opacity-90">Ganhe R$ {REFERRAL_BONUS_FREELANCER} por cada indicação!</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
                <p className="text-3xl font-black text-indigo-600 mb-1">5</p>
                <p className="text-xs text-slate-500 font-bold">Indicações</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
                <p className="text-3xl font-black text-emerald-600 mb-1">R$ 100</p>
                <p className="text-xs text-slate-500 font-bold">Ganhos</p>
              </div>
            </div>

            {/* Como Funciona */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100">
              <h3 className="font-black text-slate-900 text-lg mb-4">Como Funciona</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-black text-indigo-600">1.</span>
                  <span>Compartilhe seu código com amigos</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-black text-indigo-600">2.</span>
                  <span>Eles se cadastram com seu código</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-black text-indigo-600">3.</span>
                  <span>Vocês dois ganham após o 1º trabalho</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* ==================== FEATURE 10: ANALYTICS VIEW ==================== */}
        {view === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Analytics Premium</h2>
                <p className="text-slate-500 text-sm">Insights sobre seus trabalhos</p>
              </div>
              <button onClick={() => setView('wallet')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
            </header>

            {user.analyticsAccess === 'free' ? (
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-8 rounded-[3rem] border-2 border-amber-200 text-center">
                <i className="fas fa-chart-line text-5xl text-amber-600 mb-4"></i>
                <h3 className="font-black text-xl text-slate-900 mb-2">Upgrade para Premium</h3>
                <p className="text-sm text-slate-600 mb-6">Acesse métricas avançadas, histórico completo e previsões com IA</p>
                <button 
                  onClick={() => {
                    showToast(`Analytics Premium ativado! R$ ${ANALYTICS_PREMIUM_PRICE}/mês`, "success");
                    setUser(prev => ({ ...prev, analyticsAccess: 'premium' }));
                  }}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl"
                >
                  Assinar por R$ {ANALYTICS_PREMIUM_PRICE}/mês
                </button>
              </div>
            ) : (
              <>
                {/* Métricas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold mb-1">Total Ganho</p>
                    <p className="text-3xl font-black text-emerald-600">R$ 3.450</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold mb-1">Jobs Completos</p>
                    <p className="text-3xl font-black text-indigo-600">24</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold mb-1">Média/Job</p>
                    <p className="text-3xl font-black text-purple-600">R$ 143</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold mb-1">Retenção</p>
                    <p className="text-3xl font-black text-amber-600">85%</p>
                  </div>
                </div>

                {/* Gráfico Simulado */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100">
                  <h3 className="font-black text-slate-900 mb-4">Ganhos dos Últimos 30 Dias</h3>
                  <div className="flex items-end gap-2 h-32">
                    {[120, 180, 150, 200, 160, 220, 190].map((h, i) => (
                      <div key={i} className="flex-1 bg-indigo-200 rounded-t" style={{height: `${h/2.5}px`}}></div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Nav Bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-100 h-20 flex items-center justify-around px-8 z-50">
        <button onClick={() => setView(user.role === 'employer' ? 'dashboard' : 'browse')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'browse' || view === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
          <i className="fas fa-compass text-xl mb-1"></i>
          <span className="text-[8px] font-black uppercase tracking-widest">Início</span>
        </button>
        <button onClick={() => setView('active')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'active' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
          <i className="fas fa-briefcase text-xl mb-1"></i>
          <span className="text-[8px] font-black uppercase tracking-widest">Job Ativo</span>
        </button>
        <button onClick={() => setView('wallet')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'wallet' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
          <i className="fas fa-wallet text-xl mb-1"></i>
          <span className="text-[8px] font-black uppercase tracking-widest">Carteira</span>
        </button>
        <button onClick={() => setView('chat')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'chat' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
          <i className="fas fa-headset text-xl mb-1"></i>
          <span className="text-[8px] font-black uppercase tracking-widest">Suporte</span>
        </button>
      </div>

      {/* MODAL EXAME DE CURSO */}
      {showExamModal && currentCourse && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-6 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 shadow-2xl relative my-8">
            <button 
              onClick={() => {
                setShowExamModal(false);
                setCurrentCourse(null);
              }} 
              className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors text-xl"
            >
              &times;
            </button>
            
            {!showExamResult ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <i className="fas fa-graduation-cap text-3xl text-indigo-600"></i>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">{currentCourse.title}</h2>
                  <p className="text-slate-500 text-sm mb-4">{currentCourse.description}</p>
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-bold">
                      <i className="fas fa-clock mr-1"></i> {currentCourse.duration}
                    </span>
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">
                      Nota mínima: {currentCourse.passingScore}%
                    </span>
                  </div>
                </div>

                {/* Progresso */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                    <span>Questão {currentQuestionIndex + 1} de {currentCourse.examQuestions.length}</span>
                    <span>{Math.round(((currentQuestionIndex + 1) / currentCourse.examQuestions.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / currentCourse.examQuestions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Questão */}
                <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                  <h3 className="font-black text-slate-900 text-lg mb-4">
                    {currentCourse.examQuestions[currentQuestionIndex].question}
                  </h3>
                  <div className="space-y-3">
                    {currentCourse.examQuestions[currentQuestionIndex].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerQuestion(index)}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          userAnswers[currentQuestionIndex] === index
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            userAnswers[currentQuestionIndex] === index
                              ? 'bg-white text-indigo-600'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="font-medium text-sm">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botões de navegação */}
                <div className="flex gap-3">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`flex-1 py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all ${
                      currentQuestionIndex === 0
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    <i className="fas fa-arrow-left mr-2"></i> Anterior
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={userAnswers[currentQuestionIndex] === undefined}
                    className={`flex-1 py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all ${
                      userAnswers[currentQuestionIndex] === undefined
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : currentQuestionIndex === currentCourse.examQuestions.length - 1
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                    }`}
                  >
                    {currentQuestionIndex === currentCourse.examQuestions.length - 1 ? (
                      <>
                        <i className="fas fa-check mr-2"></i> Finalizar
                      </>
                    ) : (
                      <>
                        Próxima <i className="fas fa-arrow-right ml-2"></i>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Resultado do Exame */
              <div className="text-center">
                <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                  examScore >= currentCourse.passingScore
                    ? 'bg-emerald-100'
                    : 'bg-red-100'
                }`}>
                  <i className={`fas text-5xl ${
                    examScore >= currentCourse.passingScore
                      ? 'fa-trophy text-emerald-600'
                      : 'fa-times text-red-600'
                  }`}></i>
                </div>
                
                <h2 className="text-3xl font-black text-slate-900 mb-2">
                  {examScore >= currentCourse.passingScore ? 'Parabéns!' : 'Não foi dessa vez'}
                </h2>
                
                <p className="text-slate-600 mb-6">
                  {examScore >= currentCourse.passingScore
                    ? 'Você foi aprovado no curso e recebeu seu certificado!'
                    : `Você precisa de ${currentCourse.passingScore}% para ser aprovado. Estude mais e tente novamente!`
                  }
                </p>
                
                <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                  <div className="text-6xl font-black text-slate-900 mb-2">{examScore}%</div>
                  <p className="text-sm text-slate-600 font-bold">Sua pontuação</p>
                </div>
                
                {examScore >= currentCourse.passingScore && generatedCertificate && (
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 mb-6">
                    <i className="fas fa-certificate text-3xl text-indigo-600 mb-3"></i>
                    <h3 className="font-black text-slate-900 mb-2">Certificado Emitido</h3>
                    <p className="text-xs text-slate-600">
                      Certificado #{generatedCertificate.certificateNumber}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Emissor: {currentCourse.certificateIssuer}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setShowExamModal(false);
                    setCurrentCourse(null);
                    setShowExamResult(false);
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wide hover:bg-slate-800 transition-all"
                >
                  Fechar
                </button>
                
                {examScore < currentCourse.passingScore && (
                  <button
                    onClick={() => {
                      setCurrentQuestionIndex(0);
                      setUserAnswers([]);
                      setShowExamResult(false);
                      setGeneratedCertificate(null);
                    }}
                    className="w-full mt-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-wide hover:bg-indigo-700 transition-all"
                  >
                    <i className="fas fa-redo mr-2"></i> Tentar Novamente
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL HERO PRIME */}
      {showPrimeModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-indigo-900/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
                <button onClick={() => setShowPrimeModal(false)} className="absolute top-6 right-6 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">&times;</button>
                
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-amber-400 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-amber-200">
                        <i className="fas fa-crown text-4xl text-white"></i>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Hero Prime</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Acelere seus Ganhos</p>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0"><i className="fas fa-money-bill-transfer"></i></div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">Taxa Zero em Saques</h4>
                            <p className="text-[10px] text-slate-500">Economize R$ 2,50 a cada saque PIX.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><i className="fas fa-shield-halved"></i></div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">Seguro Acidentes</h4>
                            <p className="text-[10px] text-slate-500">Cobertura de até R$ 20.000 em jobs.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0"><i className="fas fa-bolt"></i></div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">Vagas VIP</h4>
                            <p className="text-[10px] text-slate-500">Acesso a vagas de alto valor (+R$ 200).</p>
                        </div>
                    </div>
                </div>

                {user.isPrime ? (
                    <button onClick={handleUnsubscribePrime} className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-100 transition-colors">
                        Cancelar Assinatura
                    </button>
                ) : (
                    <button onClick={handleSubscribePrime} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 active:scale-95 transition-all">
                        Assinar por R$ 29,90/mês
                    </button>
                )}
                
                <p className="text-center text-[9px] text-slate-400 mt-4 font-bold opacity-60">Cancele quando quiser. Termos aplicáveis.</p>
            </div>
        </div>
      )}

      {/* MODAL PAGAMENTO / DEPÓSITO */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-slate-900 text-lg">Adicionar Saldo</h3>
                    <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Valor do Depósito (R$)</label>
                        <input 
                            type="number" 
                            value={depositAmount} 
                            onChange={(e) => setDepositAmount(e.target.value)} 
                            className="w-full p-4 bg-slate-50 rounded-2xl font-black text-2xl text-slate-900 focus:outline-indigo-500 border border-transparent focus:border-indigo-200 transition-all text-center" 
                            placeholder="0,00" 
                        />
                    </div>

                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                        <button onClick={() => setPaymentMethod('pix')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${paymentMethod === 'pix' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}>
                            <i className="fas fa-qrcode mr-1"></i> PIX
                        </button>
                        <button onClick={() => setPaymentMethod('card')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${paymentMethod === 'card' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>
                            <i className="fas fa-credit-card mr-1"></i> Cartão
                        </button>
                    </div>

                    {paymentMethod === 'pix' ? (
                        <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="w-40 h-40 bg-white border-2 border-dashed border-emerald-300 rounded-2xl mx-auto flex items-center justify-center mb-4">
                                <i className="fas fa-qrcode text-6xl text-emerald-200"></i>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mb-4">Escaneie o QR Code ou use o Copia e Cola.</p>
                            <button onClick={() => showToast("Código PIX copiado!", "success")} className="text-emerald-600 text-xs font-black uppercase bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">
                                <i className="fas fa-copy mr-1"></i> Copiar Código
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="relative">
                                <i className="fas fa-credit-card absolute left-4 top-4 text-slate-300"></i>
                                <input placeholder="Número do Cartão" value={cardData.number} onChange={(e) => setCardData({...cardData, number: e.target.value})} className="w-full pl-10 p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-indigo-500" />
                            </div>
                            <div className="flex gap-3">
                                <input placeholder="Validade (MM/AA)" value={cardData.expiry} onChange={(e) => setCardData({...cardData, expiry: e.target.value})} className="flex-1 p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-indigo-500" />
                                <input placeholder="CVV" value={cardData.cvv} onChange={(e) => setCardData({...cardData, cvv: e.target.value})} className="w-20 p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-indigo-500" />
                            </div>
                            <input placeholder="Nome no Cartão" value={cardData.name} onChange={(e) => setCardData({...cardData, name: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-indigo-500" />
                        </div>
                    )}

                    <button 
                        onClick={handleProcessPayment} 
                        disabled={isProcessingPayment || !depositAmount}
                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all ${isProcessingPayment ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 active:scale-95'}`}
                    >
                        {isProcessingPayment ? (
                            <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin"></i> Processando...</span>
                        ) : (
                            `Confirmar ${paymentMethod === 'pix' ? 'Pagamento' : 'Depósito'}`
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL CRIAR VAGA */}
      {showCreateJobModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-900">Publicar Vaga</h3>
                    <button onClick={() => setShowCreateJobModal(false)} className="w-10 h-10 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100">&times;</button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Título</label>
                        <input value={newJobData.title} onChange={e => setNewJobData({...newJobData, title: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-900 focus:outline-indigo-500" placeholder="Ex: Garçom para Jantar" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Valor (R$)</label>
                            <input type="number" value={newJobData.payment} onChange={e => setNewJobData({...newJobData, payment: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-900 focus:outline-indigo-500" placeholder="150" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nicho</label>
                            <select value={newJobData.niche} onChange={e => setNewJobData({...newJobData, niche: e.target.value as Niche})} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-900 focus:outline-indigo-500">
                                {Object.values(Niche).map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-black uppercase text-slate-400">Descrição</label>
                            <button onClick={handleAutoDescription} disabled={isGeneratingDesc} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                {isGeneratingDesc ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>} Gerar com IA
                            </button>
                        </div>
                        <textarea value={newJobData.description} onChange={e => setNewJobData({...newJobData, description: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-medium text-sm text-slate-700 h-24 focus:outline-indigo-500" placeholder="Detalhes do serviço..."></textarea>
                    </div>
                    <button onClick={handleCreateJob} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Publicar Agora</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL DETALHE VAGA */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in slide-in-from-bottom-20 duration-500 overflow-hidden relative">
             {selectedJob.isBoosted && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 rotate-45 translate-x-16 -translate-y-16"></div>}
             <div className="flex justify-between items-start mb-8">
                <div>
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{selectedJob.niche}</span>
                   <h3 className="text-4xl font-black mt-4 tracking-tighter leading-tight text-slate-900">{selectedJob.title}</h3>
                </div>
                <button onClick={() => setSelectedJob(null)} className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center hover:text-slate-900 transition-colors">&times;</button>
             </div>
             
             {user.role === 'employer' && selectedJob.employerId === user.id ? (
                // --- VISUALIZAÇÃO DO EMPREGADOR (GESTÃO) ---
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-[2rem]">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-900 text-sm">Candidatos (2)</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Aguardando</span>
                        </div>
                        <div className="space-y-3">
                            <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-black text-xs">JP</div>
                                    <div>
                                        <p className="font-bold text-xs text-slate-900">João Paulo</p>
                                        <p className="text-[9px] text-amber-500 font-bold"><i className="fas fa-star"></i> 4.8</p>
                                    </div>
                                </div>
                                <button onClick={() => handleApproveCandidate('João Paulo')} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase">Aprovar</button>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-black text-xs">MA</div>
                                    <div>
                                        <p className="font-bold text-xs text-slate-900">Maria A.</p>
                                        <p className="text-[9px] text-amber-500 font-bold"><i className="fas fa-star"></i> 5.0</p>
                                    </div>
                                </div>
                                <button onClick={() => handleApproveCandidate('Maria A.')} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase">Aprovar</button>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => handleCloseJob(selectedJob.id)} className="w-full py-4 bg-red-50 text-red-600 rounded-[2rem] font-black uppercase tracking-widest hover:bg-red-100 transition-colors">
                        Encerrar Vaga
                    </button>
                </div>
             ) : (
                // --- VISUALIZAÇÃO DO FREELANCER (APLICAÇÃO) ---
                <>
                    <p className="text-slate-500 mb-10 text-base leading-relaxed font-medium">{selectedJob.description}</p>
                    <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] mb-10">
                        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagamento</p><p className="text-3xl font-black text-indigo-600">R$ {selectedJob.payment}</p></div>
                        <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min. Avaliação</p>
                        <p className={`text-sm font-bold ${selectedJob.minRatingRequired && user.rating >= selectedJob.minRatingRequired ? 'text-emerald-500' : 'text-amber-500'}`}>
                            <i className="fas fa-star mr-1"></i>
                            {selectedJob.minRatingRequired || 'Todos'}
                        </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <button onClick={() => handleApply(selectedJob)} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black shadow-2xl active:scale-95 transition-all text-xl">Aceitar Trampo Hero</button>
                        <button onClick={() => handleShare(selectedJob)} className="w-full py-4 bg-transparent text-indigo-600 font-bold text-sm uppercase tracking-widest hover:bg-indigo-50 rounded-[2.5rem] transition-colors">
                            <i className="fas fa-share-alt mr-2"></i> Compartilhar Link
                        </button>
                    </div>
                </>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
