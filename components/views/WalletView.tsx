import React from 'react';
import { UserProfile } from '../../types';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { LoadingButton } from '../LoadingButton';
import { Skeleton } from '../Skeleton';

interface WalletViewProps {
  user: UserProfile;
  handleWithdraw: () => void;
  handleAnticipate: () => void;
  setShowPrimeModal: (v: boolean) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isWithdrawing?: boolean;
  isAnticipating?: boolean;
}

export const WalletView: React.FC<WalletViewProps> = ({
  user,
  handleWithdraw,
  handleAnticipate,
  setShowPrimeModal,
  isLoading = false,
  error = null,
  onRetry,
  isWithdrawing = false,
  isAnticipating = false,
}) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    {error ? (
      <ErrorState message={error} onRetry={onRetry} className="py-8" />
    ) : isLoading ? (
      <>
        <Skeleton className="h-52 rounded-[4rem]" />
        <Skeleton className="h-48 rounded-[3rem]" />
        <Skeleton className="h-32 rounded-[2rem]" />
      </>
    ) : (
      <>
    <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
       <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full"></div>
       <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-2">Saldo Total</p>
       <h3 className="text-6xl font-black mb-10 tracking-tighter">R$ {user.wallet.balance.toFixed(2)}</h3>
       <div className="flex gap-4">
          <LoadingButton
            onClick={handleWithdraw}
            isLoading={isWithdrawing}
            loadingLabel="Processando..."
            variant="secondary"
            size="lg"
            className="flex-1 !bg-white !text-slate-900 hover:!bg-slate-100 !normal-case !tracking-normal !text-xs !shadow-lg"
          >
            Sacar via PIX
          </LoadingButton>
          <button onClick={() => setShowPrimeModal(true)} className={`flex-1 py-5 rounded-[2rem] font-black text-xs transition-colors ${user.isPrime ? 'bg-indigo-600/50 text-white' : 'bg-indigo-600 text-white shadow-indigo-400 shadow-lg'}`}>
            {user.isPrime ? 'Hero Prime Ativo' : 'Hero Prime'}
          </button>
       </div>
    </div>
    
    {/* HERO PAY CARD */}
    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-xl relative overflow-hidden">
       <div className="absolute top-0 right-0 p-6 opacity-10"><i className="fas fa-bolt text-8xl text-amber-400"></i></div>
       <div className="flex justify-between items-center mb-6 relative z-10">
          <div>
             <h4 className="font-black text-xl text-white italic tracking-tighter"><i className="fas fa-bolt text-amber-400 mr-2"></i>HERO PAY</h4>
             <p className="text-[10px] text-slate-300">Receba seus agendamentos agora.</p>
          </div>
          <span className={`text-[9px] font-black px-3 py-1 rounded-full ${user.isPrime ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-900'}`}>
             {user.isPrime ? 'TAXA ZERO' : 'TAXA 3% - 5%'}
          </span>
       </div>
       <div className="flex justify-between items-end relative z-10">
          <div>
             <p className="text-slate-400 text-xs mb-1 uppercase tracking-widest font-bold">Saldo Agendado</p>
             <p className="text-3xl font-black text-white">R$ {user.wallet.scheduled.toFixed(2)}</p>
          </div>
          <LoadingButton
            onClick={handleAnticipate}
            isLoading={isAnticipating}
            loadingLabel="Aguarde..."
            disabled={user.wallet.scheduled === 0}
            variant="secondary"
            size="sm"
            className={`!normal-case !tracking-normal ${
              user.wallet.scheduled === 0
                ? '!bg-slate-700 !text-slate-500'
                : '!bg-amber-400 !text-slate-900 hover:!bg-amber-300 !shadow-lg !shadow-amber-900/50'
            }`}
          >
            Antecipar
          </LoadingButton>
       </div>
    </div>

    {/* Histórico de Transações */}
    <div className="px-4">
      <h4 className="font-black text-sm text-slate-900 mb-4">Histórico Recente</h4>
      <div className="space-y-3">
        {user.wallet.transactions.length === 0 ? (
          <EmptyState
            icon="fa-receipt"
            title="Sem transações ainda"
            description="Quando você receber pagamentos ou fizer saques, o histórico aparece aqui."
            className="py-8"
          />
        ) : (
          user.wallet.transactions.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                  t.type === 'anticipation' ? 'bg-amber-500' :
                  t.type === 'job_payment' ? 'bg-emerald-500' : 
                  t.type === 'withdrawal' ? 'bg-red-500' : 'bg-slate-400'
                }`}>
                  <i className={`fas ${
                    t.type === 'anticipation' ? 'fa-bolt' :
                    t.type === 'job_payment' ? 'fa-briefcase' : 
                    t.type === 'withdrawal' ? 'fa-university' : 'fa-arrow-down'
                  }`}></i>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs">{t.description}</p>
                  <p className="text-[10px] text-slate-400">{t.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-sm ${t.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {t.amount > 0 ? '+' : ''} R$ {t.amount.toFixed(2)}
                </p>
                {t.fee !== undefined && (
                    <p className={`text-[9px] font-bold ${t.fee === 0 ? 'text-emerald-500' : 'text-amber-600'}`}>
                        Taxa: R$ {t.fee.toFixed(2)} {t.fee === 0 ? '(Prime)' : ''}
                    </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
      </>
    )}
  </div>
);
