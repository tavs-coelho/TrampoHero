import { Niche, Medal, Course, Job, UserProfile, SubscriptionTier, WeeklyChallenge, TalentRanking, StoreProduct, Advertisement, InsurancePlan } from '../types';

export const MEDALS_REPO: Medal[] = [
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

export const COURSES: Course[] = [
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

export const INSURANCE_PLANS = {
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

export const TOP_TALENTS = [
  { id: 't1', name: 'Mariana Costa', role: 'Garçonete', rating: 4.9, niche: Niche.RESTAURANT, hourly: 25 },
  { id: 't2', name: 'Carlos Oliveira', role: 'Eletricista', rating: 5.0, niche: Niche.CONSTRUCTION, hourly: 60 },
  { id: 't3', name: 'Fernanda Lima', role: 'Recepcionista', rating: 4.8, niche: Niche.EVENTS, hourly: 30 },
  { id: 't4', name: 'João Kleber', role: 'Limpeza Pesada', rating: 4.7, niche: Niche.CLEANING, hourly: 20 },
  { id: 't5', name: 'Ana Souza', role: 'Bartender', rating: 5.0, niche: Niche.RESTAURANT, hourly: 35 },
  { id: 't6', name: 'Pedro Santos', role: 'Pintor', rating: 4.6, niche: Niche.CONSTRUCTION, hourly: 40 },
];

// Weekly Challenges Mock Data
export const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'wc1',
    title: '🔥 Desafio da Semana',
    description: 'Complete 3 trampos esta semana',
    icon: 'fa-fire',
    reward: { type: 'cash', value: 30 },
    requirement: { type: 'jobs_completed', target: 3, current: 1 },
    startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    isActive: true,
    isCompleted: false
  },
  {
    id: 'wc2',
    title: '👥 Influenciador Hero',
    description: 'Indique 2 amigos e ganhe medalha exclusiva',
    icon: 'fa-users',
    reward: { type: 'medal', value: 'm-influencer' },
    requirement: { type: 'referrals', target: 2, current: 0 },
    startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    isActive: true,
    isCompleted: false
  },
  {
    id: 'wc3',
    title: '⭐ Estrela da Qualidade',
    description: 'Mantenha avaliação acima de 4.5 por 7 dias',
    icon: 'fa-star',
    reward: { type: 'coins', value: 50 },
    requirement: { type: 'rating_maintained', target: 7, current: 3 },
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    isActive: true,
    isCompleted: false
  }
];

// Talent Rankings Mock Data
export const TALENT_RANKINGS: TalentRanking[] = [
  { userId: 't2', userName: 'Carlos Oliveira', rank: 1, score: 985, niche: Niche.CONSTRUCTION, weeklyJobs: 12, monthlyJobs: 48, rating: 5.0, badge: '🥇' },
  { userId: 't5', userName: 'Ana Souza', rank: 2, score: 978, niche: Niche.RESTAURANT, weeklyJobs: 11, monthlyJobs: 45, rating: 5.0, badge: '🥈' },
  { userId: 't1', userName: 'Mariana Costa', rank: 3, score: 965, niche: Niche.RESTAURANT, weeklyJobs: 10, monthlyJobs: 42, rating: 4.9, badge: '🥉' },
  { userId: 't3', userName: 'Fernanda Lima', rank: 4, score: 952, niche: Niche.EVENTS, weeklyJobs: 10, monthlyJobs: 40, rating: 4.8 },
  { userId: 'user-123', userName: 'Alex Silva', rank: 5, score: 940, niche: Niche.RESTAURANT, weeklyJobs: 9, monthlyJobs: 38, rating: 4.8 },
  { userId: 't4', userName: 'João Kleber', rank: 6, score: 920, niche: Niche.CLEANING, weeklyJobs: 9, monthlyJobs: 36, rating: 4.7 },
  { userId: 't6', userName: 'Pedro Santos', rank: 7, score: 905, niche: Niche.CONSTRUCTION, weeklyJobs: 8, monthlyJobs: 34, rating: 4.6 },
];

// TrampoStore Mock Data
export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 'p1',
    name: 'Kit Garçom Profissional',
    category: 'uniform',
    price: 89.90,
    originalPrice: 129.90,
    description: 'Conjunto completo: camisa, calça e gravata social',
    imageUrl: 'https://via.placeholder.com/200x200?text=Kit+Garcom',
    inStock: true,
    relatedNiches: [Niche.RESTAURANT, Niche.EVENTS],
    rating: 4.7,
    reviewCount: 124
  },
  {
    id: 'p2',
    name: 'Capacete de Segurança',
    category: 'epi',
    price: 45.00,
    description: 'Capacete certificado CA 31469',
    imageUrl: 'https://via.placeholder.com/200x200?text=Capacete',
    inStock: true,
    relatedNiches: [Niche.CONSTRUCTION],
    rating: 4.9,
    reviewCount: 89
  },
  {
    id: 'p3',
    name: 'Kit Limpeza Premium',
    category: 'tools',
    price: 129.90,
    originalPrice: 169.90,
    description: 'Mop profissional, produtos e acessórios',
    imageUrl: 'https://via.placeholder.com/200x200?text=Kit+Limpeza',
    inStock: true,
    relatedNiches: [Niche.CLEANING],
    rating: 4.8,
    reviewCount: 67
  },
  {
    id: 'p4',
    name: 'Mochila Organizadora',
    category: 'accessories',
    price: 69.90,
    description: 'Mochila impermeável para equipamentos',
    imageUrl: 'https://via.placeholder.com/200x200?text=Mochila',
    inStock: true,
    relatedNiches: [Niche.RESTAURANT, Niche.CONSTRUCTION, Niche.EVENTS, Niche.CLEANING],
    rating: 4.6,
    reviewCount: 156
  },
  {
    id: 'p5',
    name: 'Luvas Anticorte',
    category: 'epi',
    price: 29.90,
    description: 'Luvas nível 5 de proteção',
    imageUrl: 'https://via.placeholder.com/200x200?text=Luvas',
    inStock: true,
    relatedNiches: [Niche.CONSTRUCTION],
    rating: 4.8,
    reviewCount: 201
  },
  {
    id: 'p6',
    name: 'Sapato Antiderrapante',
    category: 'uniform',
    price: 119.90,
    description: 'Sapato profissional para gastronomia',
    imageUrl: 'https://via.placeholder.com/200x200?text=Sapato',
    inStock: false,
    relatedNiches: [Niche.RESTAURANT],
    rating: 4.9,
    reviewCount: 178
  }
];

