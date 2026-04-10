import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Niche, Job, UserProfile, SubscriptionTier, Course, Certificate, WeeklyChallenge, TalentRanking, StoreProduct, Advertisement, Review } from './types';
import { getRecurrentSuggestion } from './services/geminiService';
import { WEEKLY_CHALLENGES, TALENT_RANKINGS, STORE_PRODUCTS, ADVERTISEMENTS, INITIAL_JOBS, INITIAL_USER } from './data/mockData';
import { apiService } from './services/apiService';
import { Toast } from './components/Toast';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ExamModal, PrimeModal, PaymentModal, CreateJobModal, JobDetailModal, ReviewFormModal, ConfirmDialog } from './components/modals';
import {
  DashboardView, TalentsView, EmployerProfileView, EmployerWalletView, EmployerActiveView,
  BrowseView, ActiveJobView, WalletView, AcademyView, ProfileView,
  CoinsView, InsuranceView, CreditView, ReferralsView, AnalyticsView, ChallengesView,
  RankingView, StoreView, AdsView, KycView, AdminView, SupportCenterView
} from './components/views';
import { useToast } from './hooks/useToast';
import { useJobActions } from './hooks/useJobActions';
import { useWalletActions } from './hooks/useWalletActions';
import { useCourseActions } from './hooks/useCourseActions';
import { useChallengeActions } from './hooks/useChallengeActions';
import { useStoreActions } from './hooks/useStoreActions';
import { ViewType } from './contexts/AppContext';
import { applySeoMeta, getSeoMetaByView } from './utils/seo';
import { analyticsService } from './services/analyticsService';

declare const L: any;

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');
// Screenshot mode only supports top-level views that are renderable in App.tsx.
const QUERY_VIEW_VALUES: readonly ViewType[] = [
  'browse', 'wallet', 'active', 'chat', 'dashboard', 'academy', 'profile', 'talents',
  'coins', 'insurance', 'credit', 'analytics', 'referrals', 'challenges',
  'ranking', 'store', 'kyc', 'admin',
];
const QUERY_ROLE_VALUES: readonly UserProfile['role'][] = ['freelancer', 'employer', 'admin'];
const QUERY_VIEWS_BY_ROLE: Readonly<Record<UserProfile['role'], readonly ViewType[]>> = {
  freelancer: ['browse', 'wallet', 'active', 'chat', 'academy', 'profile', 'coins', 'insurance', 'credit', 'analytics', 'referrals', 'challenges', 'ranking', 'store', 'kyc'],
  employer: ['dashboard', 'talents', 'profile', 'wallet', 'chat', 'active', 'browse'],
  admin: ['admin'],
};

const getSearchParams = () => new URLSearchParams(window.location.search);
const getIsScreenshotMode = () => getSearchParams().get('screenshotMode') === '1';

const getInitialViewFromQuery = (role: UserProfile['role']): ViewType | null => {
  if (!getIsScreenshotMode()) return null;
  const raw = getSearchParams().get('view');
  if (!raw || !QUERY_VIEW_VALUES.includes(raw as ViewType)) return null;
  return QUERY_VIEWS_BY_ROLE[role].includes(raw as ViewType) ? (raw as ViewType) : null;
};

