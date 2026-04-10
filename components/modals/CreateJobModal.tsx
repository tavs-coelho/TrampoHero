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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Publicar Vaga</h3>
                <button onClick={onClose} className="btn-ghost btn-sm h-8 w-8 px-0 text-sm" aria-label="Fechar modal">&times;</button>
            </div>
            <div className="p-5 space-y-4">
                <div>
                    <label className="field-label">Título da vaga</label>
                    <input value={newJobData.title} onChange={e => setNewJobData({...newJobData, title: e.target.value})} className="input-base" placeholder="Ex: Garçom para Jantar" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="field-label">Valor (R$)</label>
                        <input type="number" value={newJobData.payment} onChange={e => setNewJobData({...newJobData, payment: e.target.value})} className="input-base" placeholder="150" />
                    </div>
                    <div>
                        <label className="field-label">Categoria</label>
                        <select value={newJobData.niche} onChange={e => setNewJobData({...newJobData, niche: e.target.value as Niche})} className="input-base">
                            {Object.values(Niche).map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="field-label mb-0">Descrição</label>
                        <button onClick={handleAutoDescription} disabled={isGeneratingDesc} className="btn-ghost btn-sm h-auto border-0 p-0 text-brand-600 hover:bg-transparent hover:text-brand-700 disabled:text-slate-400">
                            {isGeneratingDesc ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-wand-magic-sparkles text-xs"></i>} Gerar com IA
                        </button>
                    </div>
                    <textarea value={newJobData.description} onChange={e => setNewJobData({...newJobData, description: e.target.value})} className="input-base h-24 resize-none text-slate-700" placeholder="Detalhes do serviço..."></textarea>
                </div>
                <button onClick={handleCreateJob} className="btn-primary btn-lg">Publicar vaga</button>
            </div>
        </div>
    </div>
  );
};

export default CreateJobModal;
