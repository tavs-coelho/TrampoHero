import React from 'react';
import { UserProfile } from '../../types';
import { ANALYTICS_PREMIUM_PRICE } from '../../data/constants';

interface AnalyticsViewProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setView: (v: 'wallet') => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ user, setUser, showToast, setView }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <header className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Analytics Premium</h2>
        <p className="text-slate-500 text-sm">Insights sobre seus trabalhos</p>
      </div>
      <button onClick={() => setView('wallet')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
    </header>

    {user.analyticsAccess === 'free' ? (
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-8 rounded-[3rem] border-2 border-amber-200 text-center">
        <i className="fas fa-chart-line text-5xl text-amber-600 mb-4"></i>
        <h3 className="font-black text-xl text-slate-900 mb-2">Upgrade para Premium</h3>
        <p className="text-sm text-slate-600 mb-6">Acesse métricas avançadas, histórico completo e previsões com IA</p>
        <button 
          onClick={() => {
            showToast(`Analytics Premium ativado! R$ ${ANALYTICS_PREMIUM_PRICE}/mês`, "success");
            setUser(prev => ({ ...prev, analyticsAccess: 'premium' }));
          }}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl"
        >
          Assinar por R$ {ANALYTICS_PREMIUM_PRICE}/mês
        </button>
      </div>
    ) : (
      <>
        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold mb-1">Total Ganho</p>
            <p className="text-3xl font-black text-emerald-600">R$ 3.450</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold mb-1">Jobs Completos</p>
            <p className="text-3xl font-black text-indigo-600">24</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold mb-1">Média/Job</p>
            <p className="text-3xl font-black text-purple-600">R$ 143</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold mb-1">Retenção</p>
            <p className="text-3xl font-black text-amber-600">85%</p>
          </div>
        </div>

        {/* Gráfico Simulado */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100">
          <h3 className="font-black text-slate-900 mb-4">Ganhos dos Últimos 30 Dias</h3>
          <div className="flex items-end gap-2 h-32">
            {[120, 180, 150, 200, 160, 220, 190].map((h, i) => (
              <div key={i} className="flex-1 bg-indigo-200 rounded-t" style={{height: `${h/2.5}px`}}></div>
            ))}
          </div>
        </div>
      </>
    )}
  </div>
);
