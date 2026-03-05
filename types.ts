
export enum Niche {
  RESTAURANT = 'Gastronomia',
  CONSTRUCTION = 'Construção',
  EVENTS = 'Eventos',
  CLEANING = 'Serviços Gerais'
}

export enum SubscriptionTier {
  FREE = 'Free',
  PRO = 'Pro',
  ULTRA = 'Ultra'
}

export type JobStatus = 'open' | 'applied' | 'ongoing' | 'waiting_approval' | 'completed' | 'paid' | 'cancelled';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  translatedText?: string;
  timestamp: string;
}

export interface Medal {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  isCertified?: boolean;
}

export interface WorkHistory {
  jobId: string;
  employerId: string;
  date: string;
  rating?: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'anticipation' | 'job_payment' | 'coin_earned' | 'coin_redeemed' | 'loan' | 'loan_repayment' | 'referral_bonus';
  amount: number;
  date: string;
  description: string;
  fee?: number;
  coins?: number; // TrampoCoins relacionados
}

export interface Job {
  id: string;
  employerId: string;
  title: string;
  employer: string;
  employerRating: number;
  niche: Niche;
  location: string;
  coordinates: LatLng;
  payment: number;
  paymentType: 'dia' | 'hora' | 'job';
  description: string;
  date: string;
  startTime: string;
  status: JobStatus;
  checkInTime?: string;
  checkOutTime?: string;
  proofPhoto?: string;
  isAnticipated?: boolean;
  isBoosted?: boolean; // Vaga em destaque
  isEscrowGuaranteed?: boolean; // Fundo garantidor
  minRatingRequired?: number; // Avaliação mínima exigida
}

export interface CourseQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // índice da resposta correta (0-based index)
}

export interface Course {
  id: string;
  title: string;
  duration: string;
  badgeId: string;
  description: string;
  price?: number; // Preço do curso (undefined ou 0 = gratuito, >0 = pago)
  level?: 'basic' | 'intermediate' | 'advanced' | 'certification';
  provider?: string; // Parceiro (SENAC, SENAI, etc) - se não fornecido, é da própria plataforma
  revenueShare?: number; // Percentual que fica com TrampoHero (padrão 30%)
  niche?: Niche; // Nicho específico do curso
  ebookUrl?: string; // URL do ebook (será adicionado depois)
  examQuestions: CourseQuestion[]; // Questões da prova
  passingScore: number; // Percentual mínimo para aprovação (0-100)
  certificateIssuer: string; // Emissor do certificado (ex: "TrampoHero Academy")
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  examScore?: number;
  examAttempts: number;
  passed: boolean;
  certificateId?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  issuer: string;
  issueDate: string;
  score: number;
  certificateNumber: string; // Número único do certificado
}

export interface Invitation {
  id: string;
  talentName: string;
  talentId?: string; // ID do talento no sistema. Se fornecido, referencia registro existente. Se omitido, será gerado um novo ID.
  jobId?: string;
  jobTitle?: string;
  status: 'pending' | 'accepted' | 'declined';
  sentDate: string;
}

export interface Invoice {
  id: string;
  jobId: string;
  jobTitle: string;
  amount: number;
  date: string;
  downloadUrl?: string;
}

export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface KycInfo {
  status: KycStatus;
  documentFrontUrl?: string | null;
  documentBackUrl?: string | null;
  selfieUrl?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  bio: string;
  niche: Niche;
  rating: number;
  tier: SubscriptionTier;
  isPrime?: boolean;
  wallet: {
    balance: number;
    pending: number;
    scheduled: number;
    transactions: Transaction[];
  };
  activeJobId?: string;
  role: 'freelancer' | 'employer';
  medals: Medal[];
  history: WorkHistory[];
  favorites?: string[]; // IDs de empregadores favoritos (ou vice-versa)
  invitations?: Invitation[]; // Convites enviados
  invoices?: Invoice[]; // Notas fiscais geradas
  trampoCoins?: TrampoCoin; // Sistema de fidelidade
  insurance?: Insurance; // Seguro TrampoProtect
  credit?: CreditAccount; // Conta de crédito TrampoCredit
  referralCode?: string; // Código de indicação
  referrals?: Referral[]; // Indicações feitas
  analyticsAccess?: 'free' | 'premium'; // Acesso ao dashboard de analytics
  courseProgress?: CourseProgress[]; // Progresso nos cursos
  certificates?: Certificate[]; // Certificados emitidos
  kyc?: KycInfo; // Status de verificação de identidade
}

// ==================== FEATURE 1: TRAMPOCOINS ====================
export interface TrampoCoin {
  userId: string;
  balance: number;
  earned: Transaction[];
  redeemed: Transaction[];
  streak: number; // Dias consecutivos trabalhando
  lastActivity: string; // Data da última atividade
  streakBonus: boolean; // Se está recebendo bônus de streak (+50%)
}

// ==================== FEATURE 2: PLANO ULTRA ====================
export enum UltraPlan {
  STARTER = 'Starter',
  GROWTH = 'Growth',
  ENTERPRISE = 'Enterprise'
}

export interface UltraSubscription {
  plan: UltraPlan;
  price: number;
  startDate: string;
  nextBillingDate: string;
  features: string[];
  monthlyCredits: number; // Créditos em boosts
  contractionsLimit?: number; // Limite de contratações (undefined = ilimitado)
}

// ==================== FEATURE 3: TRAMPOPROTECT ====================
export interface Insurance {
  type: 'freelancer' | 'employer';
  plan: InsurancePlan;
  startDate: string;
  nextBillingDate: string;
  isActive: boolean;
  claims: InsuranceClaim[];
}

export interface InsurancePlan {
  name: string;
  price: number;
  coverage: {
    type: string;
    maxAmount: number;
  }[];
}

