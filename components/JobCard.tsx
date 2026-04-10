import React from 'react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(job)}
    className={`surface-card-interactive relative w-full text-left ${
      job.isBoosted
        ? 'border-amber-300 shadow-md hover:shadow-lg'
        : ''
    }`}
  >
    {job.isBoosted && (
      <div className="badge absolute -top-2.5 left-4 bg-amber-400 text-white">
        <i className="fas fa-bolt text-xs"></i> Destaque
      </div>
    )}
    <div className="p-4">
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs font-medium text-indigo-600">{job.niche}</span>
        <p className="font-bold text-slate-900 text-base">R$ {job.payment}</p>
      </div>
      <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-2">{job.title}</h3>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span><i className="fas fa-building mr-1"></i>{job.employer}</span>
        {job.isEscrowGuaranteed && (
          <span className="text-emerald-600 font-medium flex items-center gap-1">
            <i className="fas fa-shield-check"></i> Pagamento garantido
          </span>
        )}
      </div>
    </div>
  </button>
);
