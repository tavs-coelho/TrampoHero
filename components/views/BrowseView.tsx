import React from 'react';
import { Job, Niche, UserProfile } from '../../types';
import { JobCard } from '../JobCard';

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
}) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black text-slate-900">Freelas Próximos</h2>
      <div className="flex gap-2">
        <button onClick={() => setBrowseMode(m => m === 'list' ? 'map' : 'list')} className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
          <i className={`fas ${browseMode === 'list' ? 'fa-map' : 'fa-list'}`}></i>
        </button>
      </div>
    </div>

    {/* Filtros de Categoria (Pills) */}
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button onClick={() => setFilterNiche('All')} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${filterNiche === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>Todos</button>
        {Object.values(Niche).map(n => (
            <button key={n} onClick={() => setFilterNiche(n)} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${filterNiche === n ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>
                {n}
            </button>
        ))}
    </div>

    {browseMode === 'map' ? (
      <div className="relative h-[500px] w-full mb-6">
        <div ref={mapContainerRef} className="h-full w-full shadow-2xl rounded-[3rem] border-4 border-white overflow-hidden z-0"></div>
        <div className="absolute top-4 right-4 z-[1] bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">
          Clique nos ícones
        </div>
      </div>
    ) : (
      <div className="grid gap-4">
        {!user.isPrime && (
          <div onClick={() => setShowPrimeModal(true)} className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl cursor-pointer relative overflow-hidden group hover:shadow-2xl transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><i className="fas fa-crown text-5xl"></i></div>
            <h3 className="text-lg font-black mb-1">Seja Hero Prime</h3>
            <p className="text-xs opacity-80 mb-4">Saque grátis, seguro e vagas VIP.</p>
            <span className="text-[10px] font-bold uppercase bg-white/20 px-3 py-1 rounded-full group-hover:bg-white group-hover:text-indigo-600 transition-colors">Assinar agora</span>
          </div>
        )}
        {sortedOpenJobs.length === 0 ? (
            <div className="text-center py-20 opacity-50">
                <i className="fas fa-search text-4xl mb-4"></i>
                <p className="font-bold">Nenhum bico encontrado nesta categoria.</p>
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
