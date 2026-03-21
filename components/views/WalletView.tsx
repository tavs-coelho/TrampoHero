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
  <div className="space-y-5">
    <h1 className="text-xl font-bold text-slate-900">Carteira</h1>
    {error ? (
      <ErrorState message={error} onRetry={onRetry} className="py-8" />
    ) : isLoading ? (
      <>
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </>
    ) : (
      <>
        {/* Saldo principal */}
        <div className="bg-slate-900 p-6 rounded-xl text-white">
          <p className="text-xs text-slate-400 mb-1">Saldo disponível</p>
          <p className="text-4xl font-bold mb-5">R$ {user.wallet.balance.toFixed(2)}</p>
          <div className="flex gap-3">
            <LoadingButton
              onClick={handleWithdraw}
              isLoading={isWithdrawing}
              loadingLabel="Processando..."
              variant="secondary"
              size="md"
              className="flex-1 !bg-white !text-slate-900 hover:!bg-slate-100 !rounded-lg !text-sm !font-medium !normal-case !tracking-normal"
            >
              Sacar via PIX
            </LoadingButton>
            <button
              onClick={() => setShowPrimeModal(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                user.isPrime
                  ? 'bg-indigo-500/40 text-white'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {user.isPrime ? 'Prime ativo' : 'Hero Prime'}
            </button>
          </div>
        </div>

        {/* Saldo agendado */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Saldo agendado</p>
              <p className="text-2xl font-bold text-slate-900">R$ {user.wallet.scheduled.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                user.isPrime ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {user.isPrime ? 'Taxa zero' : 'Taxa 3%–5%'}
              </span>
            </div>
          </div>
          <LoadingButton
            onClick={handleAnticipate}
            isLoading={isAnticipating}
            loadingLabel="Aguarde..."
            disabled={user.wallet.scheduled === 0}
            variant="secondary"
            size="md"
            className={`w-full !rounded-lg !text-sm !font-medium !normal-case !tracking-normal ${
              user.wallet.scheduled === 0
                ? '!bg-slate-100 !text-slate-400'
                : '!bg-amber-400 !text-slate-900 hover:!bg-amber-300'
            }`}
          >
            Antecipar recebimento
          </LoadingButton>
        </div>

        {/* Histórico de Transações */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Histórico recente</h2>
          <div className="space-y-2">
            {user.wallet.transactions.length === 0 ? (
              <EmptyState
                icon="fa-receipt"
                title="Sem transações ainda"
                description="Quando você receber pagamentos ou fizer saques, o histórico aparece aqui."
                className="py-8"
              />
            ) : (
              user.wallet.transactions.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0 ${
                      t.type === 'anticipation' ? 'bg-amber-500' :
                      t.type === 'job_payment' ? 'bg-emerald-500' :
                      t.type === 'withdrawal' ? 'bg-red-500' : 'bg-slate-400'
                    }`}>
                      <i className={`fas text-sm ${
                        t.type === 'anticipation' ? 'fa-bolt' :
                        t.type === 'job_payment' ? 'fa-briefcase' :
                        t.type === 'withdrawal' ? 'fa-university' : 'fa-arrow-down'
                      }`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{t.description}</p>
                      <p className="text-xs text-slate-400">{t.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${t.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {t.amount > 0 ? '+' : ''} R$ {t.amount.toFixed(2)}
                    </p>
                    {t.fee !== undefined && (
                      <p className={`text-xs ${t.fee === 0 ? 'text-emerald-500' : 'text-amber-600'}`}>
                        Taxa: R$ {t.fee.toFixed(2)}{t.fee === 0 ? ' (Prime)' : ''}
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
