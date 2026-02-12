import React from 'react';
import { UserProfile } from '../../types';

export interface PrimeModalProps {
  user: UserProfile;
  handleSubscribePrime: () => void;
  handleUnsubscribePrime: () => void;
  onClose: () => void;
}

const PrimeModal: React.FC<PrimeModalProps> = ({
  user,
  handleSubscribePrime,
  handleUnsubscribePrime,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-indigo-900/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
            <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">&times;</button>
            
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-amber-400 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-amber-200">
                    <i className="fas fa-crown text-4xl text-white"></i>
                </div>
                <h2 className="text-2xl font-black text-slate-900">Hero Prime</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Acelere seus Ganhos</p>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0"><i className="fas fa-money-bill-transfer"></i></div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">Taxa Zero em Saques</h4>
                        <p className="text-[10px] text-slate-500">Economize R$ 2,50 a cada saque PIX.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><i className="fas fa-shield-halved"></i></div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">Seguro Acidentes</h4>
                        <p className="text-[10px] text-slate-500">Cobertura de até R$ 20.000 em jobs.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0"><i className="fas fa-bolt"></i></div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">Vagas VIP</h4>
                        <p className="text-[10px] text-slate-500">Acesso a vagas de alto valor (+R$ 200).</p>
                    </div>
                </div>
            </div>

            {user.isPrime ? (
                <button onClick={handleUnsubscribePrime} className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-100 transition-colors">
                    Cancelar Assinatura
                </button>
            ) : (
                <button onClick={handleSubscribePrime} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 active:scale-95 transition-all">
                    Assinar por R$ 29,90/mês
                </button>
            )}
            
            <p className="text-center text-[9px] text-slate-400 mt-4 font-bold opacity-60">Cancele quando quiser. Termos aplicáveis.</p>
        </div>
    </div>
  );
};

export default PrimeModal;
