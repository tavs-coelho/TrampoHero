import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => (
  <div className={`fixed top-20 right-4 z-[60] animate-in slide-in-from-right duration-300 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-xs backdrop-blur-md border ${
    type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : 
    type === 'error' ? 'bg-red-500/90 text-white border-red-400' : 
    'bg-slate-800/90 text-white border-slate-700'
  }`}>
    <i className={`fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} text-xl`}></i>
    <p className="font-bold text-xs">{message}</p>
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><i className="fas fa-times"></i></button>
  </div>
);
