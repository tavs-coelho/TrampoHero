import React from 'react';
import { UserProfile } from '../types';
import { ViewType } from '../contexts/AppContext';

interface BottomNavProps {
  user: UserProfile;
  view: ViewType;
  setView: (view: ViewType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ user, view, setView }) => (
  <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-100 h-20 flex items-center justify-around px-8 z-50">
    <button onClick={() => setView(user.role === 'employer' ? 'dashboard' : 'browse')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'browse' || view === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
      <i className="fas fa-compass text-xl mb-1"></i>
      <span className="text-[8px] font-black uppercase tracking-widest">Início</span>
    </button>
    <button onClick={() => setView('active')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'active' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
      <i className="fas fa-briefcase text-xl mb-1"></i>
      <span className="text-[8px] font-black uppercase tracking-widest">Job Ativo</span>
    </button>
    <button onClick={() => setView('wallet')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'wallet' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
      <i className="fas fa-wallet text-xl mb-1"></i>
      <span className="text-[8px] font-black uppercase tracking-widest">Carteira</span>
    </button>
    <button onClick={() => setView('chat')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'chat' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
      <i className="fas fa-headset text-xl mb-1"></i>
      <span className="text-[8px] font-black uppercase tracking-widest">Suporte</span>
    </button>
  </div>
);
