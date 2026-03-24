import React from 'react';
import { UserProfile } from '../types';
import { ViewType } from '../contexts/AppContext';

interface HeaderProps {
  user: UserProfile;
  setView: (view: ViewType) => void;
  setShowPrimeModal: (show: boolean) => void;
  setUser: (updater: (prev: UserProfile) => UserProfile) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, setView, setShowPrimeModal, setUser }) => (
  <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 h-14 flex items-center justify-between">
    <button type="button" className="flex items-center gap-2.5 text-left" onClick={() => setView('browse')} aria-label="Ir para início">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
        <i className="fas fa-bolt text-sm"></i>
      </div>
      <span className="font-bold text-base text-slate-900 tracking-tight">TrampoHero</span>
    </button>
    <div className="flex items-center gap-3">
      {user.role === 'freelancer' && (
        user.isPrime ? (
          <button
            type="button"
            onClick={() => setShowPrimeModal(true)}
            className="hidden sm:flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md"
            aria-label="Abrir Hero Prime"
          >
            <i className="fas fa-crown text-xs"></i>
            Prime ativo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowPrimeModal(true)}
            className="hidden sm:flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-xs font-medium transition-colors"
            aria-label="Conhecer Hero Prime"
          >
            <i className="fas fa-crown"></i>
            Prime
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => setView('profile')}
        className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors"
        aria-label="Abrir perfil"
      >
        <i className="fas fa-user text-slate-500 text-xs"></i>
      </button>
      <button
        onClick={() => setUser(prev => ({ ...prev, role: prev.role === 'freelancer' ? 'employer' : 'freelancer' }))}
        className="px-3 py-1.5 rounded-md text-xs font-medium border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 transition-colors"
      >
        {user.role === 'freelancer' ? 'Empresa' : 'Freelancer'}
      </button>
    </div>
  </nav>
);
