import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../services/geminiService', () => ({
  generateVoiceJob: vi.fn().mockResolvedValue(null),
  generateJobDescription: vi.fn().mockResolvedValue('Generated description'),
  getSmartJobInsight: vi.fn().mockResolvedValue('Insight'),
}));

vi.mock('../../services/pdfService', () => ({
  generateContract: vi.fn().mockResolvedValue(true),
  generateCertificate: vi.fn().mockResolvedValue(true),
}));

import { useWalletActions } from '../useWalletActions';
import { useChallengeActions } from '../useChallengeActions';
import { useCourseActions } from '../useCourseActions';
import { useStoreActions } from '../useStoreActions';
import { useJobActions } from '../useJobActions';
import { Niche, SubscriptionTier } from '../../types';
import type { UserProfile, WeeklyChallenge, Course, Certificate, StoreProduct, Job } from '../../types';

const createMockUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'u1',
  name: 'Test User',
  bio: 'Test bio',
  niche: Niche.EVENTS,
  role: 'freelancer',
  rating: 4.5,
  wallet: { balance: 500, pending: 50, scheduled: 200, transactions: [] },
  history: [],
  medals: [],
  isPrime: false,
  tier: SubscriptionTier.FREE,
  referralCode: 'TEST123',
  referrals: [],
  trampoCoins: {
    userId: 'u1', balance: 120, earned: [], redeemed: [],
    streak: 5, lastActivity: '2026-01-01', streakBonus: false,
  },
  courseProgress: [],
  certificates: [],
  invitations: [],
  invoices: [],
  ...overrides,
});

const createMockJob = (overrides: Partial<Job> = {}): Job => ({
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
  description: 'Servir em evento',
  date: '2026-02-15',
  startTime: '18:00',
  status: 'open',
  ...overrides,
});

// ==================== useWalletActions ====================

