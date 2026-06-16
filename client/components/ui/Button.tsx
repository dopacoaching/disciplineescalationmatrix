'use client';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97] select-none';

  const variants = {
    primary:
      'bg-gradient-to-br from-primary to-primary-dark text-white shadow-fab hover:brightness-110 focus-visible:ring-primary disabled:opacity-60 disabled:shadow-none',
    secondary:
      'bg-surface2 text-navy dark:text-gray-100 border border-bmedium hover:bg-bmedium dark:hover:bg-bmedium focus-visible:ring-primary',
    danger:
      'bg-gradient-to-br from-red-500 to-danger text-white shadow-md hover:brightness-110 focus-visible:ring-danger disabled:opacity-60',
    ghost:
      'bg-transparent text-neutral dark:text-gray-400 hover:bg-surface2 focus-visible:ring-gray-300',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm min-h-[38px]',
    md: 'px-5 py-2.5 text-sm min-h-[46px]',
    lg: 'px-6 py-3 text-base w-full min-h-[54px]',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
