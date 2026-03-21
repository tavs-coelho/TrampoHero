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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Publicar Vaga</h3>
                <button onClick={onClose} className="w-7 h-7 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200 text-sm">&times;</button>
            </div>
            <div className="p-5 space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Título da vaga</label>
                    <input value={newJobData.title} onChange={e => setNewJobData({...newJobData, title: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Ex: Garçom para Jantar" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Valor (R$)</label>
                        <input type="number" value={newJobData.payment} onChange={e => setNewJobData({...newJobData, payment: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="150" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria</label>
                        <select value={newJobData.niche} onChange={e => setNewJobData({...newJobData, niche: e.target.value as Niche})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                            {Object.values(Niche).map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-medium text-slate-600">Descrição</label>
                        <button onClick={handleAutoDescription} disabled={isGeneratingDesc} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            {isGeneratingDesc ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-wand-magic-sparkles text-xs"></i>} Gerar com IA
                        </button>
                    </div>
                    <textarea value={newJobData.description} onChange={e => setNewJobData({...newJobData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" placeholder="Detalhes do serviço..."></textarea>
                </div>
                <button onClick={handleCreateJob} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">Publicar vaga</button>
            </div>
        </div>
    </div>
  );
};

export default CreateJobModal;
