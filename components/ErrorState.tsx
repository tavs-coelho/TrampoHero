import React from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Algo deu errado',
  message = 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
  onRetry,
  retryLabel = 'Tentar novamente',
  className = '',
}) => (
  <div
    className={`flex flex-col items-center justify-center py-16 text-center px-6 ${className}`}
    role="alert"
    aria-live="assertive"
  >
    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
      <i className="fas fa-exclamation-circle text-2xl text-red-400" aria-hidden="true"></i>
    </div>
    <h3 className="font-black text-slate-800 text-base mb-1">{title}</h3>
    <p className="text-slate-400 text-sm max-w-xs">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 active:scale-95 transition-all shadow-md flex items-center gap-2"
      >
        <i className="fas fa-rotate-right text-xs" aria-hidden="true"></i>
        {retryLabel}
      </button>
    )}
  </div>
);
