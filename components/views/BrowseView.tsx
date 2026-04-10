import React from 'react';
import { Job, Niche, UserProfile } from '../../types';
import { JobCard } from '../JobCard';
import { JobCardSkeleton } from '../JobCardSkeleton';

interface BrowseViewProps {
  sortedOpenJobs: Job[];
  browseMode: 'list' | 'map';
  setBrowseMode: React.Dispatch<React.SetStateAction<'list' | 'map'>>;
  filterNiche: string;
  setFilterNiche: (v: string) => void;
  setSelectedJob: (job: Job | null) => void;
  mapContainerRef: React.RefObject<HTMLDivElement>;
  user: UserProfile;
  setView: (v: any) => void;
  setShowPrimeModal: (v: boolean) => void;
  isLoading?: boolean;
}

export const BrowseView: React.FC<BrowseViewProps> = ({
  sortedOpenJobs,
  browseMode,
  setBrowseMode,
  filterNiche,
  setFilterNiche,
  setSelectedJob,
  mapContainerRef,
  user,
  setView,
  setShowPrimeModal,
  isLoading = false,
}) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold text-slate-900">Vagas disponíveis</h1>
      <button
        aria-label={browseMode === 'list' ? 'Alternar para mapa' : 'Alternar para lista'}
        onClick={() => setBrowseMode(m => m === 'list' ? 'map' : 'list')}
        className="btn-ghost btn-sm"
      >
        <i className={`fas ${browseMode === 'list' ? 'fa-map' : 'fa-list'} text-sm`}></i>
        <span className="text-xs font-medium">{browseMode === 'list' ? 'Mapa' : 'Lista'}</span>
      </button>
    </div>

    {/* Filtros de Categoria */}
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      <button
        onClick={() => setFilterNiche('All')}
          className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterNiche === 'All'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
        }`}
      >
        Todos
      </button>
      {Object.values(Niche).map(n => (
        <button
          key={n}
          onClick={() => setFilterNiche(n)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterNiche === n
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
        >
          {n}
        </button>
      ))}
    </div>

    {browseMode === 'map' ? (
      <div className="relative h-[480px] w-full max-sm:h-[420px]">
        <div ref={mapContainerRef} className="h-full w-full overflow-hidden rounded-xl border border-slate-200 z-0"></div>
        <div className="absolute top-3 right-3 z-[1] bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 pointer-events-none">
          Clique nos marcadores
        </div>
      </div>
    ) : (
      <div className="space-y-3">
        {!user.isPrime && (
          <button
            onClick={() => setShowPrimeModal(true)}
            className="w-full rounded-xl bg-brand-600 p-4 text-left text-white transition-colors hover:bg-brand-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold mb-0.5">Seja Hero Prime</p>
                <p className="text-xs text-indigo-200">Saque grátis, seguro e vagas VIP</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg text-xs font-medium">
                <i className="fas fa-crown text-xs"></i>
                Assinar
              </div>
            </div>
          </button>
        )}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <JobCardSkeleton key={i} />)
        ) : sortedOpenJobs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <i className="fas fa-search text-3xl mb-3"></i>
            <p className="text-sm font-medium">Nenhuma vaga encontrada nesta categoria.</p>
          </div>
        ) : (
          sortedOpenJobs.map(job => (
            <JobCard key={job.id} job={job} onClick={setSelectedJob} />
          ))
        )}
      </div>
    )}
  </div>
);
