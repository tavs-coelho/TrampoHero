import React, { useCallback } from 'react';
import { Niche, Job, UserProfile, Transaction, Invitation } from '../types';
import { generateVoiceJob, generateJobDescription } from '../services/geminiService';
import { generateContract } from '../services/pdfService';
import { COINS_PER_CURRENCY_UNIT, STREAK_BONUS_THRESHOLD, STREAK_BONUS_MULTIPLIER } from '../data/constants';
import { ViewType } from '../contexts/AppContext';
import { apiService } from '../services/apiService';

export const useJobActions = (deps: {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  activeJob: Job | undefined;
  selectedJob: Job | null;
  setSelectedJob: React.Dispatch<React.SetStateAction<Job | null>>;
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  isCheckedIn: boolean;
  setIsCheckedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isApplying: boolean;
  setIsApplying: React.Dispatch<React.SetStateAction<boolean>>;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  newJobData: { title: string; payment: string; niche: Niche; date: string; startTime: string; description: string };
  setNewJobData: React.Dispatch<React.SetStateAction<{ title: string; payment: string; niche: Niche; date: string; startTime: string; description: string }>>;
  isGeneratingDesc: boolean;
  setIsGeneratingDesc: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCreateJobModal: React.Dispatch<React.SetStateAction<boolean>>;
  setDepositAmount: React.Dispatch<React.SetStateAction<string>>;
  setShowPaymentModal: React.Dispatch<React.SetStateAction<boolean>>;
  showToast: (msg: string, type?: 'success'|'error'|'info') => void;
  handleUpdateChallengeProgress: (challengeType: 'jobs_completed' | 'referrals' | 'streak_days' | 'rating_maintained', increment?: number) => void;
  onCheckoutComplete?: (job: Job) => void;
}) => {
  const {
    user, setUser, jobs, setJobs, activeJob, selectedJob, setSelectedJob,
    setView, isCheckedIn, setIsCheckedIn, isApplying, setIsApplying,
    isRecording, setIsRecording, newJobData, setNewJobData,
    isGeneratingDesc, setIsGeneratingDesc, setShowCreateJobModal,
    setDepositAmount, setShowPaymentModal, showToast, handleUpdateChallengeProgress,
    onCheckoutComplete
  } = deps;

  const handleApply = async (job: Job) => {
    if (isApplying) return; // Prevent duplicate submissions
    if (user.activeJobId) {
      showToast("Você já tem um trabalho ativo.", "error");
      return;
    }
    
    setIsApplying(true);

    const result = await apiService.applyToJob(job.id);
    if (!result.success) {
      showToast(result.error || "Erro ao candidatar-se. Tente novamente.", "error");
      setIsApplying(false);
      return;
    }

    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'applied' } : j));
    setUser(prev => ({ ...prev, activeJobId: job.id, wallet: { ...prev.wallet, scheduled: prev.wallet.scheduled + job.payment } }));
    setSelectedJob(null);
    setView('active');
    setIsCheckedIn(false);
    showToast("Vaga aceita! Prepare-se para o trabalho.", "success");
    
    // Reset applying state after a short delay
    setTimeout(() => setIsApplying(false), 1000);
  };

  const handleCheckIn = () => {
    if (!activeJob) return;
    showToast("Verificando localização GPS...", "info");

    const doCheckIn = async (latitude: number, longitude: number) => {
      const timestamp = new Date().toISOString();
      const result = await apiService.checkInJob(activeJob.id, latitude, longitude, timestamp);
      if (result.success) {
        setIsCheckedIn(true);
        generateContract(activeJob, user);
        showToast(`Check-in confirmado! Contrato enviado para ${user.name.toLowerCase().replace(' ','')}@email.com`, "success");
      } else {
        showToast(result.error || "Falha no check-in. Tente novamente.", "error");
      }
    };

    const handleError = () => showToast("Falha no check-in. Não foi possível obter a localização GPS. Verifique as permissões de localização e tente novamente.", "error");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          doCheckIn(position.coords.latitude, position.coords.longitude).catch(handleError);
        },
        () => {
          // Não realizar check-in se o acesso ao GPS for negado
          handleError();
        },
        { timeout: 5000 }
      );
    } else {
      // Não realizar check-in se a API de Geolocalização não estiver disponível
      handleError();
    }
  };
  
  const handleCheckout = (isConfirmed = false) => {
    if (!activeJob) return;
    if (isConfirmed || confirm("Confirmar finalização do serviço? Certifique-se de que o contratante está ciente.")) {
        const jobPayment = activeJob.payment;
        const coinsEarned = Math.floor(jobPayment / COINS_PER_CURRENCY_UNIT);
        
        // Calculate actual coins before state update to use in toast
        const currentStreak = user.trampoCoins ? user.trampoCoins.streak + 1 : 1;
        const streakBonus = currentStreak >= STREAK_BONUS_THRESHOLD;
        const actualCoins = streakBonus ? Math.floor(coinsEarned * STREAK_BONUS_MULTIPLIER) : coinsEarned;
        
        setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, status: 'completed' } : j));
        setUser(prev => {
            const newStreak = prev.trampoCoins ? prev.trampoCoins.streak + 1 : 1;
            const streakBonus = newStreak >= STREAK_BONUS_THRESHOLD;
            const actualCoins = streakBonus ? Math.floor(coinsEarned * STREAK_BONUS_MULTIPLIER) : coinsEarned;
            
            return {
                ...prev, 
                activeJobId: undefined,
                history: [...prev.history, { jobId: activeJob.id, employerId: activeJob.employerId, date: new Date().toISOString().split('T')[0] }],
                trampoCoins: prev.trampoCoins ? {
                    ...prev.trampoCoins,
                    balance: prev.trampoCoins.balance + actualCoins,
                    earned: [...prev.trampoCoins.earned, {
                        id: `tc-${Date.now()}`,
                        type: 'coin_earned',
                        amount: 0,
                        date: new Date().toISOString().split('T')[0],
                        description: `+${actualCoins} TrampoCoins${streakBonus ? ' (Streak Bonus +50%)' : ''}`,
                        coins: actualCoins
                    }],
                    streak: newStreak,
                    lastActivity: new Date().toISOString(),
                    streakBonus
                } : prev.trampoCoins
            };
        });
        setIsCheckedIn(false);
        setView('browse');
        
        // Update challenge progress for jobs completed
        handleUpdateChallengeProgress('jobs_completed', 1);
        
        // Update streak challenge
        handleUpdateChallengeProgress('streak_days', currentStreak);
        
        showToast(`Trabalho concluído! +${actualCoins} TrampoCoins ganhos 🎉`, "success");
        
        // Trigger review form for the completed job
        if (onCheckoutComplete) {
          onCheckoutComplete(activeJob);
        }
    }
  };

  const handleShare = async (job: Job) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?jobId=${job.id}`;
    const shareData = { title: `TrampoHero: ${job.title}`, text: `Vaga de ${job.niche} pagando R$ ${job.payment}!`, url: shareUrl };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copiado!", "success");
      }
    } catch (err) { console.error(err); }
  };

  const handleCreateJob = async () => {
    if (!newJobData.title || !newJobData.payment) return showToast("Preencha título e valor.", "error");

    const paymentAmount = parseFloat(newJobData.payment);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return showToast("Informe um valor válido maior que zero.", "error");
    }
    
    // Validate date is not in the past
    // Compare dates at midnight in local timezone to avoid timezone issues
    const jobDate = newJobData.date || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const jobDateObj = new Date(jobDate + 'T00:00:00');
    const todayObj = new Date(today + 'T00:00:00');
    
    if (jobDateObj < todayObj) {
      return showToast("Não é possível criar vagas com data passada.", "error");
    }
    
    const jobData = {
        title: newJobData.title,
        payment: paymentAmount,
        niche: newJobData.niche,
        location: 'São Paulo, SP',
        coordinates: { lat: -23.5505, lng: -46.6333 },
        description: newJobData.description || "Sem descrição.",
        date: jobDate,
        startTime: newJobData.startTime || "09:00",
        paymentType: 'dia',
        minRatingRequired: 0,
    };

    const result = await apiService.createJob(jobData);
    if (!result.success) {
      showToast(result.error || "Erro ao publicar vaga. Tente novamente.", "error");
      return;
    }

    const createdJob = result.data as Job | undefined;
    if (!createdJob) {
      showToast("Erro ao publicar vaga: resposta inválida do servidor.", "error");
      return;
    }

    setJobs(prev => [createdJob, ...prev]);
    setShowCreateJobModal(false);
    showToast("Vaga publicada com sucesso!", "success");
    setNewJobData({ title: '', payment: '', niche: Niche.RESTAURANT, date: '', startTime: '', description: '' });
  };

  const handleAutoDescription = async () => {
    if (!newJobData.title) return showToast("Digite um título primeiro", "error");
    setIsGeneratingDesc(true);
    const desc = await generateJobDescription(newJobData.title, newJobData.niche);
    setNewJobData(prev => ({ ...prev, description: desc }));
    setIsGeneratingDesc(false);
  };

  const simulateVoiceCreate = async () => {
    setIsRecording(true);
    showToast("Ouvindo... Fale a vaga.", "info");
    
    setTimeout(async () => {
      setIsRecording(false);
      const res = await generateVoiceJob("Preciso de um ajudante de cozinha para hoje 19h pagando 150 reais");
      if (res) {
        const newJob: Job = {
          id: Date.now().toString(), employerId: 'emp-1', title: res.title || "Vaga por Voz",
          employer: 'Buffet Delícia', employerRating: 4.8, niche: res.niche || Niche.RESTAURANT,
          location: 'Vila Madalena, SP', coordinates: { lat: -23.555, lng: -46.685 },
          payment: res.payment || 150, paymentType: 'dia', description: 'Criada via assistente de voz.',
          date: new Date().toISOString().split('T')[0], startTime: res.startTime || '19:00', status: 'open', minRatingRequired: 3.0
        };
        setJobs(prev => [newJob, ...prev]);
        showToast("Vaga criada por voz!", "success");
      } else {
        showToast("Não entendi, tente novamente.", "error");
      }
    }, 2500);
  };

  const handleManageJob = (job: Job) => {
    setSelectedJob(job);
  };

  const handleCloseJob = (jobId: string) => {
    if(confirm("Deseja encerrar esta vaga? Nenhuma nova candidatura será aceita.")) {
        setJobs(prev => prev.map(j => j.id === jobId ? {...j, status: 'completed' } : j));
        setSelectedJob(null);
        showToast("Vaga encerrada com sucesso.", "success");
    }
  };

  const handleApproveCandidate = (candidateName: string) => {
    // 1. Verificar qual vaga está selecionada
    if (!selectedJob) return;

    // 2. Verificar saldo do empregador
    if (user.wallet.balance < selectedJob.payment) {
        if(confirm(`Saldo insuficiente para aprovar ${candidateName}.\nValor do Serviço: R$ ${selectedJob.payment.toFixed(2)}\nSeu Saldo: R$ ${user.wallet.balance.toFixed(2)}\n\nDeseja recarregar sua carteira agora?`)) {
            setDepositAmount((selectedJob.payment - user.wallet.balance + 10).toString()); // Sugere valor faltante + margem
            setShowPaymentModal(true);
        }
        return;
    }

    // 3. Confirmar contratação e Debitar
    if(confirm(`Confirmar contratação de ${candidateName}?\n\nSerá debitado R$ ${selectedJob.payment.toFixed(2)} da sua carteira e retido em Escrow até a conclusão do serviço.`)) {
        // Debita do empregador
        const newTransaction: Transaction = {
            id: Date.now().toString(),
            type: 'job_payment',
            amount: -selectedJob.payment,
            date: new Date().toLocaleDateString('pt-BR'),
            description: `Contratação: ${candidateName} (${selectedJob.title})`
        };

        setUser(prev => ({
            ...prev,
            wallet: {
                ...prev.wallet,
                balance: prev.wallet.balance - selectedJob.payment,
                transactions: [newTransaction, ...prev.wallet.transactions]
            }
        }));

        // Atualiza status da vaga
        setJobs(prev => prev.map(j => j.id === selectedJob.id ? {...j, status: 'ongoing'} : j));
        setSelectedJob(null);
        showToast(`${candidateName} contratado! Valor retido em segurança.`, "success");
    }
  };

  const handleInviteTalent = (talentName: string, talentId?: string) => {
    // Cria novo convite e adiciona ao perfil do usuário
    // Gera ID único usando crypto API se disponível, ou fallback robusto
    const generateUniqueId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback robusto: timestamp + performance.now() para melhor unicidade
      const timestamp = Date.now();
      const performanceTime = typeof performance !== 'undefined' ? performance.now() : Math.random() * 10000;
      const randomPart = Math.random().toString(36).slice(2);
      return `inv-${timestamp}-${performanceTime.toFixed(0)}-${randomPart}`;
    };
    
    const newInvitation: Invitation = {
        id: generateUniqueId(),
        talentName: talentName,
        talentId: talentId || `talent-${generateUniqueId()}`,
        jobId: selectedJob?.id,
        jobTitle: selectedJob?.title || "Vaga Geral",
        status: 'pending',
        sentDate: new Date().toLocaleDateString('pt-BR')
    };
    
    setUser(prev => ({
        ...prev,
        invitations: [...(prev.invitations || []), newInvitation]
    }));
    
    showToast(`Convite enviado para ${talentName}! Você pode acompanhar na aba "Convites".`, "success");
  };

  return {
    handleApply,
    handleCheckIn,
    handleCheckout,
    handleShare,
    handleCreateJob,
    handleAutoDescription,
    simulateVoiceCreate,
    handleManageJob,
    handleCloseJob,
    handleApproveCandidate,
    handleInviteTalent,
  };
};
