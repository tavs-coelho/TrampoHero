import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  UserProfile,
  Job,
  Message,
  Course,
  Certificate,
  WeeklyChallenge,
  TalentRanking,
  StoreProduct,
  Advertisement,
  Niche,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_JOBS,
  WEEKLY_CHALLENGES,
  TALENT_RANKINGS,
  STORE_PRODUCTS,
  ADVERTISEMENTS,
} from '../data/mockData';

export type ViewType =
  | 'browse'
  | 'wallet'
  | 'active'
  | 'chat'
  | 'dashboard'
  | 'academy'
  | 'profile'
  | 'talents'
  | 'coins'
  | 'insurance'
  | 'credit'
  | 'analytics'
  | 'contracts'
  | 'referrals'
  | 'challenges'
  | 'ranking'
  | 'store'
  | 'ads'
  | 'kyc'
  | 'admin';

export interface AppState {
  user: UserProfile;
  jobs: Job[];
  view: ViewType;
  browseMode: 'list' | 'map';
  selectedJob: Job | null;
  messages: Message[];
  inputText: string;
  aiSuggestion: string | null;
  isRecording: boolean;
  toast: { msg: string; type: 'success' | 'error' | 'info' } | null;
  isCheckedIn: boolean;
  showSplash: boolean;
  showCreateJobModal: boolean;
  newJobData: { title: string; payment: string; niche: Niche; date: string; startTime: string; description: string };
  isGeneratingDesc: boolean;
  showPrimeModal: boolean;
  showPaymentModal: boolean;
  depositAmount: string;
  paymentMethod: 'pix' | 'card';
  isProcessingPayment: boolean;
  cardData: { number: string; name: string; expiry: string; cvv: string };
  showExamModal: boolean;
  currentCourse: Course | null;
  currentQuestionIndex: number;
  userAnswers: number[];
  showExamResult: boolean;
  examScore: number;
  generatedCertificate: Certificate | null;
  filterNiche: string;
  filterStatus: string;
  filterDate: string;
  challenges: WeeklyChallenge[];
  rankings: TalentRanking[];
  storeProducts: StoreProduct[];
  cart: { productId: string; quantity: number }[];
  advertisements: Advertisement[];
  isApplying: boolean;
}

export type AppAction =
  | { type: 'SET_USER'; payload: UserProfile }
  | { type: 'SET_JOBS'; payload: Job[] }
  | { type: 'SET_VIEW'; payload: ViewType }
  | { type: 'SET_BROWSE_MODE'; payload: 'list' | 'map' }
  | { type: 'SET_SELECTED_JOB'; payload: Job | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_INPUT_TEXT'; payload: string }
  | { type: 'SET_AI_SUGGESTION'; payload: string | null }
  | { type: 'SET_IS_RECORDING'; payload: boolean }
  | { type: 'SET_TOAST'; payload: { msg: string; type: 'success' | 'error' | 'info' } | null }
  | { type: 'SET_IS_CHECKED_IN'; payload: boolean }
  | { type: 'SET_SHOW_SPLASH'; payload: boolean }
  | { type: 'SET_SHOW_CREATE_JOB_MODAL'; payload: boolean }
  | { type: 'SET_NEW_JOB_DATA'; payload: { title: string; payment: string; niche: Niche; date: string; startTime: string; description: string } }
  | { type: 'SET_IS_GENERATING_DESC'; payload: boolean }
  | { type: 'SET_SHOW_PRIME_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_PAYMENT_MODAL'; payload: boolean }
  | { type: 'SET_DEPOSIT_AMOUNT'; payload: string }
  | { type: 'SET_PAYMENT_METHOD'; payload: 'pix' | 'card' }
  | { type: 'SET_IS_PROCESSING_PAYMENT'; payload: boolean }
  | { type: 'SET_CARD_DATA'; payload: { number: string; name: string; expiry: string; cvv: string } }
  | { type: 'SET_SHOW_EXAM_MODAL'; payload: boolean }
  | { type: 'SET_CURRENT_COURSE'; payload: Course | null }
  | { type: 'SET_CURRENT_QUESTION_INDEX'; payload: number }
  | { type: 'SET_USER_ANSWERS'; payload: number[] }
  | { type: 'SET_SHOW_EXAM_RESULT'; payload: boolean }
  | { type: 'SET_EXAM_SCORE'; payload: number }
  | { type: 'SET_GENERATED_CERTIFICATE'; payload: Certificate | null }
  | { type: 'SET_FILTER_NICHE'; payload: string }
  | { type: 'SET_FILTER_STATUS'; payload: string }
  | { type: 'SET_FILTER_DATE'; payload: string }
  | { type: 'SET_CHALLENGES'; payload: WeeklyChallenge[] }
  | { type: 'SET_RANKINGS'; payload: TalentRanking[] }
  | { type: 'SET_STORE_PRODUCTS'; payload: StoreProduct[] }
  | { type: 'SET_CART'; payload: { productId: string; quantity: number }[] }
  | { type: 'SET_ADVERTISEMENTS'; payload: Advertisement[] }
  | { type: 'SET_IS_APPLYING'; payload: boolean };

function getInitialUser(): UserProfile {
  try {
    const saved = localStorage.getItem('trampoHeroUser');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  } catch {
    return INITIAL_USER;
  }
}

function getInitialMessages(): Message[] {
  try {
    const saved = localStorage.getItem('trampoHeroMessages');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: '1',
            senderId: 'bot',
            text: 'Olá! Sou o Suporte Hero. Em que posso ajudar? 🦸',
            timestamp: new Date().toISOString(),
          },
        ];
  } catch {
    return [
      {
        id: '1',
        senderId: 'bot',
        text: 'Olá! Sou o Suporte Hero. Em que posso ajudar? 🦸',
        timestamp: new Date().toISOString(),
      },
    ];
  }
}

