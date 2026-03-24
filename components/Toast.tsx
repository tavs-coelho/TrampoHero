import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => (
  <div
    role="status"
    aria-live="polite"
    className={`fixed top-16 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm border ${
      type === 'success' ? 'bg-white border-emerald-200 text-emerald-800' :
      type === 'error' ? 'bg-white border-red-200 text-red-800' :
      'bg-white border-slate-200 text-slate-800'
    }`}
  >
    <i className={`fas text-sm ${
      type === 'success' ? 'fa-check-circle text-emerald-500' :
      type === 'error' ? 'fa-exclamation-circle text-red-500' :
      'fa-info-circle text-indigo-500'
    }`}></i>
    <p className="text-sm flex-1">{message}</p>
    <button onClick={onClose} aria-label="Fechar notificação" className="text-slate-400 hover:text-slate-600">
      <i className="fas fa-times text-xs"></i>
    </button>
  </div>
);