describe('useWalletActions', () => {
  const createDeps = (overrides = {}) => ({
    user: createMockUser(),
    setUser: vi.fn(),
    depositAmount: '100',
    setDepositAmount: vi.fn(),
    paymentMethod: 'pix' as const,
    setIsProcessingPayment: vi.fn(),
    setShowPaymentModal: vi.fn(),
    showToast: vi.fn(),
    ...overrides,
  });

  it('handleWithdraw shows error when balance is zero', () => {
    const deps = createDeps({ user: createMockUser({ wallet: { balance: 0, pending: 0, scheduled: 0, transactions: [] } }) });
    const { result } = renderHook(() => useWalletActions(deps));
    act(() => result.current.handleWithdraw());
    expect(deps.showToast).toHaveBeenCalledWith('Saldo indisponível para saque.', 'error');
  });

  it('handleAnticipate shows info when no scheduled balance', () => {
    const deps = createDeps({ user: createMockUser({ wallet: { balance: 500, pending: 0, scheduled: 0, transactions: [] } }) });
    const { result } = renderHook(() => useWalletActions(deps));
    act(() => result.current.handleAnticipate());
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'info');
  });

  it('handleOpenAddBalance resets amount and opens modal', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useWalletActions(deps));
    act(() => result.current.handleOpenAddBalance());
    expect(deps.setDepositAmount).toHaveBeenCalledWith('');
    expect(deps.setShowPaymentModal).toHaveBeenCalledWith(true);
  });

  it('handleProcessPayment shows error for invalid amount', () => {
    const deps = createDeps({ depositAmount: '' });
    const { result } = renderHook(() => useWalletActions(deps));
    act(() => result.current.handleProcessPayment());
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('handleProcessPayment shows error for zero amount', () => {
    const deps = createDeps({ depositAmount: '0' });
    const { result } = renderHook(() => useWalletActions(deps));
    act(() => result.current.handleProcessPayment());
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('handleProcessPayment starts processing for valid PIX payment', () => {
    const deps = createDeps({ depositAmount: '100', paymentMethod: 'pix' as const });
    const { result } = renderHook(() => useWalletActions(deps));
    act(() => result.current.handleProcessPayment());
    expect(deps.setIsProcessingPayment).toHaveBeenCalledWith(true);
  });

  it('handleProcessPayment does nothing for card (Stripe handles it)', () => {
    const deps = createDeps({
      depositAmount: '100',
      paymentMethod: 'card' as const,
    });
    const { result } = renderHook(() => useWalletActions(deps));
    act(() => result.current.handleProcessPayment());
    expect(deps.setIsProcessingPayment).not.toHaveBeenCalled();
  });
});

// ==================== useChallengeActions ====================

describe('useChallengeActions', () => {
  const createDeps = (overrides = {}) => ({
    user: createMockUser(),
    setUser: vi.fn(),
    challenges: [
      {
        id: 'wc1', title: 'Test Challenge', description: 'Complete 3 jobs',
        icon: '🔥', reward: { type: 'cash' as const, value: 30 },
        requirement: { type: 'jobs_completed' as const, target: 3, current: 2 },
        startDate: '2026-01-01', endDate: '2026-01-07', isActive: true, isCompleted: false,
      },
    ] as WeeklyChallenge[],
    setChallenges: vi.fn(),
    showToast: vi.fn(),
    ...overrides,
  });

  it('handleUpdateChallengeProgress updates progress', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useChallengeActions(deps));
    act(() => result.current.handleUpdateChallengeProgress('jobs_completed', 1));
    expect(deps.setChallenges).toHaveBeenCalled();
  });

  it('handleUpdateChallengeProgress triggers setChallenges on completion', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useChallengeActions(deps));
    act(() => result.current.handleUpdateChallengeProgress('jobs_completed', 1));
    // Completing the challenge (was 2/3, adding 1 makes 3/3) should trigger setChallenges
    expect(deps.setChallenges).toHaveBeenCalled();
  });

  it('handleClaimChallengeReward handles cash reward', () => {
    const deps = createDeps();
    const challenge: WeeklyChallenge = {
      id: 'wc2', title: 'Cash', description: '', icon: '💰',
      reward: { type: 'cash', value: 50 },
      requirement: { type: 'jobs_completed', target: 1, current: 1 },
      startDate: '', endDate: '', isActive: true, isCompleted: true,
    };
    const { result } = renderHook(() => useChallengeActions(deps));
    act(() => result.current.handleClaimChallengeReward(challenge));
    expect(deps.setUser).toHaveBeenCalled();
    expect(deps.showToast).toHaveBeenCalled();
  });

  it('handleClaimChallengeReward handles coins reward', () => {
    const deps = createDeps();
    const challenge: WeeklyChallenge = {
      id: 'wc3', title: 'Coins', description: '', icon: '🪙',
      reward: { type: 'coins', value: 100 },
      requirement: { type: 'referrals', target: 1, current: 1 },
      startDate: '', endDate: '', isActive: true, isCompleted: true,
    };
    const { result } = renderHook(() => useChallengeActions(deps));
    act(() => result.current.handleClaimChallengeReward(challenge));
    expect(deps.setUser).toHaveBeenCalled();
  });

  it('handleClaimChallengeReward handles medal reward', () => {
    const deps = createDeps();
    const challenge: WeeklyChallenge = {
      id: 'wc4', title: 'Medal', description: '', icon: '🏅',
      reward: { type: 'medal', value: 'm1' },
      requirement: { type: 'streak_days', target: 1, current: 1 },
      startDate: '', endDate: '', isActive: true, isCompleted: true,
    };
    const { result } = renderHook(() => useChallengeActions(deps));
    act(() => result.current.handleClaimChallengeReward(challenge));
    expect(deps.showToast).toHaveBeenCalled();
  });

  it('handleUpdateChallengeProgress ignores completed challenges', () => {
    const deps = createDeps({
      challenges: [{
        id: 'wc1', title: 'Done', description: '', icon: '✅',
        reward: { type: 'cash' as const, value: 10 },
        requirement: { type: 'jobs_completed' as const, target: 3, current: 3 },
        startDate: '', endDate: '', isActive: true, isCompleted: true,
      }] as WeeklyChallenge[],
    });
    const { result } = renderHook(() => useChallengeActions(deps));
    act(() => result.current.handleUpdateChallengeProgress('jobs_completed', 1));
    expect(deps.setChallenges).toHaveBeenCalled();
    // Should not trigger reward for already completed
    expect(deps.setUser).not.toHaveBeenCalled();
  });
});

// ==================== useCourseActions ====================

