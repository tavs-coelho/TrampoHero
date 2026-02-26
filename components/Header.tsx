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
  <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 h-16 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-3" onClick={() => setView('browse')}>
      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-slate-800 transition-colors">
        <i className="fas fa-bolt text-indigo-400"></i>
      </div>
      <div className="cursor-pointer">
        <span className="font-black text-lg tracking-tighter block leading-none">TrampoHero</span>
        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">PRO Version</span>
      </div>
    </div>
    <div className="flex items-center gap-4">
      {user.role === 'freelancer' && (
         user.isPrime ? (
            <div onClick={() => setShowPrimeModal(true)} className="bg-indigo-600 text-white flex items-center gap-1 text-[8px] font-black px-3 py-1.5 rounded-full animate-pulse shadow-lg shadow-indigo-300 cursor-pointer">
                <i className="fas fa-crown"></i> PRIME ATIVO
            </div>
          ) : (
            <div onClick={() => setShowPrimeModal(true)} className="text-slate-300 hover:text-amber-500 cursor-pointer transition-colors">
                <i className="fas fa-crown text-xl"></i>
            </div>
          )
      )}
      <div onClick={() => setView('profile')} className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
         <i className="fas fa-user text-slate-500 text-xs"></i>
      </div>
      <button onClick={() => setUser(prev => ({ ...prev, role: prev.role === 'freelancer' ? 'employer' : 'freelancer' }))} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border bg-white text-slate-500 border-slate-200 hover:bg-slate-50 transition-colors">
        {user.role === 'freelancer' ? 'Modo Empresa' : 'Modo Freelancer'}
      </button>
    </div>
  </nav>
);
