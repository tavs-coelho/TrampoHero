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
