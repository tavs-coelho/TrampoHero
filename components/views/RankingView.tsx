import React from 'react';
import { Niche, TalentRanking, UserProfile } from '../../types';

interface RankingViewProps {
  rankings: TalentRanking[];
  user: UserProfile;
  setView: (v: 'browse') => void;
}

export const RankingView: React.FC<RankingViewProps> = ({ rankings, user, setView }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <header className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-black text-slate-900">🏆 Ranking de Talentos</h2>
        <p className="text-slate-500 text-sm">Top freelancers da semana</p>
      </div>
      <button onClick={() => setView('browse')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
    </header>

    {/* Filter by Niche */}
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold whitespace-nowrap">Todos</button>
      {Object.values(Niche).map(niche => (
        <button key={niche} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold whitespace-nowrap hover:border-indigo-300">
          {niche}
        </button>
      ))}
    </div>

    {/* Rankings List */}
    <div className="space-y-3">
      {rankings.map((talent, index) => (
        <div 
          key={talent.userId} 
          className={`bg-white p-5 rounded-[2rem] border-2 transition-all ${
            index < 3 ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Rank Badge */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ${
              index === 0 ? 'bg-amber-400 text-white' :
              index === 1 ? 'bg-slate-300 text-white' :
              index === 2 ? 'bg-orange-400 text-white' :
              'bg-slate-100 text-slate-600'
            }`}>
              {talent.badge || `#${talent.rank}`}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-slate-900">{talent.userName}</h3>
                {talent.userId === user.id && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold">Você</span>
                )}
              </div>
              <p className="text-xs text-slate-500">{talent.niche}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-bold text-slate-600">
                  ⭐ {talent.rating.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  📊 {talent.weeklyJobs} jobs/semana
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <p className="text-2xl font-black text-indigo-600">{talent.score}</p>
              <p className="text-xs text-slate-400">pontos</p>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Your Position */}
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-[2.5rem] text-white">
      <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-2">Sua Posição</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-4xl font-black mb-1">#{rankings.find(r => r.userId === user.id)?.rank || '-'}</p>
          <p className="text-sm opacity-90">Continue assim para subir no ranking!</p>
        </div>
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm">
          🎯
        </div>
      </div>
    </div>
  </div>
);
