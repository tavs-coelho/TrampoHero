import React from 'react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingLabel?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses: Record<string, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
};

const sizeClasses: Record<string, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
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
      btn-base active:scale-[0.99]
      disabled:active:scale-100
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
