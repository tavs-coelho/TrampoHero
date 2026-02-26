import React from 'react';
import { Job, UserProfile } from '../../types';

interface EmployerProfileViewProps {
  user: UserProfile;
  filteredEmployerJobs: Job[];
}

export const EmployerProfileView: React.FC<EmployerProfileViewProps> = ({ user, filteredEmployerJobs }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="bg-white p-8 rounded-[3rem] text-center border border-slate-100 shadow-lg">
        <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
            <i className="fas fa-building text-3xl text-indigo-600"></i>
        </div>
        <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
        <p className="text-indigo-600 font-bold text-sm mb-4"><i className="fas fa-check-circle mr-1"></i> Empresa Verificada</p>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-black uppercase">Reputação</p>
                <p className="text-xl font-black text-slate-900"><i className="fas fa-star text-amber-400 mr-1"></i> 5.0</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-black uppercase">Vagas Criadas</p>
                <p className="text-xl font-black text-slate-900">{filteredEmployerJobs.length}</p>
            </div>
        </div>
        <div className="mt-4 bg-slate-900 p-4 rounded-2xl text-white">
             <p className="text-[10px] opacity-60 font-black uppercase">Total Investido em Talentos</p>
             <p className="text-2xl font-black">R$ 4.250,00</p>
        </div>
    </div>
  </div>
);