const initialState: AppState = {
  user: getInitialUser(),
  jobs: INITIAL_JOBS,
  view: 'browse',
  browseMode: 'list',
  selectedJob: null,
  messages: getInitialMessages(),
  inputText: '',
  aiSuggestion: null,
  isRecording: false,
  toast: null,
  isCheckedIn: false,
  showSplash: true,
  showCreateJobModal: false,
  newJobData: { title: '', payment: '', niche: Niche.RESTAURANT, date: '', startTime: '', description: '' },
  isGeneratingDesc: false,
  showPrimeModal: false,
  showPaymentModal: false,
  depositAmount: '',
  paymentMethod: 'pix',
  isProcessingPayment: false,
  cardData: { number: '', name: '', expiry: '', cvv: '' },
  showExamModal: false,
  currentCourse: null,
  currentQuestionIndex: 0,
  userAnswers: [],
  showExamResult: false,
  examScore: 0,
  generatedCertificate: null,
  filterNiche: 'All',
  filterStatus: 'All',
  filterDate: '',
  challenges: WEEKLY_CHALLENGES,
  rankings: TALENT_RANKINGS,
  storeProducts: STORE_PRODUCTS,
  cart: [],
  advertisements: ADVERTISEMENTS,
  isApplying: false,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_JOBS':
      return { ...state, jobs: action.payload };
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    case 'SET_BROWSE_MODE':
      return { ...state, browseMode: action.payload };
    case 'SET_SELECTED_JOB':
      return { ...state, selectedJob: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_INPUT_TEXT':
      return { ...state, inputText: action.payload };
    case 'SET_AI_SUGGESTION':
      return { ...state, aiSuggestion: action.payload };
    case 'SET_IS_RECORDING':
      return { ...state, isRecording: action.payload };
    case 'SET_TOAST':
      return { ...state, toast: action.payload };
    case 'SET_IS_CHECKED_IN':
      return { ...state, isCheckedIn: action.payload };
    case 'SET_SHOW_SPLASH':
      return { ...state, showSplash: action.payload };
    case 'SET_SHOW_CREATE_JOB_MODAL':
      return { ...state, showCreateJobModal: action.payload };
    case 'SET_NEW_JOB_DATA':
      return { ...state, newJobData: action.payload };
    case 'SET_IS_GENERATING_DESC':
      return { ...state, isGeneratingDesc: action.payload };
    case 'SET_SHOW_PRIME_MODAL':
      return { ...state, showPrimeModal: action.payload };
    case 'SET_SHOW_PAYMENT_MODAL':
      return { ...state, showPaymentModal: action.payload };
    case 'SET_DEPOSIT_AMOUNT':
      return { ...state, depositAmount: action.payload };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    case 'SET_IS_PROCESSING_PAYMENT':
      return { ...state, isProcessingPayment: action.payload };
    case 'SET_CARD_DATA':
      return { ...state, cardData: action.payload };
    case 'SET_SHOW_EXAM_MODAL':
      return { ...state, showExamModal: action.payload };
    case 'SET_CURRENT_COURSE':
      return { ...state, currentCourse: action.payload };
    case 'SET_CURRENT_QUESTION_INDEX':
      return { ...state, currentQuestionIndex: action.payload };
    case 'SET_USER_ANSWERS':
      return { ...state, userAnswers: action.payload };
    case 'SET_SHOW_EXAM_RESULT':
      return { ...state, showExamResult: action.payload };
    case 'SET_EXAM_SCORE':
      return { ...state, examScore: action.payload };
    case 'SET_GENERATED_CERTIFICATE':
      return { ...state, generatedCertificate: action.payload };
    case 'SET_FILTER_NICHE':
      return { ...state, filterNiche: action.payload };
    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.payload };
    case 'SET_FILTER_DATE':
      return { ...state, filterDate: action.payload };
    case 'SET_CHALLENGES':
      return { ...state, challenges: action.payload };
    case 'SET_RANKINGS':
      return { ...state, rankings: action.payload };
    case 'SET_STORE_PRODUCTS':
      return { ...state, storeProducts: action.payload };
    case 'SET_CART':
      return { ...state, cart: action.payload };
    case 'SET_ADVERTISEMENTS':
      return { ...state, advertisements: action.payload };
    case 'SET_IS_APPLYING':
      return { ...state, isApplying: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