describe('useCourseActions', () => {
  const mockCourse: Course = {
    id: 'c1', title: 'Test Course', duration: '2h', badgeId: 'cert-1',
    description: 'Test', price: 0, level: 'basic', niche: Niche.RESTAURANT,
    examQuestions: [
      { id: 'q1', question: 'Q1?', options: ['A', 'B', 'C', 'D'], correctAnswer: 1 },
      { id: 'q2', question: 'Q2?', options: ['A', 'B', 'C', 'D'], correctAnswer: 2 },
    ],
    passingScore: 50, certificateIssuer: 'TrampoHero Academy',
  };

  const createDeps = (overrides = {}) => ({
    user: createMockUser(),
    setUser: vi.fn(),
    currentCourse: mockCourse,
    setCurrentCourse: vi.fn(),
    currentQuestionIndex: 0,
    setCurrentQuestionIndex: vi.fn(),
    userAnswers: [] as number[],
    setUserAnswers: vi.fn(),
    setShowExamResult: vi.fn(),
    setExamScore: vi.fn(),
    setGeneratedCertificate: vi.fn(),
    setShowExamModal: vi.fn(),
    showToast: vi.fn(),
    ...overrides,
  });

  it('handleStartCourse opens exam modal for free course', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useCourseActions(deps));
    act(() => result.current.handleStartCourse(mockCourse));
    expect(deps.setCurrentCourse).toHaveBeenCalledWith(mockCourse);
    expect(deps.setShowExamModal).toHaveBeenCalledWith(true);
  });

  it('handleStartCourse shows toast for paid course', () => {
    const deps = createDeps();
    const paidCourse = { ...mockCourse, price: 99 };
    const { result } = renderHook(() => useCourseActions(deps));
    act(() => result.current.handleStartCourse(paidCourse));
    expect(deps.showToast).toHaveBeenCalled();
    expect(deps.setShowExamModal).not.toHaveBeenCalled();
  });

  it('handleStartCourse shows info for already completed course', () => {
    const deps = createDeps({
      user: createMockUser({
        medals: [{ id: 'cert-1', name: 'Badge', icon: '🏅', color: 'gold', description: 'Test' }],
      }),
    });
    const { result } = renderHook(() => useCourseActions(deps));
    act(() => result.current.handleStartCourse(mockCourse));
    expect(deps.showToast).toHaveBeenCalled();
    expect(deps.setShowExamModal).not.toHaveBeenCalled();
  });

  it('handleAnswerQuestion records answer', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useCourseActions(deps));
    act(() => result.current.handleAnswerQuestion(2));
    expect(deps.setUserAnswers).toHaveBeenCalled();
  });

  it('handleNextQuestion increments index', () => {
    const deps = createDeps({ currentQuestionIndex: 0 });
    const { result } = renderHook(() => useCourseActions(deps));
    act(() => result.current.handleNextQuestion());
    expect(deps.setCurrentQuestionIndex).toHaveBeenCalled();
  });

  it('handleNextQuestion finishes exam on last question', () => {
    const deps = createDeps({
      currentQuestionIndex: 1,
      userAnswers: [1, 2],
    });
    const { result } = renderHook(() => useCourseActions(deps));
    act(() => result.current.handleNextQuestion());
    expect(deps.setExamScore).toHaveBeenCalled();
    expect(deps.setShowExamResult).toHaveBeenCalledWith(true);
  });

  it('handlePreviousQuestion decrements index', () => {
    const deps = createDeps({ currentQuestionIndex: 1 });
    const { result } = renderHook(() => useCourseActions(deps));
    act(() => result.current.handlePreviousQuestion());
    expect(deps.setCurrentQuestionIndex).toHaveBeenCalled();
  });

  it('handlePreviousQuestion does nothing at first question', () => {
    const deps = createDeps({ currentQuestionIndex: 0 });
    const { result } = renderHook(() => useCourseActions(deps));
    act(() => result.current.handlePreviousQuestion());
    expect(deps.setCurrentQuestionIndex).not.toHaveBeenCalled();
  });

  it('finishExam calculates passing score', () => {
    const deps = createDeps({ userAnswers: [1, 2] }); // both correct
    const { result } = renderHook(() => useCourseActions(deps));
    act(() => result.current.finishExam());
    expect(deps.setExamScore).toHaveBeenCalledWith(100);
    expect(deps.setShowExamResult).toHaveBeenCalledWith(true);
  });

  it('finishExam calculates failing score', () => {
    const deps = createDeps({ userAnswers: [0, 0] }); // both wrong
    const { result } = renderHook(() => useCourseActions(deps));
    act(() => result.current.finishExam());
    expect(deps.setExamScore).toHaveBeenCalledWith(0);
    expect(deps.setGeneratedCertificate).toHaveBeenCalledWith(null);
  });

  it('finishExam returns early with no course', () => {
    const deps = createDeps({ currentCourse: null });
    const { result } = renderHook(() => useCourseActions(deps));
    act(() => result.current.finishExam());
    expect(deps.setExamScore).not.toHaveBeenCalled();
  });
});

