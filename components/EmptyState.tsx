import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'fa-inbox',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center justify-center py-16 text-center px-6 ${className}`}
    role="status"
    aria-label={title}
  >
    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
      <i className={`fas ${icon} text-2xl text-slate-400`} aria-hidden="true"></i>
    </div>
    <h3 className="font-black text-slate-700 text-base mb-1">{title}</h3>
    {description && (
      <p className="text-slate-400 text-sm max-w-xs">{description}</p>
    )}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
      >
        {actionLabel}
      </button>
    )}
  </div>
);
