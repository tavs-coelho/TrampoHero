import React from 'react';

interface EmployerActiveViewProps {
  setView: (v: 'dashboard') => void;
}

export const EmployerActiveView: React.FC<EmployerActiveViewProps> = ({ setView }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-in fade-in duration-500">
    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <i className="fas fa-users-viewfinder text-4xl text-slate-300"></i>
    </div>
    <h3 className="text-xl font-black text-slate-900 mb-2">Monitoramento de Jobs</h3>
    <p className="text-slate-400 text-sm mb-8">Acompanhe aqui o status em tempo real dos freelancers contratados.</p>
    <button onClick={() => setView('dashboard')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-colors">
        Voltar ao Painel
    </button>
  </div>
);
