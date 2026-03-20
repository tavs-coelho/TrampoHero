import React from 'react';
import { UserProfile } from '../types';
import { ViewType } from '../contexts/AppContext';

interface BottomNavProps {
  user: UserProfile;
  view: ViewType;
  setView: (view: ViewType) => void;
  isNavigating?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ user, view, setView, isNavigating = false }) => (
  <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-100 h-20 flex items-center justify-around px-8 z-50">
    {isNavigating && (
      <div className="absolute top-0 left-0 h-0.5 bg-indigo-500 animate-pulse w-full" aria-hidden="true" />
    )}
    <button aria-label="Ir para início" onClick={() => setView(user.role === 'employer' ? 'dashboard' : 'browse')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'browse' || view === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
      <i className="fas fa-compass text-xl mb-1"></i>
      <span className="text-[8px] font-black uppercase tracking-widest">Início</span>
    </button>
    <button aria-label="Ir para job ativo" onClick={() => setView('active')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'active' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
      <i className="fas fa-briefcase text-xl mb-1"></i>
      <span className="text-[8px] font-black uppercase tracking-widest">Job Ativo</span>
    </button>
    <button aria-label="Ir para carteira" onClick={() => setView('wallet')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'wallet' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
      <i className="fas fa-wallet text-xl mb-1"></i>
      <span className="text-[8px] font-black uppercase tracking-widest">Carteira</span>
    </button>
    {user.role === 'admin' ? (
      <button aria-label="Ir para admin" onClick={() => setView('admin')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'admin' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
        <i className="fas fa-shield-halved text-xl mb-1"></i>
        <span className="text-[8px] font-black uppercase tracking-widest">Admin</span>
      </button>
    ) : (
      <button aria-label="Ir para suporte" onClick={() => setView('chat')} className={`flex flex-col items-center transition-transform active:scale-95 ${view === 'chat' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
        <i className="fas fa-headset text-xl mb-1"></i>
        <span className="text-[8px] font-black uppercase tracking-widest">Suporte</span>
      </button>
    )}
  </div>
);
