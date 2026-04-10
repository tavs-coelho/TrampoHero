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
  <div className="fixed bottom-0 left-0 z-50 flex h-18 w-full items-center justify-around border-t border-slate-200 bg-white/95 px-4 shadow-[0_-8px_20px_rgba(15,23,42,0.05)] backdrop-blur supports-[backdrop-filter]:bg-white/90">
    {isNavigating && (
      <div className="absolute top-0 left-0 h-0.5 bg-indigo-500 animate-pulse w-full" aria-hidden="true" />
    )}
    <button
      aria-label="Ir para início"
      onClick={() => setView(user.role === 'employer' ? 'dashboard' : 'browse')}
      className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 transition-colors ${view === 'browse' || view === 'dashboard' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
    >
      <i className="fas fa-house text-lg"></i>
      <span className="text-xs font-medium">Início</span>
    </button>
    <button
      aria-label="Ir para job ativo"
      onClick={() => setView('active')}
      className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 transition-colors ${view === 'active' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
    >
      <i className="fas fa-briefcase text-lg"></i>
      <span className="text-xs font-medium">Job Ativo</span>
    </button>
    <button
      aria-label="Ir para carteira"
      onClick={() => setView('wallet')}
      className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 transition-colors ${view === 'wallet' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
    >
      <i className="fas fa-wallet text-lg"></i>
      <span className="text-xs font-medium">Carteira</span>
    </button>
    {user.role === 'admin' ? (
      <button
        aria-label="Ir para admin"
        onClick={() => setView('admin')}
        className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 transition-colors ${view === 'admin' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
      >
        <i className="fas fa-shield-halved text-lg"></i>
        <span className="text-xs font-medium">Admin</span>
      </button>
    ) : (
      <button
        aria-label="Ir para suporte"
        onClick={() => setView('chat')}
        className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 transition-colors ${view === 'chat' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
      >
        <i className="fas fa-headset text-lg"></i>
        <span className="text-xs font-medium">Suporte</span>
      </button>
    )}
  </div>
);
