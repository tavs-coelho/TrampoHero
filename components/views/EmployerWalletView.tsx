import React from 'react';
import { UserProfile } from '../../types';

interface EmployerWalletViewProps {
  user: UserProfile;
  handleWithdraw: () => void;
  handleOpenAddBalance: () => void;
  handleShowInvoices: () => void;
}

export const EmployerWalletView: React.FC<EmployerWalletViewProps> = ({ user, handleWithdraw, handleOpenAddBalance, handleShowInvoices }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
     <header className="mb-2">
        <h2 className="text-2xl font-black text-slate-900">Carteira Corporativa</h2>
     </header>
     <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10"><i className="fas fa-building-columns text-9xl"></i></div>
         <p className="text-[10px] font-bold opacity-60 uppercase mb-2 tracking-widest">Saldo Disponível para Contratação</p>
         <h2 className="text-5xl font-black mb-8 tracking-tighter">R$ {user.wallet.balance.toFixed(2)}</h2>
         <div className="flex gap-3 relative z-10">
             <button onClick={handleOpenAddBalance} className="flex-1 bg-white text-slate-900 py-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-slate-100 active:scale-95 transition-all">Adicionar Saldo</button>
             <button onClick={handleShowInvoices} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">Notas Fiscais</button>
         </div>
     </div>

     <div className="px-2">
         <h4 className="font-black text-slate-900 text-sm mb-4 uppercase tracking-widest opacity-40">Histórico de Pagamentos</h4>
         <div className="space-y-3">
             <div className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><i className="fas fa-arrow-up"></i></div>
                     <div>
                         <p className="font-bold text-slate-800 text-sm">Pgto. Mariana Costa</p>
                         <p className="text-[10px] text-slate-400">Ontem às 18:30</p>
                     </div>
                 </div>
                 <p className="font-black text-slate-900">- R$ 180,00</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><i className="fas fa-plus"></i></div>
                     <div>
                         <p className="font-bold text-slate-800 text-sm">Recarga via PIX</p>
                         <p className="text-[10px] text-slate-400">20/10/2023</p>
                     </div>
                 </div>
                 <p className="font-black text-emerald-600">+ R$ 5.000,00</p>
             </div>
         </div>
     </div>
  </div>
);