// ==================== useStoreActions ====================

describe('useStoreActions', () => {
  const createDeps = (overrides = {}) => ({
    user: createMockUser(),
    setUser: vi.fn(),
    jobs: [] as Job[],
    cart: [] as { productId: string; quantity: number }[],
    setCart: vi.fn(),
    storeProducts: [
      {
        id: 'p1', name: 'Product', category: 'uniform' as const, price: 50,
        description: 'desc', imageUrl: 'img.jpg', inStock: true,
        relatedNiches: [Niche.RESTAURANT], rating: 4.5, reviewCount: 10,
      },
    ] as StoreProduct[],
    setView: vi.fn(),
    showToast: vi.fn(),
    ...overrides,
  });

  it('handleStoreCheckout shows error for empty cart', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useStoreActions(deps));
    act(() => result.current.handleStoreCheckout());
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('handleStoreCheckout shows error for insufficient balance', () => {
    const deps = createDeps({
      cart: [{ productId: 'p1', quantity: 1 }],
      user: createMockUser({ wallet: { balance: 10, pending: 0, scheduled: 0, transactions: [] } }),
    });
    const { result } = renderHook(() => useStoreActions(deps));
    act(() => result.current.handleStoreCheckout());
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('handleApplyReferralCode validates empty code', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useStoreActions(deps));
    act(() => result.current.handleApplyReferralCode(''));
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('handleApplyReferralCode validates short code', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useStoreActions(deps));
    act(() => result.current.handleApplyReferralCode('AB'));
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('handleApplyReferralCode rejects own code', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useStoreActions(deps));
    act(() => result.current.handleApplyReferralCode('TEST123'));
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('handleApplyReferralCode accepts valid code', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useStoreActions(deps));
    act(() => result.current.handleApplyReferralCode('VALIDCODE'));
    expect(deps.setUser).toHaveBeenCalled();
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('handleCompleteReferral calls setUser for missing referral', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useStoreActions(deps));
    act(() => result.current.handleCompleteReferral('nonexistent'));
    // setUser is always called but returns prev unchanged for missing referral
    expect(deps.setUser).toHaveBeenCalled();
  });

  it('handleCompleteReferral completes pending referral', () => {
    const deps = createDeps({
      user: createMockUser({
        referrals: [{
          id: 'ref1', referrerId: 'u2', referredId: 'u1', referredRole: 'freelancer',
          status: 'pending', reward: 25, createdDate: '2026-01-01',
        }],
      }),
    });
    const { result } = renderHook(() => useStoreActions(deps));
    act(() => result.current.handleCompleteReferral('ref1'));
    expect(deps.setUser).toHaveBeenCalled();
    expect(deps.showToast).toHaveBeenCalled();
  });

  it('handleShowInvoices shows info when no completed jobs', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useStoreActions(deps));
    act(() => result.current.handleShowInvoices());
    expect(deps.showToast).toHaveBeenCalled();
    expect(deps.setView).toHaveBeenCalledWith('profile');
  });

  it('handleShowInvoices generates invoices for completed employer jobs', () => {
    const deps = createDeps({
      user: createMockUser({ id: 'emp-1', role: 'employer' }),
      jobs: [createMockJob({ employerId: 'emp-1', status: 'completed' })],
    });
    const { result } = renderHook(() => useStoreActions(deps));
    act(() => result.current.handleShowInvoices());
    expect(deps.setUser).toHaveBeenCalled();
    expect(deps.setView).toHaveBeenCalledWith('profile');
  });
});

// ==================== useJobActions ====================

