import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../../types';
import { apiService } from '../../services/apiService';

interface AdminViewProps {
  user: UserProfile;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type AdminTab = 'stats' | 'users' | 'jobs' | 'kyc';

interface PlatformStats {
  users: { total: number; freelancers: number; employers: number };
  jobs: { total: number; open: number; completed: number };
  kyc: { pendingReview: number };
  revenue: { total: number };
  recentTransactions: { _id: string; type: string; amount: number; description: string }[];
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  tier: string;
  isPrime: boolean;
  rating: number;
  'kyc': { status: string };
  createdAt: string;
}

interface AdminJob {
  _id: string;
  title: string;
  employer: string;
  niche: string;
  payment: number;
  status: string;
  location: string;
  date: string;
}

interface KycEntry {
  _id: string;
  name: string;
  email: string;
  kyc: {
    status: string;
    documentFrontUrl: string | null;
    documentBackUrl: string | null;
    selfieUrl: string | null;
    submittedAt: string | null;
  };
}

export const AdminView: React.FC<AdminViewProps> = ({ user, showToast }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [kycList, setKycList] = useState<KycEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    const result = await apiService.adminGetStats();
    if (result.success && result.data) {
      setStats(result.data as PlatformStats);
    } else {
      showToast('Erro ao carregar estatísticas', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  const fetchUsers = useCallback(async (search?: string) => {
    setIsLoading(true);
    const result = await apiService.adminGetUsers(search);
    if (result.success && result.data) {
      setUsers(result.data as AdminUser[]);
    } else {
      showToast('Erro ao carregar usuários', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    const result = await apiService.adminGetJobs();
    if (result.success && result.data) {
      setJobs(result.data as AdminJob[]);
    } else {
      showToast('Erro ao carregar vagas', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  const fetchKyc = useCallback(async () => {
    setIsLoading(true);
    const result = await apiService.adminGetKyc('pending');
    if (result.success && result.data) {
      setKycList(result.data as KycEntry[]);
    } else {
      showToast('Erro ao carregar KYC', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'jobs') fetchJobs();
    else if (activeTab === 'kyc') fetchKyc();
  }, [activeTab, fetchStats, fetchUsers, fetchJobs, fetchKyc]);

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Remover esta vaga permanentemente?')) return;
    const result = await apiService.adminDeleteJob(jobId);
    if (result.success) {
      showToast('Vaga removida', 'success');
      setJobs(prev => prev.filter(j => j._id !== jobId));
    } else {
      showToast('Erro ao remover vaga', 'error');
    }
  };

  const handleKycDecision = async (userId: string, decision: 'approved' | 'rejected', reason?: string) => {
    const result = await apiService.adminDecideKyc(userId, decision, reason);
    if (result.success) {
      showToast(`KYC ${decision === 'approved' ? 'aprovado' : 'rejeitado'}`, 'success');
      setKycList(prev => prev.filter(k => k._id !== userId));
    } else {
      showToast('Erro ao processar KYC', 'error');
    }
  };

  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <i className="fas fa-lock text-4xl mb-4"></i>
        <p className="font-bold">Acesso restrito a administradores</p>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'stats', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'users', label: 'Usuários', icon: 'fa-users' },
    { id: 'jobs', label: 'Vagas', icon: 'fa-briefcase' },
    { id: 'kyc', label: 'KYC', icon: 'fa-id-card' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl font-black text-slate-900">Painel Admin</h2>
        <p className="text-slate-500 text-sm">Gestão da plataforma TrampoHero</p>
      </header>

      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <i className="fas fa-spinner fa-spin text-2xl text-slate-400"></i>
        </div>
      )}

      {/* Dashboard Stats */}
      {!isLoading && activeTab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 font-bold mb-1">Total Usuários</p>
              <p className="text-3xl font-black text-indigo-600">{stats.users.total}</p>
              <p className="text-xs text-slate-400 mt-1">
                {stats.users.freelancers} freelancers · {stats.users.employers} empregadores
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 font-bold mb-1">Vagas</p>
              <p className="text-3xl font-black text-emerald-600">{stats.jobs.total}</p>
              <p className="text-xs text-slate-400 mt-1">
                {stats.jobs.open} abertas · {stats.jobs.completed} completas
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 font-bold mb-1">KYC Pendente</p>
              <p className="text-3xl font-black text-amber-600">{stats.kyc.pendingReview}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 font-bold mb-1">Receita Total</p>
              <p className="text-3xl font-black text-purple-600">
                R$ {stats.revenue.total.toFixed(2)}
              </p>
            </div>
          </div>

          {stats.recentTransactions.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100">
              <h3 className="font-black text-slate-900 mb-3">Transações Recentes</h3>
              <div className="space-y-2">
                {stats.recentTransactions.map(tx => (
                  <div key={tx._id} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 truncate max-w-[60%]">{tx.description}</span>
                    <span className="font-bold text-emerald-600">R$ {tx.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Management */}
      {!isLoading && activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm"
            />
            <button
              onClick={() => fetchUsers(userSearch)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
            >
              Buscar
            </button>
          </div>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u._id} className="bg-white p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">{u.role}</span>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{u.tier}</span>
                      {u.isPrime && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">Prime</span>
                      )}
                      {u.kyc?.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.kyc.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                          u.kyc.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          KYC: {u.kyc.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">⭐ {u.rating != null ? u.rating.toFixed(1) : '—'}</span>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-center text-slate-400 py-8">Nenhum usuário encontrado</p>
            )}
          </div>
        </div>
      )}

      {/* Jobs Management */}
      {!isLoading && activeTab === 'jobs' && (
        <div className="space-y-2">
          {jobs.map(job => (
            <div key={job._id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{job.title}</p>
                  <p className="text-xs text-slate-500">{job.employer} · {job.location}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">{job.niche}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      job.status === 'open' ? 'bg-emerald-50 text-emerald-700' :
                      job.status === 'completed' ? 'bg-indigo-50 text-indigo-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">R$ {job.payment}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteJob(job._id)}
                  className="ml-2 w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                  title="Remover vaga"
                  aria-label="Remover vaga"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="text-center text-slate-400 py-8">Nenhuma vaga encontrada</p>
          )}
        </div>
      )}

      {/* KYC Management */}
      {!isLoading && activeTab === 'kyc' && (
        <div className="space-y-3">
          {kycList.map(entry => (
            <div key={entry._id} className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3">
              <div>
                <p className="font-bold text-slate-900">{entry.name}</p>
                <p className="text-xs text-slate-500">{entry.email}</p>
                {entry.kyc.submittedAt && (
                  <p className="text-xs text-slate-400 mt-1">
                    Enviado em: {new Date(entry.kyc.submittedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {entry.kyc.documentFrontUrl && (
                  <a href={entry.kyc.documentFrontUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 underline">
                    Frente do doc
                  </a>
                )}
                {entry.kyc.documentBackUrl && (
                  <a href={entry.kyc.documentBackUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 underline">
                    Verso do doc
                  </a>
                )}
                {entry.kyc.selfieUrl && (
                  <a href={entry.kyc.selfieUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 underline">
                    Selfie
                  </a>
                )}
              </div>
              <textarea
                value={rejectionReason[entry._id] ?? ''}
                onChange={e => setRejectionReason(prev => ({ ...prev, [entry._id]: e.target.value }))}
                placeholder="Motivo da rejeição (obrigatório ao rejeitar)..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleKycDecision(entry._id, 'approved')}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  Aprovar
                </button>
                <button
                  onClick={() => {
                    const reason = rejectionReason[entry._id]?.trim();
                    if (!reason) {
                      showToast('Informe o motivo da rejeição', 'error');
                      return;
                    }
                    handleKycDecision(entry._id, 'rejected', reason);
                  }}
                  className="flex-1 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors"
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
          {kycList.length === 0 && (
            <div className="text-center py-10">
              <i className="fas fa-check-circle text-3xl text-emerald-400 mb-3"></i>
              <p className="text-slate-400 font-medium">Nenhum KYC pendente</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
