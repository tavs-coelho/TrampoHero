import { Niche, SubscriptionTier } from '../types';
import type {
  UserProfile,
  Job,
  Message,
  WeeklyChallenge,
  TalentRanking,
  StoreProduct,
  Advertisement,
  Course,
  Certificate,
} from '../types';

export const createMockUser = (overrides?: Partial<UserProfile>): UserProfile => ({
  id: 'u1',
  name: 'Test User',
  bio: 'Test bio',
  niche: Niche.EVENTS,
  role: 'freelancer',
  rating: 4.5,
  wallet: { balance: 500, pending: 50, scheduled: 200, transactions: [] },
  history: [],
  medals: [{ id: 'm1', name: 'Pontualidade', icon: 'fa-clock', color: 'text-blue-500', description: 'Sempre pontual' }],
  isPrime: false,
  tier: SubscriptionTier.FREE,
  referralCode: 'TEST123',
  referrals: [],
  trampoCoins: {
    userId: 'u1',
    balance: 120,
    earned: [],
    redeemed: [],
    streak: 5,
    lastActivity: '2026-01-01',
    streakBonus: false,
  },
  insurance: undefined,
  credit: {
    userId: 'u1',
    availableCredit: 500,
    activeLoans: [],
    creditHistory: [],
    creditScore: 700,
  },
  analyticsAccess: 'free',
  courseProgress: [],
  certificates: [],
  invitations: [],
  invoices: [],
  ...overrides,
});

export const createMockJob = (overrides?: Partial<Job>): Job => ({
  id: 'j1',
  employerId: 'emp-1',
  title: 'Garçom para Evento',
  employer: 'Restaurante X',
  employerRating: 4.5,
  niche: Niche.EVENTS,
  location: 'São Paulo, SP',
  coordinates: { lat: -23.55, lng: -46.63 },
  payment: 150,
  paymentType: 'dia',
  description: 'Servir em evento corporativo',
  date: '2026-02-15',
  startTime: '18:00',
  status: 'open',
  ...overrides,
});

export const createMockMessage = (overrides?: Partial<Message>): Message => ({
  id: 'm1',
  senderId: 'bot',
  text: 'Olá! Como posso ajudar?',
  timestamp: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const createMockChallenge = (overrides?: Partial<WeeklyChallenge>): WeeklyChallenge => ({
  id: 'wc1',
  title: '🔥 Desafio da Semana',
  description: 'Complete 3 trampos esta semana',
  icon: '🔥',
  reward: { type: 'cash', value: 30 },
  requirement: { type: 'jobs_completed', target: 3, current: 1 },
  startDate: '2026-01-01',
  endDate: '2026-01-07',
  isActive: true,
  isCompleted: false,
  ...overrides,
});

export const createMockRanking = (overrides?: Partial<TalentRanking>): TalentRanking => ({
  userId: 't1',
  userName: 'Carlos Oliveira',
  rank: 1,
  score: 985,
  niche: Niche.CONSTRUCTION,
  rating: 5.0,
  weeklyJobs: 8,
  monthlyJobs: 30,
  badge: '🥇',
  ...overrides,
});

export const createMockStoreProduct = (overrides?: Partial<StoreProduct>): StoreProduct => ({
  id: 'p1',
  name: 'Kit Garçom Profissional',
  category: 'uniform',
  price: 89.9,
  originalPrice: 129.9,
  description: 'Kit completo para garçom',
  imageUrl: 'https://example.com/img.jpg',
  inStock: true,
  relatedNiches: [Niche.RESTAURANT],
  rating: 4.8,
  reviewCount: 120,
  ...overrides,
});

export const createMockAdvertisement = (overrides?: Partial<Advertisement>): Advertisement => ({
  id: 'ad1',
  advertiserId: 'adv-1',
  advertiserName: 'Banco Digital Hero',
  type: 'banner',
  content: {
    title: 'Cartão sem anuidade',
    description: 'Abra sua conta',
    ctaText: 'Saiba mais',
    ctaUrl: 'https://example.com',
  },
  targeting: {},
  budget: 5000,
  spent: 1200,
  impressions: 45000,
  clicks: 800,
  startDate: '2026-01-01',
  endDate: '2026-02-01',
  isActive: true,
  ...overrides,
});

export const createMockCourse = (overrides?: Partial<Course>): Course => ({
  id: 'c1',
  title: 'Excelência no Atendimento',
  duration: '2h',
  badgeId: 'cert-1',
  description: 'Curso de atendimento ao cliente',
  price: 0,
  level: 'basic',
  niche: Niche.RESTAURANT,
  examQuestions: [
    {
      id: 'q1',
      question: 'Qual a melhor prática de atendimento?',
      options: ['Ignorar o cliente', 'Ser cordial', 'Ser rude', 'Não ajudar'],
      correctAnswer: 1,
    },
    {
      id: 'q2',
      question: 'O que fazer ao receber uma reclamação?',
      options: ['Ignorar', 'Ouvir atentamente', 'Discutir', 'Sair'],
      correctAnswer: 1,
    },
  ],
  passingScore: 70,
  certificateIssuer: 'TrampoHero Academy',
  ...overrides,
});

export const createMockCertificate = (overrides?: Partial<Certificate>): Certificate => ({
  id: 'cert-1',
  userId: 'u1',
  userName: 'Test User',
  courseId: 'c1',
  courseTitle: 'Excelência no Atendimento',
  issuer: 'TrampoHero Academy',
  issueDate: '2026-01-15',
  score: 90,
  certificateNumber: 'CERT-2026-001',
  ...overrides,
});
