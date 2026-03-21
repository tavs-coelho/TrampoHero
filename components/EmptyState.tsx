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
    className={`flex flex-col items-center justify-center py-12 text-center px-6 ${className}`}
    role="status"
    aria-label={title}
  >
    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
      <i className={`fas ${icon} text-xl text-slate-400`} aria-hidden="true"></i>
    </div>
    <h3 className="font-semibold text-slate-700 text-sm mb-1">{title}</h3>
    {description && (
      <p className="text-slate-400 text-xs max-w-xs leading-relaxed">{description}</p>
    )}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);
