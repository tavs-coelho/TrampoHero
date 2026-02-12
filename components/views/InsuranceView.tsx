import React from 'react';
import { UserProfile } from '../../types';
import { INSURANCE_PLANS } from '../../data/mockData';

interface InsuranceViewProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setView: (v: 'wallet') => void;
}

export const InsuranceView: React.FC<InsuranceViewProps> = ({ user, setUser, showToast, setView }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <header className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-black text-slate-900">TrampoProtect</h2>
        <p className="text-slate-500 text-sm">Seguro para freelancers</p>
      </div>
      <button onClick={() => setView('wallet')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
    </header>

    {/* Status do Seguro */}
    {user.insurance ? (
      <div className="bg-emerald-50 p-6 rounded-[2.5rem] border-2 border-emerald-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
            <i className="fas fa-shield-check text-white text-xl"></i>
          </div>
          <div>
            <h3 className="font-black text-emerald-900">Protegido</h3>
            <p className="text-sm text-emerald-700">Plano ativo até {user.insurance.nextBillingDate}</p>
          </div>
        </div>
        <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm">Gerenciar Plano</button>
      </div>
    ) : (
      <>
        {/* Plano Freelancer */}
        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-indigo-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-xl text-slate-900">Plano Freelancer</h3>
            <span className="text-2xl font-black text-indigo-600">R$ 19,90<span className="text-sm text-slate-400">/mês</span></span>
          </div>
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <i className="fas fa-check-circle text-emerald-500"></i>
              <span>Acidentes de trabalho até R$ 10.000</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <i className="fas fa-check-circle text-emerald-500"></i>
              <span>Furto de equipamentos até R$ 3.000</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <i className="fas fa-check-circle text-emerald-500"></i>
              <span>Responsabilidade civil até R$ 5.000</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <i className="fas fa-check-circle text-emerald-500"></i>
              <span>Auxílio-doença R$ 50/dia</span>
            </div>
          </div>
          <button 
            onClick={() => {
              showToast("Seguro TrampoProtect contratado com sucesso!", "success");
              setUser(prev => ({
                ...prev,
                insurance: {
                  type: 'freelancer',
                  plan: INSURANCE_PLANS.freelancer,
                  startDate: new Date().toISOString(),
                  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  isActive: true,
                  claims: []
                }
              }));
            }}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95"
          >
            Contratar Agora
          </button>
        </div>
      </>
    )}
  </div>
);
