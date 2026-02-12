import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { appReducer, AppProvider, useAppContext } from '../AppContext';
import type { AppState, AppAction } from '../AppContext';
import { Niche, SubscriptionTier } from '../../types';
import type { UserProfile, Job, Message } from '../../types';

const createMockUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'u1',
  name: 'Test User',
  bio: 'Test bio',
  niche: Niche.EVENTS,
  role: 'freelancer',
  rating: 4.5,
  wallet: { balance: 100, pending: 0, scheduled: 0, transactions: [] },
  history: [],
  medals: [],
  isPrime: false,
  tier: SubscriptionTier.FREE,
  referralCode: 'REF123',
  ...overrides,
});

const createMockState = (overrides: Partial<AppState> = {}): AppState => ({
  user: createMockUser(),
  jobs: [],
  view: 'browse',
  browseMode: 'list',
  selectedJob: null,
  messages: [],
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
  challenges: [],
  rankings: [],
  storeProducts: [],
  cart: [],
  advertisements: [],
  isApplying: false,
  ...overrides,
});

describe('appReducer', () => {
  it('SET_VIEW changes view', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_VIEW', payload: 'wallet' });
    expect(result.view).toBe('wallet');
  });

  it('SET_USER changes user', () => {
    const state = createMockState();
    const newUser = createMockUser({ name: 'New User' });
    const result = appReducer(state, { type: 'SET_USER', payload: newUser });
    expect(result.user.name).toBe('New User');
  });

  it('SET_JOBS changes jobs', () => {
    const state = createMockState();
    const mockJob: Job = {
      id: 'j1', employerId: 'e1', title: 'Test Job', employer: 'Emp',
      employerRating: 4, niche: Niche.EVENTS, location: 'SP',
      coordinates: { lat: 0, lng: 0 }, payment: 100, paymentType: 'dia',
      description: 'desc', date: '2026-01-01', startTime: '09:00', status: 'open',
    };
    const result = appReducer(state, { type: 'SET_JOBS', payload: [mockJob] });
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].id).toBe('j1');
  });

  it('SET_BROWSE_MODE changes browseMode', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_BROWSE_MODE', payload: 'map' });
    expect(result.browseMode).toBe('map');
  });

  it('SET_SELECTED_JOB changes selectedJob', () => {
    const state = createMockState();
    const mockJob: Job = {
      id: 'j2', employerId: 'e1', title: 'Selected', employer: 'Emp',
      employerRating: 5, niche: Niche.CLEANING, location: 'RJ',
      coordinates: { lat: 0, lng: 0 }, payment: 200, paymentType: 'hora',
      description: 'desc', date: '2026-02-01', startTime: '10:00', status: 'open',
    };
    const result = appReducer(state, { type: 'SET_SELECTED_JOB', payload: mockJob });
    expect(result.selectedJob).toEqual(mockJob);
  });

  it('SET_MESSAGES changes messages', () => {
    const state = createMockState();
    const msgs: Message[] = [{ id: 'm1', senderId: 'bot', text: 'Hi', timestamp: '2026-01-01T00:00:00Z' }];
    const result = appReducer(state, { type: 'SET_MESSAGES', payload: msgs });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].text).toBe('Hi');
  });

  it('SET_IS_CHECKED_IN changes isCheckedIn', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_IS_CHECKED_IN', payload: true });
    expect(result.isCheckedIn).toBe(true);
  });

  it('SET_SHOW_SPLASH changes showSplash', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_SHOW_SPLASH', payload: false });
    expect(result.showSplash).toBe(false);
  });

  it('SET_FILTER_NICHE changes filterNiche', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_FILTER_NICHE', payload: 'Eventos' });
    expect(result.filterNiche).toBe('Eventos');
  });

  it('SET_CART changes cart', () => {
    const state = createMockState();
    const cart = [{ productId: 'p1', quantity: 2 }];
    const result = appReducer(state, { type: 'SET_CART', payload: cart });
    expect(result.cart).toEqual(cart);
  });

  it('SET_INPUT_TEXT changes inputText', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_INPUT_TEXT', payload: 'hello' });
    expect(result.inputText).toBe('hello');
  });

  it('SET_IS_APPLYING changes isApplying', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_IS_APPLYING', payload: true });
    expect(result.isApplying).toBe(true);
  });

  it('SET_IS_RECORDING changes isRecording', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_IS_RECORDING', payload: true });
    expect(result.isRecording).toBe(true);
  });

  it('SET_SHOW_CREATE_JOB_MODAL changes showCreateJobModal', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_SHOW_CREATE_JOB_MODAL', payload: true });
    expect(result.showCreateJobModal).toBe(true);
  });

  it('SET_NEW_JOB_DATA changes newJobData', () => {
    const state = createMockState();
    const newData = { title: 'Garçom', payment: '150', niche: Niche.EVENTS, date: '2026-02-01', startTime: '09:00', description: 'desc' };
    const result = appReducer(state, { type: 'SET_NEW_JOB_DATA', payload: newData });
    expect(result.newJobData.title).toBe('Garçom');
    expect(result.newJobData.niche).toBe(Niche.EVENTS);
  });

  it('SET_IS_GENERATING_DESC changes isGeneratingDesc', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_IS_GENERATING_DESC', payload: true });
    expect(result.isGeneratingDesc).toBe(true);
  });

  it('SET_SHOW_PRIME_MODAL changes showPrimeModal', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_SHOW_PRIME_MODAL', payload: true });
    expect(result.showPrimeModal).toBe(true);
  });

  it('SET_SHOW_PAYMENT_MODAL changes showPaymentModal', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_SHOW_PAYMENT_MODAL', payload: true });
    expect(result.showPaymentModal).toBe(true);
  });

  it('SET_DEPOSIT_AMOUNT changes depositAmount', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_DEPOSIT_AMOUNT', payload: '250' });
    expect(result.depositAmount).toBe('250');
  });

  it('SET_PAYMENT_METHOD changes paymentMethod', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_PAYMENT_METHOD', payload: 'card' });
    expect(result.paymentMethod).toBe('card');
  });

  it('SET_IS_PROCESSING_PAYMENT changes isProcessingPayment', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_IS_PROCESSING_PAYMENT', payload: true });
    expect(result.isProcessingPayment).toBe(true);
  });

  it('SET_CARD_DATA changes cardData', () => {
    const state = createMockState();
    const cardData = { number: '4111111111111111', name: 'Test', expiry: '12/28', cvv: '123' };
    const result = appReducer(state, { type: 'SET_CARD_DATA', payload: cardData });
    expect(result.cardData.number).toBe('4111111111111111');
    expect(result.cardData.cvv).toBe('123');
  });

  it('SET_SHOW_EXAM_MODAL changes showExamModal', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_SHOW_EXAM_MODAL', payload: true });
    expect(result.showExamModal).toBe(true);
  });

  it('SET_CURRENT_COURSE changes currentCourse', () => {
    const state = createMockState();
    const course = {
      id: 'c1', title: 'Test Course', duration: '2h', badgeId: 'b1',
      description: 'desc', examQuestions: [], passingScore: 70, certificateIssuer: 'Test',
    };
    const result = appReducer(state, { type: 'SET_CURRENT_COURSE', payload: course });
    expect(result.currentCourse?.title).toBe('Test Course');
  });

  it('SET_CURRENT_COURSE to null', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_CURRENT_COURSE', payload: null });
    expect(result.currentCourse).toBeNull();
  });

  it('SET_CURRENT_QUESTION_INDEX changes currentQuestionIndex', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_CURRENT_QUESTION_INDEX', payload: 3 });
    expect(result.currentQuestionIndex).toBe(3);
  });

  it('SET_USER_ANSWERS changes userAnswers', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_USER_ANSWERS', payload: [1, 2, 0] });
    expect(result.userAnswers).toEqual([1, 2, 0]);
  });

  it('SET_SHOW_EXAM_RESULT changes showExamResult', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_SHOW_EXAM_RESULT', payload: true });
    expect(result.showExamResult).toBe(true);
  });

  it('SET_EXAM_SCORE changes examScore', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_EXAM_SCORE', payload: 85 });
    expect(result.examScore).toBe(85);
  });

  it('SET_GENERATED_CERTIFICATE changes generatedCertificate', () => {
    const state = createMockState();
    const cert = {
      id: 'cert-1', userId: 'u1', userName: 'Test', courseId: 'c1',
      courseTitle: 'Course', issuer: 'Issuer', issueDate: '2026-01-01',
      score: 90, certificateNumber: 'CERT-001',
    };
    const result = appReducer(state, { type: 'SET_GENERATED_CERTIFICATE', payload: cert });
    expect(result.generatedCertificate?.id).toBe('cert-1');
  });

  it('SET_GENERATED_CERTIFICATE to null', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_GENERATED_CERTIFICATE', payload: null });
    expect(result.generatedCertificate).toBeNull();
  });

  it('SET_FILTER_STATUS changes filterStatus', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_FILTER_STATUS', payload: 'open' });
    expect(result.filterStatus).toBe('open');
  });

  it('SET_FILTER_DATE changes filterDate', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'SET_FILTER_DATE', payload: '2026-03-01' });
    expect(result.filterDate).toBe('2026-03-01');
  });

  it('SET_CHALLENGES changes challenges', () => {
    const state = createMockState();
    const challenges = [{
      id: 'wc1', title: 'Test', description: 'desc', icon: '🔥',
      reward: { type: 'cash' as const, value: 30 },
      requirement: { type: 'jobs_completed' as const, target: 3, current: 1 },
      startDate: '2026-01-01', endDate: '2026-01-07', isActive: true, isCompleted: false,
    }];
    const result = appReducer(state, { type: 'SET_CHALLENGES', payload: challenges });
    expect(result.challenges).toHaveLength(1);
    expect(result.challenges[0].id).toBe('wc1');
  });

  it('SET_RANKINGS changes rankings', () => {
    const state = createMockState();
    const rankings = [{
      userId: 't1', userName: 'Top Talent', rank: 1, score: 999,
      niche: Niche.EVENTS, weeklyJobs: 10, monthlyJobs: 40, rating: 5.0,
    }];
    const result = appReducer(state, { type: 'SET_RANKINGS', payload: rankings });
    expect(result.rankings).toHaveLength(1);
    expect(result.rankings[0].userName).toBe('Top Talent');
  });

  it('SET_STORE_PRODUCTS changes storeProducts', () => {
    const state = createMockState();
    const products = [{
      id: 'p1', name: 'Product', category: 'uniform' as const, price: 50,
      description: 'desc', imageUrl: 'img.jpg', inStock: true,
      relatedNiches: [Niche.RESTAURANT], rating: 4.5, reviewCount: 10,
    }];
    const result = appReducer(state, { type: 'SET_STORE_PRODUCTS', payload: products });
    expect(result.storeProducts).toHaveLength(1);
    expect(result.storeProducts[0].name).toBe('Product');
  });

  it('SET_ADVERTISEMENTS changes advertisements', () => {
    const state = createMockState();
    const ads = [{
      id: 'ad1', advertiserId: 'a1', advertiserName: 'Brand',
      type: 'banner' as const,
      content: { title: 'Ad', description: 'desc', ctaText: 'Click', ctaUrl: 'url' },
      targeting: {}, budget: 1000, spent: 200, impressions: 5000, clicks: 100,
      startDate: '2026-01-01', endDate: '2026-02-01', isActive: true,
    }];
    const result = appReducer(state, { type: 'SET_ADVERTISEMENTS', payload: ads });
    expect(result.advertisements).toHaveLength(1);
    expect(result.advertisements[0].advertiserName).toBe('Brand');
  });

  it('unknown action type returns same state', () => {
    const state = createMockState();
    const result = appReducer(state, { type: 'UNKNOWN_ACTION' } as unknown as AppAction);
    expect(result).toBe(state);
  });
});

describe('AppProvider + useAppContext', () => {
  it('useAppContext throws when used outside AppProvider', () => {
    expect(() => {
      renderHook(() => useAppContext());
    }).toThrow('useAppContext must be used within an AppProvider');
  });

  it('useAppContext returns state and dispatch inside AppProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );
    const { result } = renderHook(() => useAppContext(), { wrapper });
    expect(result.current.state).toBeDefined();
    expect(result.current.dispatch).toBeDefined();
    expect(typeof result.current.dispatch).toBe('function');
  });

  it('dispatch updates state correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'SET_VIEW', payload: 'wallet' });
    });
    expect(result.current.state.view).toBe('wallet');
  });
});
