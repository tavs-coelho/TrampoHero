import React, { useMemo } from 'react';
import { WeeklyChallenge } from '../../types';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { Skeleton } from '../Skeleton';

interface ChallengesViewProps {
  challenges: WeeklyChallenge[];
  setView: (v: 'browse') => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  challenges,
  setView,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const now = useMemo(() => Date.now(), []);
  const activeChallenges = challenges.filter(c => c.isActive && !c.isCompleted);
  const completedChallenges = challenges.filter(c => c.isCompleted);
  return (
  <div className="space-y-6 animate-in fade-in duration-500">
    <header className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-black text-slate-900">🔥 Desafios Semanais</h2>
        <p className="text-slate-500 text-sm">Complete desafios e ganhe recompensas</p>
      </div>
      <button onClick={() => setView('browse')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
    </header>

    {/* Active Challenges */}
    <div className="space-y-4">
      {error ? (
        <ErrorState message={error} onRetry={onRetry} className="bg-white rounded-[2.5rem] border border-slate-100" />
      ) : isLoading ? (
        <>
          <Skeleton className="h-48 rounded-[2.5rem]" />
          <Skeleton className="h-48 rounded-[2.5rem]" />
        </>
      ) : activeChallenges.length === 0 ? (
        <EmptyState
          icon="fa-fire"
          title="Sem desafios ativos"
          description="Novos desafios semanais serão liberados em breve."
          className="bg-white rounded-[2.5rem] border border-slate-100"
        />
      ) : activeChallenges.map(challenge => (
        <div key={challenge.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 hover:border-indigo-200 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-black text-lg text-slate-900 mb-1">{challenge.title}</h3>
              <p className="text-sm text-slate-600">{challenge.description}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl">
              <i className={`fas ${challenge.icon}`}></i>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
              <span>{challenge.requirement.current} / {challenge.requirement.target}</span>
              <span>{Math.round((challenge.requirement.current / challenge.requirement.target) * 100)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                style={{width: `${(challenge.requirement.current / challenge.requirement.target) * 100}%`}}
              ></div>
            </div>
          </div>

          {/* Reward */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-bold">Recompensa:</span>
            <span className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-black text-sm">
              {challenge.reward.type === 'cash' && `R$ ${challenge.reward.value}`}
              {challenge.reward.type === 'coins' && `${challenge.reward.value} Coins`}
              {challenge.reward.type === 'medal' && '🏆 Medalha Exclusiva'}
            </span>
          </div>

          {/* Time Remaining */}
          <div className="mt-3 text-xs text-slate-400 text-center">
            Termina em {Math.ceil((new Date(challenge.endDate).getTime() - now) / (1000 * 60 * 60 * 24))} dias
          </div>
        </div>
      ))}
    </div>

    {/* Completed Challenges */}
    {!isLoading && !error && completedChallenges.length > 0 && (
      <div>
        <h3 className="font-black text-slate-900 mb-3">✅ Completados</h3>
        <div className="space-y-3">
          {completedChallenges.map(challenge => (
            <div key={challenge.id} className="bg-slate-50 p-4 rounded-2xl opacity-70">
              <p className="font-bold text-sm">{challenge.title}</p>
              <p className="text-xs text-slate-500">Recompensa recebida!</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
  );
};
