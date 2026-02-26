import React from 'react';
import { Niche } from '../../types';

export interface CreateJobModalProps {
  newJobData: { title: string; payment: string; niche: Niche; date: string; startTime: string; description: string };
  setNewJobData: React.Dispatch<React.SetStateAction<{ title: string; payment: string; niche: Niche; date: string; startTime: string; description: string }>>;
  isGeneratingDesc: boolean;
  handleAutoDescription: () => void;
  handleCreateJob: () => void;
  onClose: () => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  newJobData,
  setNewJobData,
  isGeneratingDesc,
  handleAutoDescription,
  handleCreateJob,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900">Publicar Vaga</h3>
                <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100">&times;</button>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Título</label>
                    <input value={newJobData.title} onChange={e => setNewJobData({...newJobData, title: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-900 focus:outline-indigo-500" placeholder="Ex: Garçom para Jantar" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Valor (R$)</label>
                        <input type="number" value={newJobData.payment} onChange={e => setNewJobData({...newJobData, payment: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-900 focus:outline-indigo-500" placeholder="150" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nicho</label>
                        <select value={newJobData.niche} onChange={e => setNewJobData({...newJobData, niche: e.target.value as Niche})} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-900 focus:outline-indigo-500">
                            {Object.values(Niche).map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400">Descrição</label>
                        <button onClick={handleAutoDescription} disabled={isGeneratingDesc} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            {isGeneratingDesc ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>} Gerar com IA
                        </button>
                    </div>
                    <textarea value={newJobData.description} onChange={e => setNewJobData({...newJobData, description: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-medium text-sm text-slate-700 h-24 focus:outline-indigo-500" placeholder="Detalhes do serviço..."></textarea>
                </div>
                <button onClick={handleCreateJob} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Publicar Agora</button>
            </div>
        </div>
    </div>
  );
};

export default CreateJobModal;
