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
  <nav className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:px-6">
    <button type="button" className="flex items-center gap-2.5 text-left" onClick={() => setView('browse')} aria-label="Ir para início">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
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
            className="btn-primary btn-sm hidden sm:inline-flex"
            aria-label="Abrir Hero Prime"
          >
            <i className="fas fa-crown text-xs"></i>
            Prime ativo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowPrimeModal(true)}
            className="btn-ghost btn-sm hidden sm:inline-flex"
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
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100"
        aria-label="Abrir perfil"
      >
        <i className="fas fa-user text-slate-500 text-xs"></i>
      </button>
      <button
        onClick={() => setUser(prev => ({ ...prev, role: prev.role === 'freelancer' ? 'employer' : 'freelancer' }))}
        className="btn-ghost btn-sm"
      >
        {user.role === 'freelancer' ? 'Empresa' : 'Freelancer'}
      </button>
    </div>
  </nav>
);