const getInitialRoleFromQuery = (): UserProfile['role'] | null => {
  if (!getIsScreenshotMode()) return null;
  const raw = getSearchParams().get('role');
  return raw && QUERY_ROLE_VALUES.includes(raw as UserProfile['role']) ? (raw as UserProfile['role']) : null;
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('trampoHeroUser');
    const initialUser = saved ? JSON.parse(saved) : INITIAL_USER;
    const roleFromQuery = getInitialRoleFromQuery();
    return roleFromQuery ? { ...initialUser, role: roleFromQuery } : initialUser;
  });

  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isWalletLoading, setIsWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isChallengesLoading, setIsChallengesLoading] = useState(true);
  const [challengesError, setChallengesError] = useState<string | null>(null);
  const [isRankingsLoading, setIsRankingsLoading] = useState(true);
  const [rankingsError, setRankingsError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [view, setView] = useState<ViewType>(() => {
    const roleFromQuery = getInitialRoleFromQuery();
    const saved = localStorage.getItem('trampoHeroUser');
    const savedRole = saved ? (JSON.parse(saved) as Partial<UserProfile>)?.role : null;
    const validatedSavedRole = savedRole && QUERY_ROLE_VALUES.includes(savedRole) ? savedRole : INITIAL_USER.role;
    const roleForValidation = roleFromQuery ?? validatedSavedRole;
    return getInitialViewFromQuery(roleForValidation) ?? 'browse';
  });
  const [browseMode, setBrowseMode] = useState<'list' | 'map'>('list');
  const [selectedJob, setSelectedJob] = useState<Job | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('jobId');
    return jobId ? (INITIAL_JOBS.find(j => j.id === jobId) ?? null) : null;
  });
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showSplash, setShowSplash] = useState(() => !getIsScreenshotMode());

  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [newJobData, setNewJobData] = useState({ title: '', payment: '', niche: Niche.RESTAURANT, date: '', startTime: '', description: '' });
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  const [showPrimeModal, setShowPrimeModal] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });

  const [showExamModal, setShowExamModal] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showExamResult, setShowExamResult] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [generatedCertificate, setGeneratedCertificate] = useState<Certificate | null>(null);

  const [filterNiche, setFilterNiche] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');

  const [challenges, setChallenges] = useState<WeeklyChallenge[]>(WEEKLY_CHALLENGES);
  const [rankings, setRankings] = useState<TalentRanking[]>(TALENT_RANKINGS);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>(STORE_PRODUCTS);
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>(ADVERTISEMENTS);
  const [isApplying, setIsApplying] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [completedJob, setCompletedJob] = useState<Job | null>(null);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<any>(null);
  const navigationTimeoutRef = useRef<number | null>(null);

  const navigateTo = useCallback((nextView: ViewType) => {
    if (nextView === view) return;
    setIsNavigating(true);
    setView(nextView);

    if (navigationTimeoutRef.current !== null) {
      window.clearTimeout(navigationTimeoutRef.current);
    }

    navigationTimeoutRef.current = window.setTimeout(() => {
      setIsNavigating(false);
      navigationTimeoutRef.current = null;
    }, 250);
  }, [view]);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const retryLoadJobs = useCallback(async () => {
    setIsJobsLoading(true);
    setJobsError(null);
    const jobsResult = await apiService.getJobs();
    if (jobsResult.success && Array.isArray(jobsResult.data)) {
      setJobs(jobsResult.data as Job[]);
    } else {
      setJobsError(jobsResult.error || 'Não foi possível carregar vagas no momento.');
    }
    setIsJobsLoading(false);
  }, []);

  const retryLoadWallet = useCallback(async () => {
    setIsWalletLoading(true);
    setWalletError(null);
    const [balanceResult, txResult] = await Promise.all([
      apiService.getWalletBalance(),
      apiService.getTransactions(),
    ]);
    if (balanceResult.success && txResult.success) {
      const balance = (balanceResult.data as { balance?: number } | undefined)?.balance;
      const transactions = Array.isArray(txResult.data) ? (txResult.data as UserProfile['wallet']['transactions']) : user.wallet.transactions;
      setUser(prev => ({
        ...prev,
        wallet: {
          ...prev.wallet,
          balance: typeof balance === 'number' ? balance : prev.wallet.balance,
          transactions,
        },
      }));
    } else {
      setWalletError(balanceResult.error || txResult.error || 'Não foi possível carregar sua carteira.');
    }
    setIsWalletLoading(false);
  }, [user.wallet.transactions]);

  const retryLoadChallenges = useCallback(async () => {
    setIsChallengesLoading(true);
    setChallengesError(null);
    const result = await apiService.getChallenges();
    if (result.success && Array.isArray(result.data)) {
      setChallenges(result.data as WeeklyChallenge[]);
    } else {
      setChallengesError(result.error || 'Não foi possível carregar desafios.');
    }
    setIsChallengesLoading(false);
  }, []);

  const retryLoadRankings = useCallback(async () => {
    setIsRankingsLoading(true);
    setRankingsError(null);
    const result = await apiService.getRankings();
    if (result.success && Array.isArray(result.data)) {
      setRankings(result.data as TalentRanking[]);
    } else {
      setRankingsError(result.error || 'Não foi possível carregar o ranking.');
    }
    setIsRankingsLoading(false);
  }, []);

  // --- Hooks ---
  const { toast, showToast, clearToast } = useToast();

  const { handleUpdateChallengeProgress, handleClaimChallengeReward } = useChallengeActions({
    user, setUser, challenges, setChallenges, showToast
  });

  const activeJob = useMemo(() => jobs.find(j => j.id === user.activeJobId), [jobs, user.activeJobId]);

  const {
    handleApply, handleCheckIn, handleCheckout, handleShare,
    handleCreateJob, handleAutoDescription, simulateVoiceCreate,
    handleManageJob, handleCloseJob, handleApproveCandidate, handleInviteTalent
  } = useJobActions({
    user, setUser, jobs, setJobs, activeJob, selectedJob, setSelectedJob,
    setView, isCheckedIn, setIsCheckedIn, isApplying, setIsApplying,
    isRecording, setIsRecording, newJobData, setNewJobData,
    isGeneratingDesc, setIsGeneratingDesc, setShowCreateJobModal,
    setDepositAmount, setShowPaymentModal, showToast, handleUpdateChallengeProgress,
    onCheckoutComplete: (job) => {
      setCompletedJob(job);
      setShowReviewModal(true);
    },
  });

  const { handleWithdraw, handleAnticipate, handleOpenAddBalance, handleProcessPayment } = useWalletActions({
    user, setUser, depositAmount, setDepositAmount, paymentMethod,
    setIsProcessingPayment, setShowPaymentModal, showToast
  });

  const {
    handleStartCourse, handleAnswerQuestion, handleNextQuestion,
    handlePreviousQuestion, finishExam, handleDownloadCertificate
  } = useCourseActions({
    user, setUser, currentCourse, setCurrentCourse, currentQuestionIndex, setCurrentQuestionIndex,
    userAnswers, setUserAnswers, setShowExamResult, setExamScore,
    setGeneratedCertificate, setShowExamModal, showToast
  });

  const { handleStoreCheckout, handleApplyReferralCode, handleCompleteReferral, handleShowInvoices } = useStoreActions({
    user, setUser, jobs, cart, setCart, storeProducts, setView, showToast
  });

  // --- Computed values ---
  const sortedOpenJobs = useMemo(() => {
    let filtered = jobs.filter(j => j.status === 'open');
    if (filterNiche !== 'All') {
      filtered = filtered.filter(j => j.niche === filterNiche);
    }
    return filtered.sort((a, b) => {
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;
      return b.payment - a.payment;
    });
  }, [jobs, filterNiche]);

  const filteredEmployerJobs = useMemo(() => {
    return jobs.filter(j => j.employerId === user.id).filter(j => {
      const matchNiche = filterNiche === 'All' || j.niche === filterNiche;
      const matchStatus = filterStatus === 'All' || j.status === filterStatus;
      const matchDate = !filterDate || j.date === filterDate;
      return matchNiche && matchStatus && matchDate;
    });
  }, [jobs, user.id, filterNiche, filterStatus, filterDate]);

  // --- Local handlers (not extracted to hooks) ---
  const handleSubscribePrime = useCallback(() => {
    setUser(prev => ({ ...prev, isPrime: true, tier: SubscriptionTier.PRO }));
    setShowPrimeModal(false);
    showToast("Bem-vindo ao Hero Prime! Benefícios ativos.", "success");
  }, [showToast]);

  const handleUnsubscribePrime = useCallback(() => {
    if (confirm("Tem certeza que deseja cancelar? Você perderá o seguro e taxas zero.")) {
      setUser(prev => ({ ...prev, isPrime: false, tier: SubscriptionTier.FREE }));
      setShowPrimeModal(false);
      showToast("Assinatura cancelada com sucesso.", "info");
    }
  }, [showToast]);

  const handleOpenPrimeModal = useCallback(() => {
    analyticsService.trackEvent('cta_prime_click', {
      role: user.role,
      source_view: view,
    });
    setShowPrimeModal(true);
  }, [user.role, view]);

  const handleOpenCreateJobModal = useCallback(() => {
    analyticsService.trackEvent('cta_empresa_criar_vaga_click', {
      role: user.role,
      source_view: view,
    });
    setShowCreateJobModal(true);
  }, [user.role, view]);

  const handleApplyWithAnalytics = useCallback(
    async (job: Job) => {
      analyticsService.trackEvent('activation_apply_job_click', {
        role: user.role,
        job_id: job.id,
        niche: job.niche,
        payment: job.payment,
      });
      await handleApply(job);
    },
    [handleApply, user.role]
  );

  const handleShareWithAnalytics = useCallback(
    async (job: Job) => {
      analyticsService.trackEvent('share_job_click', {
        role: user.role,
        job_id: job.id,
        niche: job.niche,
      });
      await handleShare(job);
    },
    [handleShare, user.role]
  );

  const handleInviteTalentWithAnalytics = useCallback(
    (talentName: string, talentId?: string) => {
      analyticsService.trackEvent('cta_empresa_convidar_talento_click', {
        role: user.role,
        source_view: view,
        talent_id: talentId || null,
      });
      handleInviteTalent(talentName, talentId);
    },
    [handleInviteTalent, user.role, view]
  );

  // --- Effects ---
  useEffect(() => {
    setTimeout(() => setShowSplash(false), 2000);
  }, []);

  // Validate JWT and load initial data from API on mount
  useEffect(() => {
    const initializeFromApi = async () => {
      setIsProfileLoading(true);
      // Validate token and sync user profile from backend
      if (apiService.getToken()) {
        const profileResult = await apiService.getProfile();
        if (profileResult.success) {
          const profile = profileResult.data as UserProfile | undefined;
          // Basic shape validation to avoid corrupting state with invalid data
          if (profile && typeof profile === 'object') {
            setUser(profile);
            try {
              localStorage.setItem('trampoHeroUser', JSON.stringify(profile));
            } catch {
              // Ignore storage errors; in-memory state is already updated
            }
          } else {
            // Successful response but invalid shape — clear local session
            apiService.logout();
            localStorage.removeItem('trampoHeroUser');
            setUser(INITIAL_USER);
          }
        } else {
          if (profileResult.statusCode === 401) {
            // Token is definitively invalid or expired — clear local session
            apiService.logout();
            localStorage.removeItem('trampoHeroUser');
            setUser(INITIAL_USER);
          }
          // For network errors (statusCode === 0) or server errors (5xx),
          // keep the session — the token may still be valid once the server recovers
        }
      }
      setIsProfileLoading(false);

      // Load jobs from backend; fall back to mock data if API is unavailable
      const jobsResult = await apiService.getJobs();
      if (jobsResult.success && Array.isArray(jobsResult.data)) {
        setJobs(jobsResult.data as Job[]);
        setJobsError(null);
      } else {
        setJobsError(jobsResult.error || 'Não foi possível carregar vagas no momento.');
      }
      setIsJobsLoading(false);

      const [walletBalanceResult, transactionsResult, challengesResult, rankingsResult] = await Promise.all([
        apiService.getWalletBalance(),
        apiService.getTransactions(),
        apiService.getChallenges(),
        apiService.getRankings(),
      ]);

      if (walletBalanceResult.success && transactionsResult.success) {
        const walletBalance = (walletBalanceResult.data as { balance?: number } | undefined)?.balance;
        const walletTransactions = Array.isArray(transactionsResult.data)
          ? (transactionsResult.data as UserProfile['wallet']['transactions'])
          : user.wallet.transactions;
        setUser(prev => ({
          ...prev,
          wallet: {
            ...prev.wallet,
            balance: typeof walletBalance === 'number' ? walletBalance : prev.wallet.balance,
            transactions: walletTransactions,
          },
        }));
        setWalletError(null);
      } else {
        setWalletError(walletBalanceResult.error || transactionsResult.error || 'Não foi possível carregar sua carteira.');
      }
      setIsWalletLoading(false);

      if (challengesResult.success && Array.isArray(challengesResult.data)) {
        setChallenges(challengesResult.data as WeeklyChallenge[]);
        setChallengesError(null);
      } else {
        setChallengesError(challengesResult.error || 'Não foi possível carregar desafios.');
      }
      setIsChallengesLoading(false);

      if (rankingsResult.success && Array.isArray(rankingsResult.data)) {
        setRankings(rankingsResult.data as TalentRanking[]);
        setRankingsError(null);
      } else {
        setRankingsError(rankingsResult.error || 'Não foi possível carregar o ranking.');
      }
      setIsRankingsLoading(false);
    };

    initializeFromApi();
  }, []);

  useEffect(() => {
    localStorage.setItem('trampoHeroUser', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (user.role === 'employer') {
      getRecurrentSuggestion("Alex Silva", 5).then(setAiSuggestion);
    }
  }, [user.role]);

  useEffect(() => {
    applySeoMeta(view);
    const seo = getSeoMetaByView(view);
    analyticsService.trackPageView(seo.path, {
      role: user.role,
      app_view: view,
    });
  }, [view, user.role]);

  useEffect(() => {
    if (view === 'browse' && browseMode === 'map' && mapContainerRef.current) {
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([-23.5614, -46.6559], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
        markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
      }

      sortedOpenJobs.forEach(job => {
        const icon = L.divIcon({
          className: 'custom-icon',
          html: `<div class="hero-marker ${job.isBoosted ? 'ring-4 ring-amber-400 scale-125' : ''}"><i class="fas ${job.niche === Niche.RESTAURANT ? 'fa-utensils' : 'fa-briefcase'} text-xs"></i></div>`,
          iconSize: [28, 28], iconAnchor: [14, 14]
        });

        const popupDiv = document.createElement('div');
        popupDiv.className = "p-3 min-w-[220px] font-['Inter']";
        popupDiv.innerHTML = `
            <h4 class="font-black text-slate-900 text-sm mb-1 line-clamp-1">${job.title}</h4>
            <p class="text-[10px] text-slate-400 font-bold uppercase mb-3 truncate"><i class="fas fa-building mr-1"></i> ${job.employer}</p>
            <div class="flex items-center justify-between border-t border-slate-100 pt-3 mb-4">
              <div>
                <p class="text-[8px] font-black text-slate-400 uppercase">Valor</p>
                <p class="text-xs font-black text-indigo-600">R$ ${job.payment}</p>
              </div>
              <div class="text-right">
                <p class="text-[8px] font-black text-slate-400 uppercase">Avaliação Min.</p>
                <p class="text-xs font-black text-amber-500"><i class="fas fa-star text-[8px] mr-1"></i> ${job.minRatingRequired || 'N/A'}</p>
              </div>
            </div>
            <button class="w-full py-2 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all btn-details">
              Ver Detalhes
            </button>
        `;

        const btn = popupDiv.querySelector('.btn-details');
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedJob(job);
          });
        }

        const marker = L.marker([job.coordinates.lat, job.coordinates.lng], { icon });

        marker.bindPopup(popupDiv, {
          closeButton: false,
          className: 'hero-popup',
          maxWidth: 260
        });

        if (markersLayerRef.current) {
          markersLayerRef.current.addLayer(marker);
        }
      });

      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [view, browseMode, sortedOpenJobs]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {showSplash && <SplashScreen />}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={clearToast} />}

      <Header user={user} setView={setView} setShowPrimeModal={setShowPrimeModal} setUser={setUser} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5">
        {user.role === 'employer' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {(view === 'dashboard' || view === 'browse') && (
              <DashboardView
                user={user}
                filteredEmployerJobs={filteredEmployerJobs}
                filterNiche={filterNiche}
                setFilterNiche={setFilterNiche}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
                handleManageJob={handleManageJob}
                simulateVoiceCreate={simulateVoiceCreate}
                isRecording={isRecording}
                onCreateJobClick={handleOpenCreateJobModal}
                aiSuggestion={aiSuggestion}
                handleShowInvoices={handleShowInvoices}
                handleOpenAddBalance={handleOpenAddBalance}
                handleInviteTalent={handleInviteTalentWithAnalytics}
                setView={navigateTo}
                isLoading={isJobsLoading}
                error={jobsError}
                onRetry={retryLoadJobs}
              />
            )}
            {view === 'talents' && (
              <TalentsView
                handleInviteTalent={handleInviteTalentWithAnalytics}
                setView={setView}
              />
            )}
            {view === 'profile' && (
              <EmployerProfileView
                user={user}
                filteredEmployerJobs={filteredEmployerJobs}
              />
            )}
            {view === 'wallet' && (
              <EmployerWalletView
                user={user}
                handleWithdraw={handleWithdraw}
                handleOpenAddBalance={handleOpenAddBalance}
                handleShowInvoices={handleShowInvoices}
              />
            )}
            {view === 'chat' && (
              <SupportCenterView
                user={user}
                setView={setView}
                showToast={showToast}
              />
            )}
            {view === 'active' && (
              <EmployerActiveView
                setView={setView}
                waitingApprovalJobs={jobs.filter(j => j.employerId === user.id && j.status === 'waiting_approval')}
                onApproveCompletion={async (jobId) => {
                  try {
                    await apiService.approveJobCompletion(jobId);
                    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'completed' } : j));
                    showToast("Conclusão aprovada! Pagamento liberado.", "success");
                  } catch (error) {
                    console.error('Failed to approve job completion', error);
                    showToast("Falha ao aprovar conclusão. Tente novamente.", "error");
                  }
                }}
              />
            )}
          </div>
        ) : (
          <>
            {view === 'browse' && (
              <BrowseView
                sortedOpenJobs={sortedOpenJobs}
                browseMode={browseMode}
                setBrowseMode={setBrowseMode}
                filterNiche={filterNiche}
                setFilterNiche={setFilterNiche}
                setSelectedJob={setSelectedJob}
                mapContainerRef={mapContainerRef}
                user={user}
                setView={navigateTo}
                setShowPrimeModal={handleOpenPrimeModal}
                isLoading={isJobsLoading}
              />
            )}
            {view === 'active' && (
              <ActiveJobView
                activeJob={activeJob}
                isCheckedIn={isCheckedIn}
                handleCheckIn={handleCheckIn}
                handleCheckout={() => setShowCheckoutConfirm(true)}
                setView={navigateTo}
              />
            )}
            {view === 'wallet' && (
              <WalletView
                user={user}
                handleWithdraw={handleWithdraw}
                handleAnticipate={handleAnticipate}
                setShowPrimeModal={handleOpenPrimeModal}
                isLoading={isWalletLoading}
                error={walletError}
                onRetry={retryLoadWallet}
              />
            )}
            {view === 'academy' && (
              <AcademyView
                user={user}
                handleStartCourse={handleStartCourse}
                filterNiche={filterNiche}
                setFilterNiche={setFilterNiche}
              />
            )}
            {view === 'profile' && (
              <ProfileView
                user={user}
                setView={navigateTo}
                handleDownloadCertificate={handleDownloadCertificate}
                showToast={showToast}
                reviews={reviews}
                isLoading={isProfileLoading}
              />
            )}
            {view === 'chat' && (
              <SupportCenterView
                user={user}
                setView={setView}
                showToast={showToast}
              />
            )}
            {view === 'coins' && user.trampoCoins && (
              <CoinsView
                user={user}
                setUser={setUser}
                showToast={showToast}
                setView={setView}
              />
            )}
            {view === 'insurance' && (
              <InsuranceView
                user={user}
                setUser={setUser}
                showToast={showToast}
                setView={setView}
              />
            )}
            {view === 'credit' && (
              <CreditView
                user={user}
                setUser={setUser}
                showToast={showToast}
                setView={setView}
              />
            )}
            {view === 'referrals' && (
              <ReferralsView
                user={user}
                handleApplyReferralCode={handleApplyReferralCode}
                handleCompleteReferral={handleCompleteReferral}
                showToast={showToast}
                setView={setView}
              />
            )}
            {view === 'analytics' && (
              <AnalyticsView
                user={user}
                setUser={setUser}
                showToast={showToast}
                setView={setView}
              />
            )}
            {view === 'challenges' && (
              <ChallengesView
                challenges={challenges}
                setView={navigateTo}
                isLoading={isChallengesLoading}
                error={challengesError}
                onRetry={retryLoadChallenges}
              />
            )}
            {view === 'ranking' && (
              <RankingView
                rankings={rankings}
                user={user}
                setView={navigateTo}
                isLoading={isRankingsLoading}
                error={rankingsError}
                onRetry={retryLoadRankings}
              />
            )}
            {view === 'store' && (
              <StoreView
                storeProducts={storeProducts}
                cart={cart}
                setCart={setCart}
                handleStoreCheckout={handleStoreCheckout}
                showToast={showToast}
                setView={setView}
              />
            )}
            {view === 'ads' && user.role === 'employer' && (
              <AdsView
                user={user}
                advertisements={advertisements}
                showToast={showToast}
                setView={setView}
              />
            )}
            {view === 'kyc' && (
              <KycView
                user={user}
                setUser={setUser}
                showToast={showToast}
                setView={setView}
              />
            )}
            {view === 'admin' && (
              <AdminView
                user={user}
                showToast={showToast}
              />
            )}
          </>
        )}
      </main>

      <BottomNav user={user} view={view} setView={navigateTo} isNavigating={isNavigating} />

      {showExamModal && currentCourse && (
        <ExamModal
          currentCourse={currentCourse}
          currentQuestionIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          showExamResult={showExamResult}
          examScore={examScore}
          generatedCertificate={generatedCertificate}
          handleAnswerQuestion={handleAnswerQuestion}
          handleNextQuestion={handleNextQuestion}
          handlePreviousQuestion={handlePreviousQuestion}
          handleDownloadCertificate={handleDownloadCertificate}
          onClose={() => {
            setShowExamModal(false);
            setCurrentCourse(null);
            setShowExamResult(false);
          }}
          onRetry={() => {
            setCurrentQuestionIndex(0);
            setUserAnswers([]);
            setShowExamResult(false);
            setGeneratedCertificate(null);
          }}
        />
      )}

      {showPrimeModal && (
        <PrimeModal
          user={user}
          handleSubscribePrime={handleSubscribePrime}
          handleUnsubscribePrime={handleUnsubscribePrime}
          onClose={() => setShowPrimeModal(false)}
        />
      )}

      {showPaymentModal && (
        <Elements stripe={stripePromise}>
          <PaymentModal
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isProcessingPayment={isProcessingPayment}
            setIsProcessingPayment={setIsProcessingPayment}
            handleProcessPayment={handleProcessPayment}
            onPaymentSuccess={(amount) => {
              const newTransaction = {
                id: Date.now().toString(),
                type: 'deposit' as const,
                amount,
                date: new Date().toLocaleDateString('pt-BR'),
                description: 'Depósito via cartão',
              };
              setUser(prev => ({
                ...prev,
                wallet: {
                  ...prev.wallet,
                  balance: prev.wallet.balance + amount,
                  transactions: [newTransaction, ...prev.wallet.transactions],
                },
              }));
              setShowPaymentModal(false);
              setDepositAmount('');
            }}
            showToast={showToast}
            onClose={() => setShowPaymentModal(false)}
          />
        </Elements>
      )}

      {showCreateJobModal && (
        <CreateJobModal
          newJobData={newJobData}
          setNewJobData={setNewJobData}
          isGeneratingDesc={isGeneratingDesc}
          handleAutoDescription={handleAutoDescription}
          handleCreateJob={handleCreateJob}
          onClose={() => setShowCreateJobModal(false)}
        />
      )}

      {showReviewModal && completedJob && (
        <ReviewFormModal
          job={completedJob}
          authorId={user.id}
          onSubmit={(reviewData) => {
            const newReview: Review = {
              id: Date.now().toString(),
              ...reviewData,
              authorName: user.name,
              createdAt: new Date().toISOString(),
            };
            setReviews(prev => [newReview, ...prev]);
            setShowReviewModal(false);
            setCompletedJob(null);
            showToast("Avaliação enviada! Obrigado pelo feedback.", "success");
          }}
          onClose={() => {
            setShowReviewModal(false);
            setCompletedJob(null);
          }}
        />
      )}

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          user={user}
          isApplying={isApplying}
          handleApply={handleApplyWithAnalytics}
          handleShare={handleShareWithAnalytics}
          handleApproveCandidate={handleApproveCandidate}
          handleCloseJob={handleCloseJob}
          onClose={() => setSelectedJob(null)}
        />
      )}

      <ConfirmDialog
        isOpen={showCheckoutConfirm}
        title="Finalizar job?"
        message="Confirme apenas se o contratante já validou a execução do serviço."
        confirmLabel="Finalizar"
        cancelLabel="Voltar"
        onCancel={() => setShowCheckoutConfirm(false)}
        onConfirm={() => {
          setShowCheckoutConfirm(false);
          handleCheckout(true);
        }}
      />
    </div>
  );
};

export default App;
