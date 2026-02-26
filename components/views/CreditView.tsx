import React from 'react';
import { UserProfile } from '../../types';
import { CREDIT_FEE_RATE } from '../../data/constants';

interface CreditViewProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setView: (v: 'wallet') => void;
}

export const CreditView: React.FC<CreditViewProps> = ({ user, setUser, showToast, setView }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <header className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-black text-slate-900">TrampoCredit</h2>
        <p className="text-slate-500 text-sm">Adiantamento salarial rápido</p>
      </div>
      <button onClick={() => setView('wallet')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
    </header>

    {/* Limite Disponível */}
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[3rem] text-white shadow-2xl">
      <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-2">Limite Disponível</p>
      <h3 className="text-5xl font-black mb-4">R$ 500,00</h3>
      <p className="text-sm opacity-80">Baseado no seu histórico de trabalho</p>
    </div>

    {/* Solicitar Crédito */}
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <h3 className="font-black text-slate-900 text-lg mb-4">Solicitar Adiantamento</h3>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Valor</label>
          <input type="number" placeholder="R$ 250,00" className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 focus:outline-indigo-500" />
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <p className="text-xs text-amber-800"><strong>Taxa:</strong> {(CREDIT_FEE_RATE * 100).toFixed(1)}% ao mês</p>
          <p className="text-xs text-amber-800 mt-1"><strong>Aprovação:</strong> Instantânea</p>
        </div>
        <button 
          onClick={() => showToast("Solicitação de crédito enviada! Aprovação em instantes.", "success")}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95"
        >
          Solicitar Agora
        </button>
      </div>
    </div>
  </div>
);
