import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/apiService';
import { UserProfile } from '../../types';

interface SupportCenterViewProps {
  user: UserProfile;
  setView: (view: 'browse' | 'dashboard') => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface Ticket {
  _id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  incidentType: string;
  slaTargetAt?: string | null;
  createdAt: string;
}

interface SupportMeta {
  categories: string[];
  statuses: string[];
  priorities: string[];
  incidentTypes: string[];
  slaHoursByCategory: Record<string, number>;
  responseTemplates: { key: string; category: string; text: string }[];
  prioritizationRules: string[];
}

const HELP_ITEMS = [
  { question: 'Como abrir ticket de disputa?', answer: 'Selecione categoria "dispute" e vincule o job relacionado.' },
  { question: 'Como denunciar fraude?', answer: 'Abra ticket em "fraud". O caso entra em revisão manual automaticamente.' },
  { question: 'Como acompanho SLA?', answer: 'Cada ticket mostra prioridade, status e prazo alvo para resposta.' },
];

const statusClass: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-700',
  in_progress: 'bg-blue-50 text-blue-700',
  waiting_user: 'bg-amber-50 text-amber-700',
  manual_review: 'bg-rose-50 text-rose-700',
  resolved: 'bg-indigo-50 text-indigo-700',
  closed: 'bg-slate-100 text-slate-600',
};

export const SupportCenterView: React.FC<SupportCenterViewProps> = ({ user, setView, showToast }) => {
  const [meta, setMeta] = useState<SupportMeta | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [incidentType, setIncidentType] = useState('general');

  const backView = user.role === 'employer' ? 'dashboard' : 'browse';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [metaRes, ticketsRes] = await Promise.all([
      apiService.supportGetOperationsMeta(),
      apiService.supportGetTickets(),
    ]);
    if (metaRes.success && metaRes.data) {
      setMeta(metaRes.data as SupportMeta);
      setCategory(((metaRes.data as SupportMeta).categories[0]) ?? 'other');
    } else {
      showToast('Erro ao carregar metadados de suporte', 'error');
    }
    if (ticketsRes.success && ticketsRes.data) {
      setTickets(ticketsRes.data as Ticket[]);
    } else {
      showToast('Erro ao carregar tickets', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedSlaText = useMemo(() => {
    if (!meta) return '—';
    const hours = meta.slaHoursByCategory[category] ?? 48;
    return `${hours}h`;
  }, [meta, category]);

  const template = useMemo(() => {
    if (!meta) return null;
    return meta.responseTemplates.find((t) => t.category === category) ?? meta.responseTemplates[0] ?? null;
  }, [meta, category]);

  const submitTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      showToast('Preencha assunto e descrição', 'error');
      return;
    }

    const result = await apiService.supportCreateTicket({
      subject: subject.trim(),
      description: description.trim(),
      category,
      incidentType,
      isCompanyVsFreelancerDispute: category === 'dispute',
      isFraudReported: category === 'fraud',
    });

    if (!result.success || !result.data) {
      showToast(result.error || 'Erro ao abrir ticket', 'error');
      return;
    }

    showToast('Ticket aberto com sucesso', 'success');
    setSubject('');
    setDescription('');
    await loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView(backView)}
          className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
          aria-label="Voltar"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Central de Suporte</h2>
          <p className="text-xs text-slate-500">Tickets, SLA, ajuda e histórico de atendimento</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
        <h3 className="font-black text-slate-900">Abrir Ticket</h3>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o problema"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none" rows={4} />
        <div className="grid grid-cols-2 gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
            {(meta?.categories ?? ['other']).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
            {(meta?.incidentTypes ?? ['general']).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="text-xs text-slate-500">SLA estimado para categoria: <span className="font-bold">{selectedSlaText}</span></div>
        {template && (
          <div className="text-xs bg-slate-50 border border-slate-100 rounded-xl p-2 text-slate-600">
            Template sugerido: {template.text}
          </div>
        )}
        <button onClick={submitTicket} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">
          Abrir Ticket
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
        <h3 className="font-black text-slate-900">Histórico de Atendimento</h3>
        {isLoading && <p className="text-sm text-slate-400">Carregando...</p>}
        {!isLoading && tickets.length === 0 && <p className="text-sm text-slate-400">Nenhum ticket encontrado</p>}
        {!isLoading && tickets.map((t) => (
          <div key={t._id} className="border border-slate-100 rounded-xl p-3">
            <p className="font-bold text-slate-900">{t.subject}</p>
            <p className="text-xs text-slate-500">{t.category} · {t.incidentType}</p>
            <div className="flex gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass[t.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {t.status}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">{t.priority}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2">
        <h3 className="font-black text-slate-900">Área de Ajuda</h3>
        {HELP_ITEMS.map((item) => (
          <div key={item.question} className="border border-slate-100 rounded-xl p-3">
            <p className="text-sm font-bold text-slate-900">{item.question}</p>
            <p className="text-xs text-slate-500">{item.answer}</p>
          </div>
        ))}
        {meta && (
          <div className="pt-2">
            <p className="text-xs font-bold text-slate-700 mb-1">Regras de priorização</p>
            <ul className="text-xs text-slate-500 list-disc pl-5 space-y-1">
              {meta.prioritizationRules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
