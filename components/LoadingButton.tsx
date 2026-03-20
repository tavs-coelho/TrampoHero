import React from 'react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingLabel?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses: Record<string, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200',
  secondary: 'bg-slate-900 text-white hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-4 py-2 text-xs rounded-xl',
  md: 'px-6 py-3 text-sm rounded-2xl',
  lg: 'w-full py-5 text-base rounded-2xl',
};

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingLabel,
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  className = '',
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || isLoading}
    aria-busy={isLoading}
    className={`
      font-black uppercase tracking-wide transition-all active:scale-95
      disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
      flex items-center justify-center gap-2
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `}
  >
    {isLoading ? (
      <>
        <svg
          className="animate-spin w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        {loadingLabel ?? 'Aguarde…'}
      </>
    ) : (
      children
    )}
  </button>
);
