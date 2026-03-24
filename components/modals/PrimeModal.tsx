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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-indigo-600 p-6 text-center text-white relative">
                <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors text-sm">&times;</button>
                <div className="w-12 h-12 bg-white/20 rounded-xl mx-auto mb-3 flex items-center justify-center">
                    <i className="fas fa-crown text-xl text-amber-300"></i>
                </div>
                <h2 className="text-xl font-bold">Hero Prime</h2>
                <p className="text-indigo-200 text-sm mt-1">Maximize seus ganhos</p>
            </div>

            <div className="p-5 space-y-3 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 text-sm"><i className="fas fa-money-bill-transfer"></i></div>
                    <div>
                        <p className="text-sm font-medium text-slate-900">Taxa zero em saques</p>
                        <p className="text-xs text-slate-500">Economize R$ 2,50 por saque PIX</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 text-sm"><i className="fas fa-shield-halved"></i></div>
                    <div>
                        <p className="text-sm font-medium text-slate-900">Seguro de acidentes</p>
                        <p className="text-xs text-slate-500">Cobertura de até R$ 20.000</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0 text-sm"><i className="fas fa-bolt"></i></div>
                    <div>
                        <p className="text-sm font-medium text-slate-900">Vagas VIP</p>
                        <p className="text-xs text-slate-500">Acesso a vagas de alto valor (+R$ 200)</p>
                    </div>
                </div>
            </div>

            <div className="px-5 pb-5">
                {user.isPrime ? (
                    <button onClick={handleUnsubscribePrime} className="w-full py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                        Cancelar assinatura
                    </button>
                ) : (
                    <button onClick={handleSubscribePrime} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                        Assinar por R$ 29,90/mês
                    </button>
                )}
                <p className="text-center text-xs text-slate-400 mt-2">Cancele quando quiser. Termos aplicáveis.</p>
            </div>
        </div>
    </div>
  );
};

export default PrimeModal;
