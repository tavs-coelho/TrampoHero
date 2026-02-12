import React from 'react';
import { Job } from '../../types';

interface ActiveJobViewProps {
  activeJob: Job | undefined;
  isCheckedIn: boolean;
  handleCheckIn: () => void;
  handleCheckout: () => void;
  setView: (v: 'browse') => void;
}

export const ActiveJobView: React.FC<ActiveJobViewProps> = ({ activeJob, isCheckedIn, handleCheckIn, handleCheckout, setView }) => (
  activeJob ? (
    <div className="space-y-6 animate-in fade-in duration-500">
        <header>
            <h2 className="text-2xl font-black text-slate-900">Job em Andamento</h2>
            <p className="text-slate-500 text-sm">Realize o check-in para iniciar.</p>
        </header>
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{activeJob.title}</h3>
            <p className="text-slate-400 text-sm mb-6 flex items-center gap-2"><i className="fas fa-map-marker-alt text-indigo-500"></i> {activeJob.location}</p>
            
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${isCheckedIn ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {isCheckedIn ? 'Em Progresso' : 'Aguardando Chegada'}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Horário</span>
                    <span className="text-lg font-black text-slate-800">{activeJob.startTime}</span>
                </div>
            </div>

            {!isCheckedIn ? (
                <button onClick={handleCheckIn} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-3">
                    <i className="fas fa-map-pin"></i> Realizar Check-in
                </button>
            ) : (
                <div className="text-center space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <i className="fas fa-check-circle text-4xl text-emerald-500 mb-2"></i>
                        <p className="font-bold text-emerald-700">Check-in Realizado</p>
                        <p className="text-xs text-emerald-600 mt-1">Contrato enviado por e-mail.</p>
                    </div>
                    <button onClick={handleCheckout} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all">
                        Finalizar Job (Checkout)
                    </button>
                </div>
            )}
        </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-briefcase text-4xl text-slate-300"></i>
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Sem Job Ativo</h3>
        <p className="text-slate-400 text-sm mb-8">Você não aceitou nenhum trabalho ainda. Explore as vagas disponíveis!</p>
        <button onClick={() => setView('browse')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-colors">
            Procurar Vagas
        </button>
    </div>
  )
);
