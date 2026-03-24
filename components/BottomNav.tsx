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
  <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 h-16 flex items-center justify-around px-6 z-50">
    {isNavigating && (
      <div className="absolute top-0 left-0 h-0.5 bg-indigo-500 animate-pulse w-full" aria-hidden="true" />
    )}
    <button
      aria-label="Ir para início"
      onClick={() => setView(user.role === 'employer' ? 'dashboard' : 'browse')}
      className={`flex flex-col items-center gap-1 transition-colors ${view === 'browse' || view === 'dashboard' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <i className="fas fa-house text-lg"></i>
      <span className="text-[10px] font-medium">Início</span>
    </button>
    <button
      aria-label="Ir para job ativo"
      onClick={() => setView('active')}
      className={`flex flex-col items-center gap-1 transition-colors ${view === 'active' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <i className="fas fa-briefcase text-lg"></i>
      <span className="text-[10px] font-medium">Job Ativo</span>
    </button>
    <button
      aria-label="Ir para carteira"
      onClick={() => setView('wallet')}
      className={`flex flex-col items-center gap-1 transition-colors ${view === 'wallet' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <i className="fas fa-wallet text-lg"></i>
      <span className="text-[10px] font-medium">Carteira</span>
    </button>
    {user.role === 'admin' ? (
      <button
        aria-label="Ir para admin"
        onClick={() => setView('admin')}
        className={`flex flex-col items-center gap-1 transition-colors ${view === 'admin' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <i className="fas fa-shield-halved text-lg"></i>
        <span className="text-[10px] font-medium">Admin</span>
      </button>
    ) : (
      <button
        aria-label="Ir para suporte"
        onClick={() => setView('chat')}
        className={`flex flex-col items-center gap-1 transition-colors ${view === 'chat' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <i className="fas fa-headset text-lg"></i>
        <span className="text-[10px] font-medium">Suporte</span>
      </button>
    )}
  </div>
);
