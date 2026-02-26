import React from 'react';

export const SplashScreen: React.FC = () => (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center animate-out fade-out duration-1000 delay-1000 fill-mode-forwards pointer-events-none">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/50 mb-6 animate-bounce">
            <i className="fas fa-bolt text-4xl text-white"></i>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">TrampoHero</h1>
        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Conectando Talentos</p>
    </div>
);
