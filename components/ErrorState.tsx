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
    className={`flex flex-col items-center justify-center py-12 text-center px-6 ${className}`}
    role="alert"
    aria-live="assertive"
  >
    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-3">
      <i className="fas fa-exclamation-circle text-xl text-red-400" aria-hidden="true"></i>
    </div>
    <h3 className="font-semibold text-slate-800 text-sm mb-1">{title}</h3>
    <p className="text-slate-400 text-xs max-w-xs leading-relaxed">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2"
      >
        <i className="fas fa-rotate-right text-xs" aria-hidden="true"></i>
        {retryLabel}
      </button>
    )}
  </div>
);
