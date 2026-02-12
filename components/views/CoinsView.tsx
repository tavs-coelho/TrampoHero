import React from 'react';
import { UserProfile } from '../../types';
import { COIN_TO_CURRENCY_RATE, COINS_REDEMPTION_THRESHOLD, STREAK_BONUS_THRESHOLD } from '../../data/constants';

interface CoinsViewProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setView: (v: 'wallet') => void;
}

export const CoinsView: React.FC<CoinsViewProps> = ({ user, setUser, showToast, setView }) => (
  user.trampoCoins ? (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">TrampoCoins</h2>
          <p className="text-slate-500 text-sm">Sistema de fidelidade e recompensas</p>
        </div>
        <button onClick={() => setView('wallet')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
      </header>

      {/* Saldo de Coins */}
      <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full"></div>
        <div className="flex items-center gap-3 mb-4">
          <i className="fas fa-coins text-4xl"></i>
          <div>
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Seu Saldo</p>
            <h3 className="text-5xl font-black tracking-tighter">{user.trampoCoins.balance}</h3>
            <p className="text-xs opacity-70 mt-1">TrampoCoins = R$ {(user.trampoCoins.balance * COIN_TO_CURRENCY_RATE).toFixed(2)}</p>
          </div>
        </div>
        
        {/* Streak Bonus */}
        <div className="mt-6 bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Streak Atual</p>
              <p className="text-2xl font-black">{user.trampoCoins.streak} dias 🔥</p>
            </div>
            {user.trampoCoins.streakBonus && (
              <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full">+50% BONUS</span>
            )}
          </div>
          <div className="mt-3 bg-white/30 h-2 rounded-full overflow-hidden">
            <div className="bg-white h-full rounded-full" style={{width: `${Math.min((user.trampoCoins.streak / STREAK_BONUS_THRESHOLD) * 100, 100)}%`}}></div>
          </div>
          <p className="text-xs mt-2 opacity-80">
            {user.trampoCoins.streak >= STREAK_BONUS_THRESHOLD 
              ? 'Bonus ativo! Continue trabalhando para manter.' 
              : `${STREAK_BONUS_THRESHOLD - user.trampoCoins.streak} dias para +50% bonus`}
          </p>
        </div>
      </div>

      {/* Como Funciona */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
          <i className="fas fa-lightbulb text-amber-500"></i> Como Ganhar Coins
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-black">1</div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">Trabalhe e Ganhe</p>
              <p className="text-xs text-slate-500">1 coin a cada R$ 10 trabalhados</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black">2</div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">Mantenha o Streak</p>
              <p className="text-xs text-slate-500">30 dias = +50% bonus em coins</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-black">3</div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">Resgate Descontos</p>
              <p className="text-xs text-slate-500">100 coins = R$ 10 de desconto</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resgatar */}
      <button 
        onClick={() => {
          if (user.trampoCoins!.balance >= COINS_REDEMPTION_THRESHOLD) {
            const redeemValue = COINS_REDEMPTION_THRESHOLD * COIN_TO_CURRENCY_RATE;
            showToast(`${COINS_REDEMPTION_THRESHOLD} TrampoCoins resgatados! R$ ${redeemValue.toFixed(2)} adicionados à carteira`, "success");
            setUser(prev => prev.trampoCoins ? {
              ...prev,
              wallet: { ...prev.wallet, balance: prev.wallet.balance + redeemValue },
              trampoCoins: { ...prev.trampoCoins, balance: prev.trampoCoins.balance - COINS_REDEMPTION_THRESHOLD }
            } : prev);
          } else {
            showToast(`Você precisa de ${COINS_REDEMPTION_THRESHOLD - user.trampoCoins!.balance} coins para resgatar`, "error");
          }
        }}
        disabled={user.trampoCoins.balance < COINS_REDEMPTION_THRESHOLD}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest ${user.trampoCoins.balance >= COINS_REDEMPTION_THRESHOLD ? 'bg-slate-900 text-white shadow-xl active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
      >
        Resgatar {COINS_REDEMPTION_THRESHOLD} Coins = R$ {(COINS_REDEMPTION_THRESHOLD * COIN_TO_CURRENCY_RATE).toFixed(0)}
      </button>
    </div>
  ) : null
);
