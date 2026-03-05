import React from 'react';
import { UserProfile, Certificate, Review } from '../../types';
import { MAX_RECENT_ITEMS } from '../../data/constants';
import { MEDALS_REPO } from '../../data/mockData';
import { StarRating } from '../StarRating';

interface ProfileViewProps {
  user: UserProfile;
  setView: (v: any) => void;
  handleDownloadCertificate: (cert: Certificate) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  reviews?: Review[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, setView, handleDownloadCertificate, showToast, reviews = [] }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="bg-white p-8 rounded-[3rem] text-center border border-slate-100 shadow-lg">
        <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white text-3xl font-black">{user.name.charAt(0)}</div>
        </div>
        <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
        <p className="text-indigo-600 font-bold text-sm mb-4">{user.tier} Member</p>
        
        {user.isPrime && (
            <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
                <div className="text-left">
                    <p className="text-[10px] font-black text-emerald-600 uppercase">Seguro de Vida Ativo</p>
                    <p className="text-xs font-bold text-slate-700">Cobertura até R$ 20.000</p>
                </div>
                <i className="fas fa-shield-halved text-emerald-500 text-xl"></i>
            </div>
        )}

        <div className="flex justify-center gap-2 mb-6">
            {user.medals.map(m => (
                <div key={m.id} title={m.name} className="w-8 h-8 rounded-full bg-slate-50 border flex items-center justify-center text-slate-400">
                    <i className={`fas ${m.icon} ${m.color}`}></i>
                </div>
            ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-black uppercase">Reputação</p>
                <StarRating rating={user.rating} size="md" reviewCount={reviews.length} />
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-black uppercase">Jobs</p>
                <p className="text-xl font-black text-slate-900">{user.history.length}</p>
            </div>
        </div>
    </div>

    {/* Seção de Avaliações Recebidas */}
    {reviews.length > 0 && (
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
          <i className="fas fa-star text-amber-400"></i>
          Avaliações Recebidas
        </h3>
        <div className="space-y-3">
          {reviews.slice(0, MAX_RECENT_ITEMS).map(review => (
            <div key={review.id} className="bg-slate-50 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <StarRating rating={review.rating} size="sm" showValue={false} />
                <span className="text-[10px] text-slate-400">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              {review.comment && (
                <p className="text-xs text-slate-600 leading-relaxed">"{review.comment}"</p>
              )}
              {review.authorName && (
                <p className="text-[10px] text-slate-400 mt-2 font-bold">— {review.authorName}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Seção de Convites Enviados (Apenas para Empregadores) */}
    {user.role === 'employer' && (user.invitations || []).length > 0 && (
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
          <i className="fas fa-envelope text-indigo-600"></i>
          Convites Enviados
        </h3>
        <div className="space-y-3">
          {user.invitations!.slice(0, MAX_RECENT_ITEMS).map(inv => (
            <div key={inv.id} className="bg-slate-50 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800 text-sm">{inv.talentName}</p>
                <p className="text-[10px] text-slate-400">{inv.jobTitle} • {inv.sentDate}</p>
              </div>
              <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${
                inv.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                inv.status === 'declined' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {inv.status === 'accepted' ? 'Aceito' : inv.status === 'declined' ? 'Recusado' : 'Pendente'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Seção de Notas Fiscais (Apenas para Empregadores) */}
    {user.role === 'employer' && (user.invoices || []).length > 0 && (
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
          <i className="fas fa-file-invoice text-indigo-600"></i>
          Notas Fiscais
        </h3>
        <div className="space-y-3">
          {user.invoices!.slice(0, MAX_RECENT_ITEMS).map(invoice => (
            <div key={invoice.id} className="bg-slate-50 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800 text-sm">{invoice.jobTitle}</p>
                <p className="text-[10px] text-slate-400">{invoice.date}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-900 text-sm">R$ {invoice.amount.toFixed(2)}</p>
                <button 
                  onClick={() => {
                    showToast(`Gerando PDF da nota fiscal ${invoice.id}...`, "info");
                    setTimeout(() => {
                      showToast("PDF gerado! Download iniciado.", "success");
                    }, 1500);
                  }}
                  className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  <i className="fas fa-file-pdf mr-1"></i>Gerar PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Seção de Certificados */}
    {(user.certificates || []).length > 0 && (
      <div className="bg-white p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm">
        <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
          <i className="fas fa-certificate text-indigo-600"></i>
          Meus Certificados
        </h3>
        <div className="space-y-3">
          {user.certificates!.map(cert => (
            <div key={cert.id} className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl border-2 border-indigo-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-award text-white text-xl"></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 text-sm mb-1">{cert.courseTitle}</h4>
                  <p className="text-[10px] text-slate-600 mb-2">
                    <i className="fas fa-building mr-1"></i>{cert.issuer}
                  </p>
                  <div className="flex items-center gap-3 text-[9px] text-slate-500">
                    <span><i className="fas fa-calendar mr-1"></i>{cert.issueDate}</span>
                    <span><i className="fas fa-star mr-1 text-amber-500"></i>{cert.score}%</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded">#{cert.certificateNumber}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadCertificate(cert)}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-bold hover:bg-indigo-700 transition-colors"
                >
                  <i className="fas fa-download mr-1"></i>PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Menu de Novas Funcionalidades */}
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
        <i className="fas fa-sparkles text-indigo-600"></i>
        Recursos Exclusivos
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setView('coins')} className="p-4 bg-amber-50 rounded-xl text-left hover:bg-amber-100 transition-colors">
          <i className="fas fa-coins text-amber-500 text-xl mb-2"></i>
          <p className="text-xs font-black text-slate-900">TrampoCoins</p>
          <p className="text-[9px] text-slate-500">Fidelidade</p>
        </button>
        <button onClick={() => setView('insurance')} className="p-4 bg-emerald-50 rounded-xl text-left hover:bg-emerald-100 transition-colors">
          <i className="fas fa-shield-check text-emerald-500 text-xl mb-2"></i>
          <p className="text-xs font-black text-slate-900">TrampoProtect</p>
          <p className="text-[9px] text-slate-500">Seguro</p>
        </button>
        <button onClick={() => setView('credit')} className="p-4 bg-indigo-50 rounded-xl text-left hover:bg-indigo-100 transition-colors">
          <i className="fas fa-hand-holding-dollar text-indigo-500 text-xl mb-2"></i>
          <p className="text-xs font-black text-slate-900">TrampoCredit</p>
          <p className="text-[9px] text-slate-500">Adiantamento</p>
        </button>
        <button onClick={() => setView('referrals')} className="p-4 bg-pink-50 rounded-xl text-left hover:bg-pink-100 transition-colors">
          <i className="fas fa-user-plus text-pink-500 text-xl mb-2"></i>
          <p className="text-xs font-black text-slate-900">Indique</p>
          <p className="text-[9px] text-slate-500">Ganhe R$ 20</p>
        </button>
        <button onClick={() => setView('analytics')} className="p-4 bg-blue-50 rounded-xl text-left hover:bg-blue-100 transition-colors">
          <i className="fas fa-chart-line text-blue-500 text-xl mb-2"></i>
          <p className="text-xs font-black text-slate-900">Analytics</p>
          <p className="text-[9px] text-slate-500">Métricas</p>
        </button>
        <button onClick={() => setView('challenges')} className="p-4 bg-orange-50 rounded-xl text-left hover:bg-orange-100 transition-colors">
          <i className="fas fa-fire text-orange-500 text-xl mb-2"></i>
          <p className="text-xs font-black text-slate-900">Desafios</p>
          <p className="text-[9px] text-slate-500">Semanal</p>
        </button>
        <button onClick={() => setView('ranking')} className="p-4 bg-purple-50 rounded-xl text-left hover:bg-purple-100 transition-colors">
          <i className="fas fa-trophy text-purple-500 text-xl mb-2"></i>
          <p className="text-xs font-black text-slate-900">Ranking</p>
          <p className="text-[9px] text-slate-500">Top Heroes</p>
        </button>
        <button onClick={() => setView('store')} className="p-4 bg-cyan-50 rounded-xl text-left hover:bg-cyan-100 transition-colors">
          <i className="fas fa-shopping-bag text-cyan-500 text-xl mb-2"></i>
          <p className="text-xs font-black text-slate-900">Loja</p>
          <p className="text-[9px] text-slate-500">EPIs & Mais</p>
        </button>
        <button onClick={() => setView('kyc')} className="p-4 bg-violet-50 rounded-xl text-left hover:bg-violet-100 transition-colors">
          <i className="fas fa-id-card text-violet-500 text-xl mb-2"></i>
          <p className="text-xs font-black text-slate-900">Verificação</p>
          <p className="text-[9px] text-slate-500">
            {user.kyc?.status === 'approved' ? 'Verificado ✓' : user.kyc?.status === 'pending' ? 'Em análise' : 'KYC'}
          </p>
        </button>
        {user.role === 'employer' && (
          <button onClick={() => setView('ads')} className="p-4 bg-rose-50 rounded-xl text-left hover:bg-rose-100 transition-colors">
            <i className="fas fa-bullhorn text-rose-500 text-xl mb-2"></i>
            <p className="text-xs font-black text-slate-900">Anúncios</p>
            <p className="text-[9px] text-slate-500">TrampoAds</p>
          </button>
        )}
      </div>
    </div>

    <button onClick={() => setView('academy')} className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-lg">
        Ir para Hero Academy
    </button>
  </div>
);
