import { ViewType } from '../contexts/AppContext';

export interface SeoMeta {
  title: string;
  description: string;
  path: string;
}

const BASE_URL = 'https://app.trampohero.com.br';
const DEFAULT_IMAGE = `${BASE_URL}/icons/icon-512.png`;

const SEO_BY_VIEW: Record<ViewType, SeoMeta> = {
  browse: {
    title: 'Freelas próximos para trabalhar hoje | TrampoHero',
    description:
      'Encontre vagas temporárias perto de você, com pagamento claro e contratação rápida.',
    path: '/',
  },
  active: {
    title: 'Seu trampo ativo com check-in seguro | TrampoHero',
    description:
      'Acompanhe seu trabalho em andamento, check-in e comprovação de entrega em um só lugar.',
    path: '/freelancer/ativo',
  },
  wallet: {
    title: 'Carteira digital para freelancers e empresas | TrampoHero',
    description:
      'Gerencie saldo, saques e pagamentos com segurança para serviços sob demanda.',
    path: '/carteira',
  },
  chat: {
    title: 'Chat de contratação rápida | TrampoHero',
    description:
      'Converse com contratantes e talentos para acelerar fechamentos e reduzir no-show.',
    path: '/chat',
  },
  dashboard: {
    title: 'Painel de contratação para empresas | TrampoHero',
    description:
      'Publique vagas temporárias, convide talentos e gerencie contratações com eficiência.',
    path: '/empresas',
  },
  academy: {
    title: 'Hero Academy: capacitação para freelancers | TrampoHero',
    description:
      'Cursos práticos para aumentar sua taxa de aprovação e ganhar mais em cada job.',
    path: '/academy',
  },
  profile: {
    title: 'Perfil profissional e reputação | TrampoHero',
    description:
      'Mostre certificações, avaliações e histórico para receber mais convites de trabalho.',
    path: '/perfil',
  },
  talents: {
    title: 'Banco de talentos para contratação sob demanda | TrampoHero',
    description:
      'Empresas encontram freelancers avaliados por nicho, nota e disponibilidade.',
    path: '/empresas/talentos',
  },
  coins: {
    title: 'TrampoCoins e recompensas por performance | TrampoHero',
    description:
      'Ganhe e troque benefícios por desempenho e consistência em trabalhos concluídos.',
    path: '/recompensas',
  },
  insurance: {
    title: 'Seguro para freelancers ativos | TrampoHero',
    description:
      'Proteção adicional para quem trabalha com serviços temporários e eventos.',
    path: '/seguro',
  },
  credit: {
    title: 'TrampoCredit: antecipação para freelancers | TrampoHero',
    description:
      'Antecipe recebíveis com agilidade para manter fluxo de caixa e aceitar mais jobs.',
    path: '/credito',
  },
  analytics: {
    title: 'Analytics de performance de contratação | TrampoHero',
    description:
      'Métricas de economia, produtividade e eficiência para decisões de contratação.',
    path: '/analytics',
  },
  contracts: {
    title: 'Contratos digitais para jobs temporários | TrampoHero',
    description:
      'Formalize serviços com contratos digitais e histórico centralizado.',
    path: '/contratos',
  },
  referrals: {
    title: 'Indique e ganhe com a comunidade TrampoHero',
    description:
      'Convide profissionais e empresas para ampliar oportunidades e receber bônus.',
    path: '/indicacoes',
  },
  challenges: {
    title: 'Desafios semanais para aumentar ganhos | TrampoHero',
    description:
      'Complete missões e evolua sua consistência com metas gamificadas.',
    path: '/desafios',
  },
  ranking: {
    title: 'Ranking de talentos por reputação | TrampoHero',
    description:
      'Visualize destaque dos melhores profissionais por desempenho e avaliações.',
    path: '/ranking',
  },
  store: {
    title: 'Loja de benefícios para freelancers | TrampoHero',
    description:
      'Resgate itens e vantagens com TrampoCoins acumuladas na plataforma.',
    path: '/loja',
  },
  ads: {
    title: 'TrampoAds para empresas anunciarem vagas | TrampoHero',
    description:
      'Destaque oportunidades para alcançar freelancers qualificados mais rápido.',
    path: '/anuncios',
  },
  kyc: {
    title: 'Verificação de identidade (KYC) | TrampoHero',
    description:
      'Aumente confiança e segurança com validação de identidade na plataforma.',
    path: '/kyc',
  },
  admin: {
    title: 'Painel administrativo | TrampoHero',
    description:
      'Área operacional para gestão de usuários, vagas e segurança da plataforma.',
    path: '/admin',
  },
};

const setMeta = (selector: string, attr: 'content' | 'href', value: string) => {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute(attr, value);
    return;
  }
  const meta = document.createElement(selector.includes('link') ? 'link' : 'meta');
  if (selector.includes('property=')) {
    const property = selector.match(/property="([^"]+)"/)?.[1];
    if (property) meta.setAttribute('property', property);
  }
  if (selector.includes('name=')) {
    const name = selector.match(/name="([^"]+)"/)?.[1];
    if (name) meta.setAttribute('name', name);
  }
  if (meta.tagName.toLowerCase() === 'link') {
    meta.setAttribute('rel', 'canonical');
  }
  meta.setAttribute(attr, value);
  document.head.appendChild(meta);
};

export const getSeoMetaByView = (view: ViewType): SeoMeta => SEO_BY_VIEW[view] ?? SEO_BY_VIEW.browse;

export const applySeoMeta = (view: ViewType) => {
  const meta = getSeoMetaByView(view);
  const canonicalUrl = `${BASE_URL}${meta.path}`;

  document.title = meta.title;
  setMeta('meta[name="description"]', 'content', meta.description);
  setMeta('meta[property="og:title"]', 'content', meta.title);
  setMeta('meta[property="og:description"]', 'content', meta.description);
  setMeta('meta[property="og:url"]', 'content', canonicalUrl);
  setMeta('meta[property="og:image"]', 'content', DEFAULT_IMAGE);
  setMeta('meta[name="twitter:title"]', 'content', meta.title);
  setMeta('meta[name="twitter:description"]', 'content', meta.description);
  setMeta('meta[name="twitter:image"]', 'content', DEFAULT_IMAGE);
  setMeta('link[rel="canonical"]', 'href', canonicalUrl);
};

