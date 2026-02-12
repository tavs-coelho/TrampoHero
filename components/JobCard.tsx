import React from 'react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => (
  <div onClick={() => onClick(job)} className={`bg-white p-6 rounded-[3rem] border transition-all cursor-pointer relative active:scale-[0.98] ${job.isBoosted ? 'border-amber-400 shadow-amber-100 shadow-xl' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
    {job.isBoosted && <div className="absolute -top-3 left-8 bg-amber-400 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest"><i className="fas fa-bolt mr-1"></i> Destaque</div>}
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] font-black text-indigo-500 uppercase">{job.niche}</span>
      <p className="font-black text-slate-900 text-lg">R$ {job.payment}</p>
    </div>
    <h3 className="font-bold text-slate-800 text-lg leading-tight">{job.title}</h3>
    <div className="flex items-center gap-3 mt-3">
      <p className="text-[10px] text-slate-400 font-bold uppercase"><i className="fas fa-building mr-1"></i> {job.employer}</p>
      {job.isEscrowGuaranteed && <span className="text-[8px] text-emerald-600 font-black uppercase flex items-center gap-1"><i className="fas fa-shield-check"></i> Seguro</span>}
    </div>
  </div>
);
