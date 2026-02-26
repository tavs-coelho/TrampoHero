export type JobStatus =
  | 'open'
  | 'applied'
  | 'ongoing'
  | 'waiting_approval'
  | 'completed'
  | 'paid'
  | 'cancelled';

export type UserRole = 'freelancer' | 'employer';

export type Niche =
  | 'Gastronomia'
  | 'Construção'
  | 'Eventos'
  | 'Serviços Gerais';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  niche?: Niche;
  rating?: number;
}

export interface AuthTokenPayload {
  token: string;
  user: User;
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
  isBoosted?: boolean;
  isEscrowGuaranteed?: boolean;
  minRatingRequired?: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: { msg: string }[];
  count?: number;
}

export interface CheckInPayload {
  jobId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface PhotoUploadSasResponse {
  sasUrl: string;
  blobName: string;
  containerUrl: string;
}

export interface PushRegistrationPayload {
  deviceToken: string;
  platform: 'android' | 'ios';
  userId: string;
  tags: string[];
}