// TrampoAds Mock Data
export const ADVERTISEMENTS: Advertisement[] = [
  {
    id: 'ad1',
    advertiserId: 'adv-1',
    advertiserName: 'Banco Digital Hero',
    type: 'banner',
    content: {
      title: '💳 Cartão sem anuidade',
      description: 'Cashback de 2% em todas as compras. Abra sua conta grátis!',
      imageUrl: 'https://via.placeholder.com/400x100?text=Banco+Hero',
      ctaText: 'Abrir Conta',
      ctaUrl: 'https://bancohero.com.br'
    },
    targeting: {
      niches: [Niche.RESTAURANT, Niche.CONSTRUCTION, Niche.EVENTS, Niche.CLEANING],
      userActivity: 'high'
    },
    budget: 2000,
    spent: 1250,
    impressions: 45230,
    clicks: 892,
    startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 23 * 86400000).toISOString(),
    isActive: true
  },
  {
    id: 'ad2',
    advertiserId: 'adv-2',
    advertiserName: 'EPI Shop',
    type: 'sponsored_post',
    content: {
      title: '🛡️ EPIs com até 50% OFF',
      description: 'Segurança é investimento! Confira nossa seleção especial.',
      imageUrl: 'https://via.placeholder.com/400x200?text=EPI+Shop',
      ctaText: 'Ver Ofertas',
      ctaUrl: 'https://epishop.com.br'
    },
    targeting: {
      niches: [Niche.CONSTRUCTION],
      userActivity: 'medium'
    },
    budget: 500,
    spent: 320,
    impressions: 12500,
    clicks: 245,
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 11 * 86400000).toISOString(),
    isActive: true
  }
];

export const INITIAL_JOBS: Job[] = [
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

export const INITIAL_USER: UserProfile = {
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
