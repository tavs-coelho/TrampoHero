import React from 'react';
import type { Transaction, UserProfile } from '../../types';

interface EmployerWalletViewProps {
  user: UserProfile;
  handleWithdraw: () => void;
  handleOpenAddBalance: () => void;
  handleShowInvoices: () => void;
}

const TRANSACTION_ICON_BY_TYPE: Record<Transaction['type'], string> = {
  deposit: 'fa-plus',
  withdrawal: 'fa-arrow-up',
  anticipation: 'fa-bolt',
  job_payment: 'fa-briefcase',
  coin_earned: 'fa-coins',
  coin_redeemed: 'fa-coins',
  loan: 'fa-hand-holding-dollar',
  loan_repayment: 'fa-receipt',
  referral_bonus: 'fa-user-plus',
  challenge_reward: 'fa-trophy',
  escrow: 'fa-lock',
  escrow_release: 'fa-lock-open',
  escrow_refund: 'fa-rotate-left',
  subscription: 'fa-crown',
  fee_charge: 'fa-percent',
  refund: 'fa-rotate-left',
  dispute_hold: 'fa-shield-halved',
  dispute_release: 'fa-shield-halved',
};

const getTransactionStyle = (amount: number, type: Transaction['type']) => {
  const isIncoming = amount > 0;
  const isOutgoing = amount < 0;

  if (isIncoming) {
    return {
      icon: TRANSACTION_ICON_BY_TYPE[type],
      iconContainer: 'bg-emerald-50 text-emerald-600',
      amountClass: 'text-emerald-600',
      signal: '+',
    };
  }

  if (isOutgoing) {
    return {
      icon: TRANSACTION_ICON_BY_TYPE[type],
      iconContainer: 'bg-rose-50 text-rose-600',
      amountClass: 'text-rose-600',
      signal: '',
    };
  }

  return {
    icon: TRANSACTION_ICON_BY_TYPE[type],
    iconContainer: 'bg-indigo-50 text-indigo-600',
    amountClass: 'text-slate-900',
    signal: '',
  };
};

export const EmployerWalletView: React.FC<EmployerWalletViewProps> = ({
  user,
  handleWithdraw,
  handleOpenAddBalance,
  handleShowInvoices,
}) => {
  const recentTransactions = user.wallet.transactions.slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Dashboard financeiro</p>
        <h2 className="text-2xl font-black text-slate-900">Carteira Corporativa</h2>
        <p className="text-sm text-slate-500">Gerencie saldo, pagamentos e comprovantes em um único painel.</p>
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-14 h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative space-y-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Saldo disponível</p>
            <h3 className="text-4xl sm:text-5xl font-black tracking-tight">R$ {user.wallet.balance.toFixed(2)}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-200 sm:max-w-md">
            <div className="rounded-xl border border-white/15 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-300">Em processamento</p>
              <p className="mt-1 text-lg font-bold text-white">R$ {user.wallet.pending.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-300">Agendado</p>
              <p className="mt-1 text-lg font-bold text-white">R$ {user.wallet.scheduled.toFixed(2)}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={handleOpenAddBalance}
              className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Adicionar Saldo
            </button>
            <button
              onClick={handleShowInvoices}
              className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
            >
              Notas Fiscais
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={handleWithdraw}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
        >
          <p className="text-xs uppercase tracking-wider text-slate-500">Ação rápida</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">Sacar saldo</p>
        </button>
        <button
          onClick={handleOpenAddBalance}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
        >
          <p className="text-xs uppercase tracking-wider text-slate-500">Ação rápida</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">Reforçar caixa</p>
        </button>
        <button
          onClick={handleShowInvoices}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
        >
          <p className="text-xs uppercase tracking-wider text-slate-500">Gestão</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">Gerar comprovantes</p>
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Histórico de pagamentos</h4>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {recentTransactions.length} itens
          </span>
        </div>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-sm font-medium text-slate-700">Sem pagamentos registrados</p>
              <p className="mt-1 text-xs text-slate-500">Os lançamentos financeiros aparecerão aqui em tempo real.</p>
            </div>
          ) : (
            recentTransactions.map(transaction => {
              const style = getTransactionStyle(transaction.amount, transaction.type);
              return (
                <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconContainer}`}>
                      <i className={`fas ${style.icon}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{transaction.description}</p>
                      <p className="truncate text-xs text-slate-500">{transaction.date}</p>
                    </div>
                  </div>
                  <p className={`shrink-0 text-sm font-bold ${style.amountClass}`}>
                    {style.signal} R$ {transaction.amount.toFixed(2)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
