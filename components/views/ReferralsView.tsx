import React from 'react';
import { UserProfile } from '../../types';
import { REFERRAL_BONUS_FREELANCER } from '../../data/constants';

interface ReferralsViewProps {
  user: UserProfile;
  handleApplyReferralCode: (code: string) => void;
  handleCompleteReferral: (id: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setView: (v: 'wallet') => void;
}

export const ReferralsView: React.FC<ReferralsViewProps> = ({ user, handleApplyReferralCode, handleCompleteReferral, showToast, setView }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <header className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Indique e Ganhe</h2>
        <p className="text-slate-500 text-sm">Programa de indicações</p>
      </div>
      <button onClick={() => setView('wallet')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
    </header>

    {/* Código de Indicação */}
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 rounded-[3rem] text-white shadow-2xl">
      <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-2">Seu Código</p>
      <div className="flex items-center justify-between bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
        <span className="text-2xl font-black tracking-wider">{user.referralCode}</span>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(user.referralCode || '');
            showToast("Código copiado!", "success");
          }}
          className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-black"
        >
          COPIAR
        </button>
      </div>
      <p className="text-sm mt-4 opacity-90">Ganhe R$ {REFERRAL_BONUS_FREELANCER} por cada indicação!</p>
    </div>

    {/* Estatísticas */}
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
        <p className="text-3xl font-black text-indigo-600 mb-1">5</p>
        <p className="text-xs text-slate-500 font-bold">Indicações</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
        <p className="text-3xl font-black text-emerald-600 mb-1">R$ 100</p>
        <p className="text-xs text-slate-500 font-bold">Ganhos</p>
      </div>
    </div>

    {/* Como Funciona */}
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100">
      <h3 className="font-black text-slate-900 text-lg mb-4">Como Funciona</h3>
      <ol className="space-y-3 text-sm">
        <li className="flex gap-3">
          <span className="font-black text-indigo-600">1.</span>
          <span>Compartilhe seu código com amigos</span>
        </li>
        <li className="flex gap-3">
          <span className="font-black text-indigo-600">2.</span>
          <span>Eles se cadastram com seu código</span>
        </li>
        <li className="flex gap-3">
          <span className="font-black text-indigo-600">3.</span>
          <span>Vocês dois ganham após o 1º trabalho</span>
        </li>
      </ol>
    </div>
  </div>
);
