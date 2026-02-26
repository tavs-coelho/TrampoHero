import React from 'react';
import { Advertisement, UserProfile } from '../../types';

interface AdsViewProps {
  user: UserProfile;
  advertisements: Advertisement[];
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setView: (v: 'dashboard') => void;
}

export const AdsView: React.FC<AdsViewProps> = ({ user, advertisements, showToast, setView }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <header className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-black text-slate-900">📢 TrampoAds</h2>
        <p className="text-slate-500 text-sm">Anuncie para freelancers</p>
      </div>
      <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
    </header>

    {/* Ad Stats Overview */}
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center">
        <p className="text-2xl font-black text-indigo-600 mb-1">2</p>
        <p className="text-xs text-slate-500 font-bold">Campanhas Ativas</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center">
        <p className="text-2xl font-black text-amber-600 mb-1">57.7k</p>
        <p className="text-xs text-slate-500 font-bold">Impressões</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center">
        <p className="text-2xl font-black text-emerald-600 mb-1">1.1k</p>
        <p className="text-xs text-slate-500 font-bold">Cliques</p>
      </div>
    </div>

    {/* Active Campaigns */}
    <div>
      <h3 className="font-black text-slate-900 mb-3">Campanhas Ativas</h3>
      <div className="space-y-4">
        {advertisements.filter(ad => ad.isActive).map(ad => (
          <div key={ad.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    ad.type === 'banner' ? 'bg-blue-100 text-blue-600' :
                    ad.type === 'sponsored_post' ? 'bg-purple-100 text-purple-600' :
                    ad.type === 'push_notification' ? 'bg-green-100 text-green-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {ad.type === 'banner' && '🎨 Banner'}
                    {ad.type === 'sponsored_post' && '📱 Post Patrocinado'}
                    {ad.type === 'push_notification' && '🔔 Push'}
                    {ad.type === 'video_preroll' && '🎥 Vídeo'}
                  </span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold">
                    Ativo
                  </span>
                </div>
                <h3 className="font-black text-lg text-slate-900 mb-1">{ad.content.title}</h3>
                <p className="text-sm text-slate-600">{ad.content.description}</p>
              </div>
            </div>

            {/* Ad Metrics */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Budget</p>
                <p className="text-sm font-black text-slate-900">R$ {ad.budget}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Gasto</p>
                <p className="text-sm font-black text-amber-600">R$ {ad.spent}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Impressões</p>
                <p className="text-sm font-black text-indigo-600">{(ad.impressions / 1000).toFixed(1)}k</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">CTR</p>
                <p className="text-sm font-black text-emerald-600">{((ad.clicks / ad.impressions) * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                style={{width: `${(ad.spent / ad.budget) * 100}%`}}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Create Campaign Button */}
    <button 
      onClick={() => showToast('Campanha criada com sucesso!', 'success')}
      className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black shadow-xl hover:shadow-2xl transition-all"
    >
      <i className="fas fa-plus mr-2"></i>
      Criar Nova Campanha
    </button>

    {/* Pricing Info */}
    <div className="bg-slate-50 p-6 rounded-[2.5rem]">
      <h3 className="font-black text-slate-900 mb-4">💰 Preços</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Banner no Feed</span>
          <span className="font-bold">R$ 500/semana</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Post Patrocinado</span>
          <span className="font-bold">R$ 300/post</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Push Notification</span>
          <span className="font-bold">R$ 0,15/envio</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Vídeo Pre-roll</span>
          <span className="font-bold">R$ 2.000/semana</span>
        </div>
      </div>
    </div>
  </div>
);
