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
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold text-slate-900">Painel de Controle</h1>
      <div className="flex gap-2">
        <button
          onClick={simulateVoiceCreate}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isRecording ? 'bg-red-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          aria-label="Criar vaga por voz"
        >
          <i className={`fas ${isRecording ? 'fa-microphone' : 'fa-microphone-lines'} text-sm`}></i>
        </button>
        <button
          onClick={onCreateJobClick}
          className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <i className="fas fa-plus text-xs"></i>
          Nova vaga
        </button>
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
        <p className="text-xs text-slate-500 mb-1">Vagas ativas</p>
        <p className="text-2xl font-bold text-indigo-600">{filteredEmployerJobs.filter(j => j.status === 'open').length}</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
        <p className="text-xs text-slate-500 mb-1">Candidatos</p>
        <p className="text-2xl font-bold text-emerald-600">—</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
        <p className="text-xs text-slate-500 mb-1">Em andamento</p>
        <p className="text-2xl font-bold text-amber-600">{filteredEmployerJobs.filter(j => j.status === 'ongoing').length}</p>
      </div>
    </div>

    {/* Talentos em Destaque */}
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-slate-700">Talentos na região</h2>
        <button onClick={() => setView('talents')} className="text-xs text-indigo-600 font-medium hover:underline">
          Ver todos
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {TOP_TALENTS.slice(0, 4).map(talent => (
          <div key={talent.id} className="min-w-[130px] bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center">
            <div className="w-10 h-10 bg-slate-100 rounded-full mb-2 flex items-center justify-center font-semibold text-slate-600 text-sm">
              {talent.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h4 className="font-medium text-slate-900 text-xs mb-0.5 text-center line-clamp-1">{talent.name}</h4>
            <p className="text-[11px] text-slate-500 mb-2">{talent.role}</p>
            <div className="flex items-center gap-1 mb-3">
              <i className="fas fa-star text-[10px] text-amber-400"></i>
              <span className="text-xs font-medium text-slate-700">{talent.rating}</span>
            </div>
            <button
              onClick={() => handleInviteTalent(talent.name, talent.id)}
              className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-medium hover:bg-slate-700 transition-colors"
            >
              Convidar
            </button>
          </div>
        ))}
      </div>
    </div>

    {/* Minhas Vagas */}
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700">Minhas vagas</h2>
      {error ? (
        <ErrorState message={error} onRetry={onRetry} className="bg-white rounded-xl border border-slate-200 py-8" />
      ) : isLoading ? (
        <>
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </>
      ) : filteredEmployerJobs.length === 0 ? (
        <EmptyState
          icon="fa-folder-open"
          title="Nenhuma vaga criada"
          description="Crie sua primeira vaga para começar a contratar talentos."
          actionLabel="Criar Primeira Vaga"
          onAction={onCreateJobClick}
          className="bg-white rounded-xl border border-dashed border-slate-200 py-10"
        />
      ) : (
        filteredEmployerJobs.map(job => (
          <button
            type="button"
            key={job.id}
            onClick={() => handleManageJob(job)}
            className="w-full bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left flex justify-between items-center"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${job.status === 'open' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <h4 className="font-medium text-slate-800 text-sm">{job.title}</h4>
              </div>
              <p className="text-xs text-slate-400 ml-4">
                {new Date(job.date).toLocaleDateString('pt-BR')} &middot; {job.paymentType === 'dia' ? 'Diária' : 'Total'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900 text-sm">R$ {job.payment}</p>
              <p className="text-xs text-indigo-600 mt-0.5">Gerenciar</p>
            </div>
          </button>
        ))
      )}
    </div>
  </div>
);