describe('useJobActions', () => {
  const createDeps = (overrides = {}) => ({
    user: createMockUser(),
    setUser: vi.fn(),
    jobs: [createMockJob()] as Job[],
    setJobs: vi.fn(),
    activeJob: undefined as Job | undefined,
    selectedJob: null as Job | null,
    setSelectedJob: vi.fn(),
    setView: vi.fn(),
    isCheckedIn: false,
    setIsCheckedIn: vi.fn(),
    isApplying: false,
    setIsApplying: vi.fn(),
    isRecording: false,
    setIsRecording: vi.fn(),
    newJobData: { title: 'Test', payment: '100', niche: Niche.EVENTS, date: '2027-01-01', startTime: '09:00', description: 'desc' },
    setNewJobData: vi.fn(),
    isGeneratingDesc: false,
    setIsGeneratingDesc: vi.fn(),
    setShowCreateJobModal: vi.fn(),
    setDepositAmount: vi.fn(),
    setShowPaymentModal: vi.fn(),
    showToast: vi.fn(),
    handleUpdateChallengeProgress: vi.fn(),
    ...overrides,
  });

  it('handleApply rejects when already applying', () => {
    const deps = createDeps({ isApplying: true });
    const { result } = renderHook(() => useJobActions(deps));
    act(() => result.current.handleApply(createMockJob()));
    expect(deps.showToast).not.toHaveBeenCalled();
  });

  it('handleApply rejects when user has active job', () => {
    const deps = createDeps({ user: createMockUser({ activeJobId: 'j-existing' }) });
    const { result } = renderHook(() => useJobActions(deps));
    act(() => result.current.handleApply(createMockJob()));
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('handleApply succeeds for valid application', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useJobActions(deps));
    act(() => result.current.handleApply(createMockJob()));
    expect(deps.setIsApplying).toHaveBeenCalledWith(true);
    expect(deps.setJobs).toHaveBeenCalled();
    expect(deps.setUser).toHaveBeenCalled();
    expect(deps.setView).toHaveBeenCalled();
  });

  it('handleCheckIn does nothing without active job', () => {
    const deps = createDeps({ activeJob: undefined });
    const { result } = renderHook(() => useJobActions(deps));
    act(() => result.current.handleCheckIn());
    expect(deps.showToast).not.toHaveBeenCalled();
  });

  it('handleCheckIn starts GPS check for active job', () => {
    const deps = createDeps({ activeJob: createMockJob({ status: 'ongoing' }) });
    const { result } = renderHook(() => useJobActions(deps));
    act(() => result.current.handleCheckIn());
    expect(deps.showToast).toHaveBeenCalledWith(expect.stringContaining('GPS'), 'info');
  });

  it('handleManageJob selects job', () => {
    const deps = createDeps();
    const job = createMockJob();
    const { result } = renderHook(() => useJobActions(deps));
    act(() => result.current.handleManageJob(job));
    expect(deps.setSelectedJob).toHaveBeenCalledWith(job);
  });

  it('handleCreateJob validates empty title', () => {
    const deps = createDeps({
      newJobData: { title: '', payment: '100', niche: Niche.EVENTS, date: '2027-01-01', startTime: '09:00', description: '' },
    });
    const { result } = renderHook(() => useJobActions(deps));
    act(() => result.current.handleCreateJob());
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('handleCreateJob validates empty payment', () => {
    const deps = createDeps({
      newJobData: { title: 'Test', payment: '', niche: Niche.EVENTS, date: '2027-01-01', startTime: '09:00', description: '' },
    });
    const { result } = renderHook(() => useJobActions(deps));
    act(() => result.current.handleCreateJob());
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('handleCreateJob validates past date', () => {
    const deps = createDeps({
      newJobData: { title: 'Test', payment: '100', niche: Niche.EVENTS, date: '2020-01-01', startTime: '09:00', description: '' },
    });
    const { result } = renderHook(() => useJobActions(deps));
    act(() => result.current.handleCreateJob());
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('handleCreateJob succeeds with valid data', () => {
    const deps = createDeps();
    const { result } = renderHook(() => useJobActions(deps));
    act(() => result.current.handleCreateJob());
    expect(deps.setJobs).toHaveBeenCalled();
    expect(deps.setShowCreateJobModal).toHaveBeenCalledWith(false);
    expect(deps.showToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('handleAutoDescription does nothing without title', () => {
    const deps = createDeps({
      newJobData: { title: '', payment: '', niche: Niche.EVENTS, date: '', startTime: '', description: '' },
    });
    const { result } = renderHook(() => useJobActions(deps));
    act(() => result.current.handleAutoDescription());
    expect(deps.setIsGeneratingDesc).not.toHaveBeenCalled();
  });
});
