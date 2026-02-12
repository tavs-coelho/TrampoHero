import React from 'react';
import { UserProfile, Transaction, WeeklyChallenge } from '../types';
import { MEDALS_REPO } from '../data/mockData';

export const useChallengeActions = (deps: {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  challenges: WeeklyChallenge[];
  setChallenges: React.Dispatch<React.SetStateAction<WeeklyChallenge[]>>;
  showToast: (msg: string, type?: 'success'|'error'|'info') => void;
}) => {
  const { user, setUser, challenges, setChallenges, showToast } = deps;

  const handleClaimChallengeReward = (challenge: WeeklyChallenge) => {
    if (challenge.reward.type === 'cash') {
      const amount = typeof challenge.reward.value === 'number' ? challenge.reward.value : 0;
      const newTransaction: Transaction = {
        id: `challenge-${Date.now()}`,
        type: 'deposit',
        amount: amount,
        date: new Date().toLocaleDateString('pt-BR'),
        description: `Desafio Completado: ${challenge.title}`
      };
      
      setUser(prev => ({
        ...prev,
        wallet: {
          ...prev.wallet,
          balance: prev.wallet.balance + amount,
          transactions: [newTransaction, ...prev.wallet.transactions]
        }
      }));
      
      showToast(`🎉 Desafio completado! +R$ ${amount} na carteira!`, "success");
    } else if (challenge.reward.type === 'coins') {
      const coins = typeof challenge.reward.value === 'number' ? challenge.reward.value : 0;
      setUser(prev => ({
        ...prev,
        trampoCoins: prev.trampoCoins ? {
          ...prev.trampoCoins,
          balance: prev.trampoCoins.balance + coins,
          earned: [...prev.trampoCoins.earned, {
            id: `challenge-${Date.now()}`,
            type: 'coin_earned',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            description: `Desafio: ${challenge.title}`,
            coins: coins
          }]
        } : prev.trampoCoins
      }));
      
      showToast(`🎉 Desafio completado! +${coins} TrampoCoins!`, "success");
    } else if (challenge.reward.type === 'medal') {
      // Award special medal
      const medalId = typeof challenge.reward.value === 'string' ? challenge.reward.value : 'm-challenge';
      const medal = MEDALS_REPO.find(m => m.id === medalId) || {
        id: medalId,
        name: 'Desafio Completado',
        icon: 'fa-trophy',
        color: 'text-amber-500',
        description: challenge.title
      };
      
      setUser(prev => ({
        ...prev,
        medals: [...prev.medals, medal]
      }));
      
      showToast(`🏆 Desafio completado! Nova medalha desbloqueada!`, "success");
    }
  };

  const handleUpdateChallengeProgress = (challengeType: 'jobs_completed' | 'referrals' | 'streak_days' | 'rating_maintained', increment: number = 1) => {
    setChallenges(prev => prev.map(challenge => {
      if (challenge.requirement.type === challengeType && challenge.isActive && !challenge.isCompleted) {
        const newCurrent = challenge.requirement.current + increment;
        const isNowCompleted = newCurrent >= challenge.requirement.target;
        
        // If challenge is completed, give reward
        if (isNowCompleted && !challenge.isCompleted) {
          handleClaimChallengeReward(challenge);
        }
        
        return {
          ...challenge,
          requirement: {
            ...challenge.requirement,
            current: Math.min(newCurrent, challenge.requirement.target)
          },
          isCompleted: isNowCompleted
        };
      }
      return challenge;
    }));
  };

  return {
    handleUpdateChallengeProgress,
    handleClaimChallengeReward,
  };
};
