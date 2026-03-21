import React from 'react';
import { UserProfile, Certificate, Review } from '../../types';
import { MAX_RECENT_ITEMS } from '../../data/constants';
import { MEDALS_REPO } from '../../data/mockData';
import { StarRating } from '../StarRating';
import { Skeleton } from '../Skeleton';

interface ProfileViewProps {
  user: UserProfile;
  setView: (v: any) => void;
  handleDownloadCertificate: (cert: Certificate) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  reviews?: Review[];
  isLoading?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  setView,
  handleDownloadCertificate,
  showToast,
  reviews = [],
  isLoading = false,
}) => (
  <div className="space-y-5">
    <h1 className="text-xl font-bold text-slate-900">Meu Perfil</h1>
    {isLoading ? (
      <>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </>
    ) : (
      <>
        {/* Card principal */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{user.name}</h2>
              <p className="text-sm text-indigo-600">{user.tier} Member</p>
              {user.medals.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {user.medals.map(m => (
                    <span key={m.id} title={m.name} className="w-6 h-6 rounded-full bg-slate-100 border flex items-center justify-center">
                      <i className={`fas ${m.icon} ${m.color} text-[10px]`}></i>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {user.isPrime && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700">Seguro de Vida Ativo</p>
                <p className="text-xs text-slate-600">Cobertura até R$ 20.000</p>
              </div>
              <i className="fas fa-shield-halved text-emerald-500 text-lg"></i>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Reputação</p>
              <StarRating rating={user.rating} size="md" reviewCount={reviews.length} />
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Jobs realizados</p>
              <p className="text-xl font-bold text-slate-900">{user.history.length}</p>
            </div>
          </div>
        </div>

        {/* Avaliações Recebidas */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <i className="fas fa-star text-amber-400 text-xs"></i>
              Avaliações recebidas
            </h3>
            <div className="space-y-3">
              {reviews.slice(0, MAX_RECENT_ITEMS).map(review => (
                <div key={review.id} className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <StarRating rating={review.rating} size="sm" showValue={false} />
                    <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-slate-600 leading-relaxed">"{review.comment}"</p>
                  )}
                  {review.authorName && (
                    <p className="text-xs text-slate-400 mt-1">— {review.authorName}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Convites Enviados (Empregadores) */}
        {user.role === 'employer' && (user.invitations || []).length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <i className="fas fa-envelope text-indigo-600 text-xs"></i>
              Convites enviados
            </h3>
            <div className="space-y-2">
              {user.invitations!.slice(0, MAX_RECENT_ITEMS).map(inv => (
                <div key={inv.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{inv.talentName}</p>
                    <p className="text-xs text-slate-400">{inv.jobTitle} · {inv.sentDate}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
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

        {/* Notas Fiscais (Empregadores) */}
        {user.role === 'employer' && (user.invoices || []).length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <i className="fas fa-file-invoice text-indigo-600 text-xs"></i>
              Notas fiscais
            </h3>
            <div className="space-y-2">
              {user.invoices!.slice(0, MAX_RECENT_ITEMS).map(invoice => (
                <div key={invoice.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{invoice.jobTitle}</p>
                    <p className="text-xs text-slate-400">{invoice.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">R$ {invoice.amount.toFixed(2)}</p>
                    <button
                      onClick={() => {
                        showToast(`Gerando PDF da nota fiscal ${invoice.id}...`, "info");
                        setTimeout(() => {
                          showToast("PDF gerado! Download iniciado.", "success");
                        }, 1500);
                      }}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      <i className="fas fa-file-pdf mr-1"></i>PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificados */}
        {(user.certificates || []).length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <i className="fas fa-certificate text-indigo-600 text-xs"></i>
              Certificados
            </h3>
            <div className="space-y-3">
              {user.certificates!.map(cert => (
                <div key={cert.id} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-award text-white text-sm"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 mb-0.5">{cert.courseTitle}</h4>
                    <p className="text-xs text-slate-500 mb-1">{cert.issuer}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{cert.issueDate}</span>
                      <span>·</span>
                      <span className="text-amber-600">{cert.score}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadCertificate(cert)}
                    className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex-shrink-0"
                  >
                    <i className="fas fa-download mr-1"></i>PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu de Recursos */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Mais recursos</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { view: 'coins', icon: 'fa-coins', color: 'text-amber-500', label: 'TrampoCoins', sub: 'Programa de fidelidade' },
              { view: 'insurance', icon: 'fa-shield-check', color: 'text-emerald-500', label: 'TrampoProtect', sub: 'Seguro de vida' },
              { view: 'credit', icon: 'fa-hand-holding-dollar', color: 'text-indigo-500', label: 'TrampoCredit', sub: 'Adiantamento salarial' },
              { view: 'referrals', icon: 'fa-user-plus', color: 'text-pink-500', label: 'Indique e ganhe', sub: 'R$ 20 por indicação' },
              { view: 'academy', icon: 'fa-graduation-cap', color: 'text-violet-500', label: 'Hero Academy', sub: 'Cursos gratuitos' },
              { view: 'kyc', icon: 'fa-id-card', color: 'text-slate-500', label: 'Verificação', sub: user.kyc?.status === 'approved' ? 'Verificado ✓' : 'Verificar identidade' },
            ].map(item => (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left border border-slate-100"
              >
                <i className={`fas ${item.icon} ${item.color} text-base w-5 text-center`}></i>
                <div>
                  <p className="text-xs font-medium text-slate-900">{item.label}</p>
                  <p className="text-[11px] text-slate-400">{item.sub}</p>
                </div>
              </button>
            ))}
            {user.role === 'employer' && (
              <button
                onClick={() => setView('ads')}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left border border-slate-100"
              >
                <i className="fas fa-bullhorn text-rose-500 text-base w-5 text-center"></i>
                <div>
                  <p className="text-xs font-medium text-slate-900">TrampoAds</p>
                  <p className="text-[11px] text-slate-400">Anúncios pagos</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </>
    )}
  </div>
);
