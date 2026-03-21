import React, { useEffect, useState, useCallback } from 'react';
import { Job, UserProfile } from '../../types';
import { apiService } from '../../services/apiService';

interface Applicant {
  userId: string;
  name: string;
  rating: number | null;
  niche: string | null;
  status: string;
  appliedAt: string;
}

export interface JobDetailModalProps {
  job: Job;
  user: UserProfile;
  isApplying: boolean;
  handleApply: (job: Job) => void;
  handleShare: (job: Job) => void;
  handleApproveCandidate: (candidateName: string, candidateId?: string) => void;
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
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const isEmployerView = user.role === 'employer' && job.employerId === user.id;

  const loadApplicants = useCallback(async () => {
    if (!isEmployerView) return;
    setLoadingApplicants(true);
    const result = await apiService.getJobApplicants(job.id);
    if (result.success && Array.isArray(result.data)) {
      const mappedApplicants: Applicant[] = result.data
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }
          const {
            userId,
            name,
            rating = null,
            niche = null,
            status,
            appliedAt,
          } = item as {
            userId?: unknown;
            name?: unknown;
            rating?: unknown;
            niche?: unknown;
            status?: unknown;
            appliedAt?: unknown;
          };
          if (
            typeof userId !== 'string' ||
            typeof name !== 'string' ||
            typeof status !== 'string' ||
            typeof appliedAt !== 'string'
          ) {
            return null;
          }
          return {
            userId,
            name,
            rating: typeof rating === 'number' ? rating : null,
            niche: typeof niche === 'string' ? niche : null,
            status,
            appliedAt,
          } as Applicant;
        })
        .filter((applicant): applicant is Applicant => applicant !== null);
      setApplicants(mappedApplicants);
    } else {
      setApplicants([]);
    }
    setLoadingApplicants(false);
  }, [isEmployerView, job.id]);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  const handleSelect = async (candidate: Applicant) => {
    setSelectingId(candidate.userId);
    try {
      const result = await apiService.selectCandidate(job.id, candidate.userId);
      if (result.success) {
        handleApproveCandidate(candidate.name, candidate.userId);
      }
    } catch (error) {
      // Ensure errors from selectCandidate do not leave the UI stuck
      console.error('Failed to select candidate', error);
    } finally {
      setSelectingId(null);
      // Always refresh applicants, even if the API call fails
      loadApplicants();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-indigo-600 mb-1 block">{job.niche}</span>
            <h3 className="text-lg font-semibold text-slate-900 leading-snug">{job.title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors flex-shrink-0 text-sm">&times;</button>
        </div>

        <div className="p-5">
         {isEmployerView ? (
            // --- VISUALIZAÇÃO DO EMPREGADOR (GESTÃO) ---
            <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Candidatos ({loadingApplicants ? '…' : applicants.length})
                        </h4>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${job.status === 'applied' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {job.status === 'applied' ? 'Selecionado' : 'Aguardando'}
                        </span>
                    </div>
                    {loadingApplicants ? (
                      <p className="text-xs text-slate-400 text-center py-4">Carregando candidatos…</p>
                    ) : applicants.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Nenhum candidato ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {applicants.map(a => {
                          const initials = a.name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').slice(0, 2).toUpperCase();
                          const isApproved = a.status === 'approved';
                          const isRejected = a.status === 'rejected';
                          return (
                            <div key={a.userId} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-semibold text-xs text-slate-600">{initials}</div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{a.name}</p>
                                        <p className="text-xs text-amber-500"><i className="fas fa-star text-[10px]"></i> {a.rating != null ? a.rating.toFixed(1) : 'N/A'}</p>
                                    </div>
                                </div>
                                {isApproved ? (
                                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">Selecionado</span>
                                ) : isRejected ? (
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium">Rejeitado</span>
                                ) : (
                                  <button
                                    onClick={() => handleSelect(a)}
                                    disabled={selectingId === a.userId || job.status === 'applied'}
                                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-emerald-700 transition-colors"
                                  >
                                    {selectingId === a.userId ? '…' : 'Aprovar'}
                                  </button>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
                <button onClick={() => handleCloseJob(job.id)} className="w-full py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                    Encerrar vaga
                </button>
            </div>
         ) : (
            // --- VISUALIZAÇÃO DO FREELANCER (APLICAÇÃO) ---
            <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">{job.description}</p>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Pagamento</p>
                      <p className="text-xl font-bold text-indigo-600">R$ {job.payment}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-0.5">Avaliação mínima</p>
                      <p className={`text-sm font-semibold ${job.minRatingRequired && user.rating >= job.minRatingRequired ? 'text-emerald-600' : 'text-amber-600'}`}>
                        <i className="fas fa-star text-xs mr-1"></i>
                        {job.minRatingRequired || 'Todos'}
                      </p>
                    </div>
                </div>
                <div className="space-y-2">
                    <button onClick={() => handleApply(job)} disabled={isApplying} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                      {isApplying ? 'Candidatando…' : 'Candidatar-se'}
                    </button>
                    <button onClick={() => handleShare(job)} className="w-full py-2.5 text-slate-600 text-sm font-medium hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-center gap-2">
                        <i className="fas fa-share-alt text-xs"></i> Compartilhar
                    </button>
                </div>
            </div>
         )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;
