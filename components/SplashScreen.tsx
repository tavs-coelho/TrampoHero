import React from 'react';

export const SplashScreen: React.FC = () => (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center animate-out fade-out duration-500 delay-1000 fill-mode-forwards pointer-events-none">
        <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-bolt text-2xl text-white"></i>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">TrampoHero</h1>
        <p className="text-sm text-slate-400">Trabalhos temporários no Brasil</p>
    </div>
);