export interface InsuranceClaim {
  id: string;
  type: string;
  amount: number;
  status: 'pending' | 'approved' | 'denied';
  date: string;
  description: string;
}

// ==================== FEATURE 4: TRAMPOADS ====================
export interface Advertisement {
  id: string;
  advertiserId: string;
  advertiserName: string;
  type: 'banner' | 'sponsored_post' | 'push_notification' | 'video_preroll';
  content: {
    title: string;
    description: string;
    imageUrl?: string;
    videoUrl?: string;
    ctaText: string;
    ctaUrl: string;
  };
  targeting: {
    niches?: Niche[];
    locations?: string[];
    incomeRange?: { min: number; max: number };
    userActivity?: 'high' | 'medium' | 'low';
  };
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// ==================== FEATURE 5: MARKETPLACE DE CURSOS ====================
// Course interface already extended above

// ==================== FEATURE 6: TRAMPOCREDIT ====================
export interface CreditAccount {
  userId: string;
  availableCredit: number; // Crédito disponível baseado no histórico
  activeLoans: Loan[];
  creditHistory: Loan[];
  creditScore: number; // Score interno (0-1000)
}

export interface Loan {
  id: string;
  amount: number;
  fee: number; // Taxa de 3.9% ao mês
  totalAmount: number; // Valor total com juros
  requestDate: string;
  approvalDate?: string;
  status: 'pending' | 'approved' | 'denied' | 'paid' | 'defaulted';
  installments: LoanInstallment[];
}

export interface LoanInstallment {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
}

// ==================== FEATURE 7: CONTRATOS FIXOS ====================
export interface RecurringContract {
  id: string;
  freelancerId: string;
  employerId: string;
  jobTemplate: Partial<Job>; // Template da vaga
  frequency: 'once_weekly' | 'twice_weekly' | 'biweekly' | 'monthly'; // Máximo 2x por semana
  dayOfWeek?: number; // Para semanal (0-6)
  secondDayOfWeek?: number; // Para duas vezes por semana (0-6)
  dayOfMonth?: number; // Para mensal (1-31)
  startDate: string;
  endDate?: string;
  discount: number; // Desconto por volume (5% para 3+ meses)
  isActive: boolean;
  upcomingJobs: string[]; // IDs das próximas vagas agendadas
  backupFreelancerId?: string; // Substituto em caso de falta
}

// ==================== FEATURE 8: PROGRAMA DE AFILIADOS ====================
export interface Referral {
  id: string;
  referrerId: string; // Quem indicou
  referredId: string; // Quem foi indicado
  referredRole: 'freelancer' | 'employer';
  status: 'pending' | 'completed' | 'paid';
  reward: number;
  createdDate: string;
  completedDate?: string; // Quando o indicado completou o primeiro trabalho/contratação
  paidDate?: string;
}

export interface AffiliateProgram {
  userId: string;
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  tier: 'regular' | 'professional'; // Regular = usuário, Professional = influencer
  commissionRate: number; // 10% para profissionais por 6 meses
  referrals: Referral[];
}

// ==================== FEATURE 10: ANALYTICS PREMIUM ====================
export interface AnalyticsDashboard {
  userId: string;
  period: 'week' | 'month' | 'quarter' | 'year' | 'all';
  metrics: {
    // Para empregadores
    totalHires?: number;
    averageCostPerHire?: number;
    roiVsFullTime?: number;
    bestPerformingTalents?: { id: string; name: string; rating: number; costBenefit: number }[];
    peakHiringTimes?: { hour: number; count: number }[];
    seasonalityTrends?: { month: string; hires: number }[];
    
    // Para freelancers
    totalEarnings?: number;
    averageJobValue?: number;
    jobsCompleted?: number;
    clientRetention?: number;
    peakEarningTimes?: { hour: number; earnings: number }[];
    topClients?: { id: string; name: string; totalPaid: number }[];
  };
  predictions?: {
    nextMonthDemand?: number;
    suggestedPricing?: number;
    bestDaysToWork?: string[];
  };
}

// ==================== VIRAL GROWTH FEATURES ====================

// Weekly Challenges (Desafios Semanais)
export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward: {
    type: 'cash' | 'coins' | 'medal';
    value: number | string; // valor em R$ ou ID da medalha
  };
  requirement: {
    type: 'jobs_completed' | 'referrals' | 'streak_days' | 'rating_maintained';
    target: number;
    current: number;
  };
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCompleted: boolean;
}

// Public Talent Ranking
export interface TalentRanking {
  userId: string;
  userName: string;
  rank: number;
  score: number; // Pontuação baseada em: jobs completados, avaliações, pontualidade
  niche: Niche;
  avatar?: string;
  weeklyJobs: number;
  monthlyJobs: number;
  rating: number;
  badge?: string; // "🥇", "🥈", "🥉" para top 3
}

// TrampoStore - E-commerce
export interface StoreProduct {
  id: string;
  name: string;
  category: 'uniform' | 'epi' | 'tools' | 'accessories';
  price: number;
  originalPrice?: number; // Para mostrar desconto
  description: string;
  imageUrl: string;
  inStock: boolean;
  relatedNiches: Niche[]; // Nichos relacionados ao produto
  rating: number;
  reviewCount: number;
}

export interface StoreOrder {
  id: string;
  userId: string;
  products: { productId: string; quantity: number; price: number }[];
  total: number;
  shippingCost: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryDate?: string;
  trackingCode?: string;
}

// ==================== REVIEWS & RATINGS ====================
export interface Review {
  id: string;
  rating: number; // 1-5
  comment: string;
  authorId: string;
  authorName?: string;
  targetId: string;
  jobId: string;
  createdAt: string;
}
