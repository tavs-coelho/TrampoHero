import React from 'react';
import { Job, UserProfile } from '../../types';
import { TOP_TALENTS } from '../../data/mockData';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { Skeleton } from '../Skeleton';

interface DashboardViewProps {
  user: UserProfile;
  filteredEmployerJobs: Job[];
  filterNiche: string;
  setFilterNiche: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterDate: string;
  setFilterDate: (v: string) => void;
  handleManageJob: (job: Job) => void;
  simulateVoiceCreate: () => void;
  isRecording: boolean;
  onCreateJobClick: () => void;
  aiSuggestion: string | null;
  handleShowInvoices: () => void;
  handleOpenAddBalance: () => void;
  handleInviteTalent: (name: string, id?: string) => void;
  setView: (v: 'talents') => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  filteredEmployerJobs,
  filterNiche,
  setFilterNiche,
  filterStatus,
  setFilterStatus,
  filterDate,
  setFilterDate,
  handleManageJob,
  simulateVoiceCreate,
  isRecording,
  onCreateJobClick,
  aiSuggestion,
  handleShowInvoices,
  handleOpenAddBalance,
  handleInviteTalent,
  setView,
  isLoading = false,
  error = null,
  onRetry,
}) => (
  <>
    <header className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-black text-slate-900">Painel de Controle</h2>
      <div className="flex gap-2">
        <button onClick={simulateVoiceCreate} className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
          <i className={`fas ${isRecording ? 'fa-microphone' : 'fa-microphone-lines'}`}></i>
        </button>
        <button onClick={onCreateJobClick} className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"><i className="fas fa-plus"></i></button>
      </div>
    </header>

    {/* Dashboard Stats */}
    <div className="grid grid-cols-3 gap-3 mb-8">
       <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Vagas Ativas</p>
           <p className="text-xl font-black text-indigo-600">{filteredEmployerJobs.filter(j => j.status === 'open').length}</p>
       </div>
       <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Candidatos</p>
           <p className="text-xl font-black text-emerald-500">12</p>
       </div>
       <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Em Andamento</p>
           <p className="text-xl font-black text-amber-500">{filteredEmployerJobs.filter(j => j.status === 'ongoing').length}</p>
       </div>
    </div>

    {/* Talentos em Destaque (Carrossel) */}
    <div className="mb-8">
       <div className="flex justify-between items-end mb-4 px-2">
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Talentos na Região</h3>
          <button onClick={() => setView('talents')} className="text-[10px] font-bold text-indigo-600">Ver todos</button>
       </div>
       <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {TOP_TALENTS.slice(0, 4).map(talent => (
              <div key={talent.id} className="min-w-[140px] bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col items-center relative">
                 <div className="w-12 h-12 bg-slate-100 rounded-full mb-2 flex items-center justify-center font-black text-slate-500 text-sm">
                    {talent.name.split(' ').map(n=>n[0]).join('')}
                 </div>
                 <h4 className="font-bold text-slate-900 text-xs mb-1 text-center line-clamp-1">{talent.name}</h4>
                 <p className="text-[10px] text-slate-500 mb-2">{talent.role}</p>
                 <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full mb-3">
                    <i className="fas fa-star text-[8px] text-amber-400"></i>
                    <span className="text-[9px] font-bold text-amber-600">{talent.rating}</span>
                 </div>
                 <button onClick={() => handleInviteTalent(talent.name, talent.id)} className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-bold uppercase active:scale-95 transition-transform">Convidar</button>
              </div>
          ))}
       </div>
    </div>

    <div className="space-y-4">
      <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 px-2">Gerenciar Minhas Vagas</h3>
      {error ? (
        <ErrorState message={error} onRetry={onRetry} className="bg-white rounded-[2rem] border border-slate-100 py-8" />
      ) : isLoading ? (
        <>
          <Skeleton className="h-28 rounded-[2rem]" />
          <Skeleton className="h-28 rounded-[2rem]" />
        </>
      ) : filteredEmployerJobs.length === 0 ? (
        <EmptyState
          icon="fa-folder-open"
          title="Nenhuma vaga criada"
          description="Crie sua primeira vaga para começar a contratar talentos."
          actionLabel="Criar Primeira Vaga"
          onAction={onCreateJobClick}
          className="bg-white rounded-[2rem] border border-dashed border-slate-200 py-10"
        />
      ) : (
        filteredEmployerJobs.map(job => (
            <div key={job.id} onClick={() => handleManageJob(job)} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center active:scale-[0.99]">
               <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${job.status === 'open' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        <h4 className="font-bold text-slate-800 text-sm">{job.title}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400">{new Date(job.date).toLocaleDateString('pt-BR')} • {job.paymentType === 'dia' ? 'Diária' : 'Total'}</p>
               </div>
               <div className="text-right">
                    <p className="font-black text-slate-900 text-sm">R$ {job.payment}</p>
                    <button className="text-[9px] font-bold text-indigo-600 uppercase mt-1">Gerenciar</button>
               </div>
            </div>
        ))
      )}
    </div>
  </>
);
