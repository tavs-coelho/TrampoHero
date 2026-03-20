import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../../types';
import { apiService } from '../../services/apiService';

interface AdminViewProps {
  user: UserProfile;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type AdminTab = 'stats' | 'users' | 'jobs' | 'applications' | 'contracts' | 'transactions' | 'tickets' | 'kyc' | 'audit';

interface PlatformStats {
  users: { total: number; freelancers: number; employers: number };
  jobs: { total: number; open: number; completed: number };
  kyc: { pendingReview: number };
  tickets: { open: number };
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
  isBanned: boolean;
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

interface AdminApplication {
  _id: string;
  jobId: { _id: string; title: string; niche: string; payment: number; status: string } | null;
  freelancerId: { _id: string; name: string; email: string; rating: number } | null;
  status: string;
  coverMessage: string;
  proposedRate: number | null;
  createdAt: string;
}

interface AdminContract {
  _id: string;
  jobId: { _id: string; title: string; niche: string } | null;
  freelancerId: { _id: string; name: string; email: string } | null;
  employerId: { _id: string; name: string; email: string } | null;
  status: string;
  value: number;
  paymentType: string;
  jobDate: string;
  pdfUrl: string;
  createdAt: string;
}

interface AdminTransaction {
  _id: string;
  userId: { _id: string; name: string; email: string; role: string } | null;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface AdminTicket {
  _id: string;
  userId: { _id: string; name: string; email: string; role: string } | null;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedAdminId: { _id: string; name: string; email: string } | null;
  messages: { _id: string; authorId: string; authorRole: string; message: string; createdAt: string }[];
  createdAt: string;
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

interface AuditEntry {
  _id: string;
  adminId: { _id: string; name: string; email: string } | null;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-700',
  in_progress: 'bg-blue-50 text-blue-700',
  waiting_user: 'bg-amber-50 text-amber-700',
  resolved: 'bg-indigo-50 text-indigo-700',
  closed: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  generated: 'bg-slate-100 text-slate-600',
  signed_both: 'bg-emerald-50 text-emerald-700',
  disputed: 'bg-red-50 text-red-700',
  voided: 'bg-slate-100 text-slate-400',
  completed: 'bg-indigo-50 text-indigo-700',
  paid: 'bg-indigo-50 text-indigo-700',
  cancelled: 'bg-red-50 text-red-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const AdminView: React.FC<AdminViewProps> = ({ user, showToast }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [kycList, setKycList] = useState<KycEntry[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
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

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    const result = await apiService.adminGetApplications();
    if (result.success && result.data) {
      setApplications(result.data as AdminApplication[]);
    } else {
      showToast('Erro ao carregar candidaturas', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    const result = await apiService.adminGetContracts();
    if (result.success && result.data) {
      setContracts(result.data as AdminContract[]);
    } else {
      showToast('Erro ao carregar contratos', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    const result = await apiService.adminGetTransactions();
    if (result.success && result.data) {
      setTransactions(result.data as AdminTransaction[]);
    } else {
      showToast('Erro ao carregar transações', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    const result = await apiService.adminGetTickets();
    if (result.success && result.data) {
      setTickets(result.data as AdminTicket[]);
    } else {
      showToast('Erro ao carregar tickets', 'error');
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

  const fetchAuditLog = useCallback(async () => {
    setIsLoading(true);
    const result = await apiService.adminGetAuditLog();
    if (result.success && result.data) {
      setAuditLog(result.data as AuditEntry[]);
    } else {
      showToast('Erro ao carregar auditoria', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'jobs') fetchJobs();
    else if (activeTab === 'applications') fetchApplications();
    else if (activeTab === 'contracts') fetchContracts();
    else if (activeTab === 'transactions') fetchTransactions();
    else if (activeTab === 'tickets') { fetchTickets(); setSelectedTicket(null); }
    else if (activeTab === 'kyc') fetchKyc();
    else if (activeTab === 'audit') fetchAuditLog();
  }, [activeTab, fetchStats, fetchUsers, fetchJobs, fetchApplications, fetchContracts, fetchTransactions, fetchTickets, fetchKyc, fetchAuditLog]);

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

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    if (!window.confirm(isBanned ? 'Desbloquear este usuário?' : 'Bloquear este usuário?')) return;
    const result = isBanned
      ? await apiService.adminUnbanUser(userId)
      : await apiService.adminBanUser(userId);
    if (result.success) {
      showToast(isBanned ? 'Usuário desbloqueado' : 'Usuário bloqueado', 'success');
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: !isBanned } : u));
    } else {
      showToast('Erro ao atualizar usuário', 'error');
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

  const handleOpenTicket = async (ticket: AdminTicket) => {
    const result = await apiService.adminGetTicket(ticket._id);
    if (result.success && result.data) {
      setSelectedTicket(result.data as AdminTicket);
    } else {
      setSelectedTicket(ticket);
    }
  };

  const handleTicketStatus = async (ticketId: string, status: string) => {
    const result = await apiService.adminUpdateTicket(ticketId, { status });
    if (result.success && result.data) {
      const updated = result.data as AdminTicket;
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: updated.status } : t));
      if (selectedTicket?._id === ticketId) setSelectedTicket(updated);
      showToast('Ticket atualizado', 'success');
    } else {
      showToast('Erro ao atualizar ticket', 'error');
    }
  };

  const handleTicketReply = async (ticketId: string) => {
    const msg = ticketReply.trim();
    if (!msg) {
      showToast('Informe uma mensagem', 'error');
      return;
    }
    const result = await apiService.adminReplyTicket(ticketId, msg);
    if (result.success && result.data) {
      setSelectedTicket(result.data as AdminTicket);
      setTicketReply('');
      showToast('Resposta enviada', 'success');
    } else {
      showToast('Erro ao enviar resposta', 'error');
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
    { id: 'applications', label: 'Candidaturas', icon: 'fa-file-alt' },
    { id: 'contracts', label: 'Contratos', icon: 'fa-file-contract' },
    { id: 'transactions', label: 'Pagamentos', icon: 'fa-coins' },
    { id: 'tickets', label: 'Suporte', icon: 'fa-headset' },
    { id: 'kyc', label: 'KYC', icon: 'fa-id-card' },
    { id: 'audit', label: 'Auditoria', icon: 'fa-shield-alt' },
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
            <div className="bg-white p-5 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 font-bold mb-1">Tickets Abertos</p>
              <p className="text-3xl font-black text-rose-600">{stats.tickets?.open ?? 0}</p>
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
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">{u.role}</span>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{u.tier}</span>
                      {u.isPrime && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">Prime</span>
                      )}
                      {u.isBanned && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Banido</span>
                      )}
                      {u.kyc?.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          STATUS_COLORS[u.kyc.status] ?? 'bg-slate-100 text-slate-600'
                        }`}>
                          KYC: {u.kyc.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-slate-400">⭐ {u.rating != null ? u.rating.toFixed(1) : '—'}</span>
                    <button
                      onClick={() => handleBanUser(u._id, u.isBanned)}
                      className={`text-xs px-3 py-1 rounded-xl font-bold transition-colors ${
                        u.isBanned
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {u.isBanned ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </div>
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
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">{job.niche}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[job.status] ?? 'bg-slate-100'}`}>
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

      {/* Applications */}
      {!isLoading && activeTab === 'applications' && (
        <div className="space-y-2">
          {applications.map(app => (
            <div key={app._id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">
                    {app.freelancerId?.name ?? '—'} → {app.jobId?.title ?? '—'}
                  </p>
                  <p className="text-xs text-slate-500">{app.freelancerId?.email}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[app.status] ?? 'bg-slate-100'}`}>
                      {app.status}
                    </span>
                    {app.jobId?.niche && (
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">{app.jobId.niche}</span>
                    )}
                    {app.proposedRate != null && (
                      <span className="text-xs font-bold text-emerald-600">R$ {app.proposedRate}</span>
                    )}
                  </div>
                  {app.coverMessage && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{app.coverMessage}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">
                  {new Date(app.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
          {applications.length === 0 && (
            <p className="text-center text-slate-400 py-8">Nenhuma candidatura encontrada</p>
          )}
        </div>
      )}

      {/* Contracts */}
      {!isLoading && activeTab === 'contracts' && (
        <div className="space-y-2">
          {contracts.map(c => (
            <div key={c._id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{c.jobId?.title ?? '—'}</p>
                  <p className="text-xs text-slate-500">
                    Freelancer: {c.freelancerId?.name ?? '—'} · Empregador: {c.employerId?.name ?? '—'}
                  </p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] ?? 'bg-slate-100'}`}>
                      {c.status}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">R$ {c.value}</span>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">{c.paymentType}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Data: {c.jobDate}</p>
                </div>
                <a
                  href={c.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs text-indigo-600 underline whitespace-nowrap"
                >
                  Ver PDF
                </a>
              </div>
            </div>
          ))}
          {contracts.length === 0 && (
            <p className="text-center text-slate-400 py-8">Nenhum contrato encontrado</p>
          )}
        </div>
      )}

      {/* Transactions */}
      {!isLoading && activeTab === 'transactions' && (
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx._id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{tx.description}</p>
                  <p className="text-xs text-slate-500">
                    {tx.userId?.name ?? '—'} · {tx.type}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(tx.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`font-black text-lg ml-2 ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.amount >= 0 ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-center text-slate-400 py-8">Nenhuma transação encontrada</p>
          )}
        </div>
      )}

      {/* Support Tickets */}
      {!isLoading && activeTab === 'tickets' && !selectedTicket && (
        <div className="space-y-2">
          {tickets.map(ticket => (
            <button
              key={ticket._id}
              type="button"
              className="w-full bg-white p-4 rounded-2xl border border-slate-100 cursor-pointer hover:border-indigo-200 transition-colors text-left"
              onClick={() => handleOpenTicket(ticket)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{ticket.subject}</p>
                  <p className="text-xs text-slate-500">{ticket.userId?.name ?? '—'} · {ticket.category}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ticket.status] ?? 'bg-slate-100'}`}>
                      {ticket.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[ticket.priority] ?? 'bg-slate-100'}`}>
                      {ticket.priority}
                    </span>
                    {ticket.assignedAdminId && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                        Atribuído: {ticket.assignedAdminId.name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">
                  {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </button>
          ))}
          {tickets.length === 0 && (
            <div className="text-center py-10">
              <i className="fas fa-check-circle text-3xl text-emerald-400 mb-3"></i>
              <p className="text-slate-400 font-medium">Nenhum ticket encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* Ticket Detail */}
      {!isLoading && activeTab === 'tickets' && selectedTicket && (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedTicket(null)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <i className="fas fa-arrow-left"></i> Voltar aos tickets
          </button>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-slate-900">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-500">{selectedTicket.userId?.name} · {selectedTicket.userId?.email}</p>
              </div>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedTicket.status] ?? 'bg-slate-100'}`}>
                  {selectedTicket.status}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[selectedTicket.priority] ?? 'bg-slate-100'}`}>
                  {selectedTicket.priority}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-700">{selectedTicket.description}</p>

            {/* Status controls */}
            <div className="flex gap-2 flex-wrap">
              {['in_progress', 'waiting_user', 'resolved', 'closed'].map(s => (
                <button
                  key={s}
                  onClick={() => handleTicketStatus(selectedTicket._id, s)}
                  disabled={selectedTicket.status === s}
                  className={`text-xs px-3 py-1 rounded-xl font-bold transition-colors ${
                    selectedTicket.status === s
                      ? 'bg-slate-200 text-slate-400 cursor-default'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Message thread */}
          <div className="space-y-3">
            {selectedTicket.messages.map(msg => (
              <div
                key={msg._id}
                className={`p-3 rounded-2xl text-sm ${
                  msg.authorRole === 'admin'
                    ? 'bg-indigo-50 text-indigo-900 ml-6'
                    : 'bg-slate-100 text-slate-800 mr-6'
                }`}
              >
                <p className="font-bold text-xs mb-1">
                  {msg.authorRole === 'admin' ? 'Admin' : 'Usuário'} ·{' '}
                  {new Date(msg.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p>{msg.message}</p>
              </div>
            ))}
          </div>

          {/* Reply box */}
          {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
            <div className="space-y-2">
              <textarea
                value={ticketReply}
                onChange={e => setTicketReply(e.target.value)}
                placeholder="Responder ao ticket..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none"
                rows={3}
              />
              <button
                onClick={() => handleTicketReply(selectedTicket._id)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                Enviar Resposta
              </button>
            </div>
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

      {/* Audit Log */}
      {!isLoading && activeTab === 'audit' && (
        <div className="space-y-2">
          {auditLog.map(entry => (
            <div key={entry._id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded-full font-mono font-bold">
                      {entry.action}
                    </span>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                      {entry.targetType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Admin: {entry.adminId?.name ?? '—'} ({entry.adminId?.email ?? '—'})
                  </p>
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {JSON.stringify(entry.details)}
                    </p>
                  )}
                  {entry.ipAddress && (
                    <p className="text-xs text-slate-400">IP: {entry.ipAddress}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">
                  {new Date(entry.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {auditLog.length === 0 && (
            <p className="text-center text-slate-400 py-8">Nenhuma ação registrada</p>
          )}
        </div>
      )}
    </div>
  );
};
