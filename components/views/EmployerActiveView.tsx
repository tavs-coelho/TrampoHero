import React from 'react';
import { Job } from '../../types';

interface EmployerActiveViewProps {
  setView: (v: 'dashboard') => void;
  waitingApprovalJobs?: Job[];
  onApproveCompletion?: (jobId: string) => void;
}

export const EmployerActiveView: React.FC<EmployerActiveViewProps> = ({ setView, waitingApprovalJobs = [], onApproveCompletion }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <header>
      <h2 className="text-2xl font-black text-slate-900">Monitoramento de Jobs</h2>
      <p className="text-slate-500 text-sm">Acompanhe o status em tempo real dos freelancers contratados.</p>
    </header>

    {waitingApprovalJobs.length > 0 && (
      <div className="space-y-3">
        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 px-2">Aguardando Sua Aprovação</h3>
        {waitingApprovalJobs.map(job => (
          <div key={job.id} className="bg-white p-5 rounded-[2rem] border border-amber-200 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-full">Aguardando Aprovação</span>
                <h4 className="font-bold text-slate-800 text-sm mt-1">{job.title}</h4>
                <p className="text-[10px] text-slate-400">{job.location}</p>
              </div>
              <p className="font-black text-slate-900 text-sm">R$ {job.payment}</p>
            </div>
            {job.proofPhoto && (
              <div className="mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prova Fotográfica</p>
                <img src={job.proofPhoto} alt="Prova" className="w-24 h-24 rounded-xl object-cover border border-slate-200" />
              </div>
            )}
            <button
              onClick={() => onApproveCompletion?.(job.id)}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
            >
              <i className="fas fa-check-circle mr-2"></i> Aprovar Conclusão
            </button>
          </div>
        ))}
      </div>
    )}

    {waitingApprovalJobs.length === 0 && (
      <div className="flex flex-col items-center justify-center h-[40vh] text-center p-6">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-users-viewfinder text-4xl text-slate-300"></i>
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Nenhum Job Pendente</h3>
        <p className="text-slate-400 text-sm mb-8">Quando um freelancer finalizar o serviço, aparecerá aqui para sua aprovação.</p>
        <button onClick={() => setView('dashboard')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-colors">
            Voltar ao Painel
        </button>
      </div>
    )}
  </div>
);

