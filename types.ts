
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
  type: 'deposit' | 'withdrawal' | 'anticipation' | 'job_payment';
  amount: number;
  date: string;
  description: string;
  fee?: number;
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

export interface Course {
  id: string;
  title: string;
  duration: string;
  badgeId: string;
  description: string;
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
}
