import React from 'react';
import { TOP_TALENTS } from '../../data/mockData';

interface TalentsViewProps {
  handleInviteTalent: (name: string, id?: string) => void;
  setView: (v: 'dashboard') => void;
}

export const TalentsView: React.FC<TalentsViewProps> = ({ handleInviteTalent, setView }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex items-center gap-4 mb-2">
        <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><i className="fas fa-arrow-left"></i></button>
        <h2 className="text-2xl font-black text-slate-900">Talentos Disponíveis</h2>
    </div>
    <div className="grid grid-cols-2 gap-4">
        {TOP_TALENTS.map(talent => (
            <div key={talent.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full mb-3 flex items-center justify-center font-black text-slate-500 text-lg">
                    {talent.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{talent.name}</h4>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold mb-2 uppercase">{talent.niche}</span>
                <div className="flex items-center gap-1 mb-4">
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <span className="text-xs font-bold text-slate-700">{talent.rating}</span>
                </div>
                <button onClick={() => handleInviteTalent(talent.name, talent.id)} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Convidar</button>
            </div>
        ))}
    </div>
  </div>
);
