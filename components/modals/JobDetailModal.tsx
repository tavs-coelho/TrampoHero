import React from 'react';
import { Job, UserProfile } from '../../types';

export interface JobDetailModalProps {
  job: Job;
  user: UserProfile;
  isApplying: boolean;
  handleApply: (job: Job) => void;
  handleShare: (job: Job) => void;
  handleApproveCandidate: (candidateName: string) => void;
  handleCloseJob: (jobId: string) => void;
  onClose: () => void;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  user,
  isApplying,
  handleApply,
  handleShare,
  handleApproveCandidate,
  handleCloseJob,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in slide-in-from-bottom-20 duration-500 overflow-hidden relative">
         {job.isBoosted && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 rotate-45 translate-x-16 -translate-y-16"></div>}
         <div className="flex justify-between items-start mb-8">
            <div>
               <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{job.niche}</span>
               <h3 className="text-4xl font-black mt-4 tracking-tighter leading-tight text-slate-900">{job.title}</h3>
            </div>
            <button onClick={onClose} className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center hover:text-slate-900 transition-colors">&times;</button>
         </div>
         
         {user.role === 'employer' && job.employerId === user.id ? (
            // --- VISUALIZAÇÃO DO EMPREGADOR (GESTÃO) ---
            <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-[2rem]">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-900 text-sm">Candidatos (2)</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Aguardando</span>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-black text-xs">JP</div>
                                <div>
                                    <p className="font-bold text-xs text-slate-900">João Paulo</p>
                                    <p className="text-[9px] text-amber-500 font-bold"><i className="fas fa-star"></i> 4.8</p>
                                </div>
                            </div>
                            <button onClick={() => handleApproveCandidate('João Paulo')} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase">Aprovar</button>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-black text-xs">MA</div>
                                <div>
                                    <p className="font-bold text-xs text-slate-900">Maria A.</p>
                                    <p className="text-[9px] text-amber-500 font-bold"><i className="fas fa-star"></i> 5.0</p>
                                </div>
                            </div>
                            <button onClick={() => handleApproveCandidate('Maria A.')} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase">Aprovar</button>
                        </div>
                    </div>
                </div>
                <button onClick={() => handleCloseJob(job.id)} className="w-full py-4 bg-red-50 text-red-600 rounded-[2rem] font-black uppercase tracking-widest hover:bg-red-100 transition-colors">
                    Encerrar Vaga
                </button>
            </div>
         ) : (
            // --- VISUALIZAÇÃO DO FREELANCER (APLICAÇÃO) ---
            <>
                <p className="text-slate-500 mb-10 text-base leading-relaxed font-medium">{job.description}</p>
                <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] mb-10">
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagamento</p><p className="text-3xl font-black text-indigo-600">R$ {job.payment}</p></div>
                    <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min. Avaliação</p>
                    <p className={`text-sm font-bold ${job.minRatingRequired && user.rating >= job.minRatingRequired ? 'text-emerald-500' : 'text-amber-500'}`}>
                        <i className="fas fa-star mr-1"></i>
                        {job.minRatingRequired || 'Todos'}
                    </p>
                    </div>
                </div>
                <div className="space-y-3">
                    <button onClick={() => handleApply(job)} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black shadow-2xl active:scale-95 transition-all text-xl">Aceitar Trampo Hero</button>
                    <button onClick={() => handleShare(job)} className="w-full py-4 bg-transparent text-indigo-600 font-bold text-sm uppercase tracking-widest hover:bg-indigo-50 rounded-[2.5rem] transition-colors">
                        <i className="fas fa-share-alt mr-2"></i> Compartilhar Link
                    </button>
                </div>
            </>
         )}
      </div>
    </div>
  );
};

export default JobDetailModal;
