'use client';
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '_');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-semibold text-navy/80 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-[52px] w-full px-4 rounded-2xl border transition-all duration-150 bg-surface2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600
            ${error
              ? 'border-danger focus:border-danger focus:ring-4 focus:ring-danger/15'
              : 'border-bmedium focus:border-primary focus:ring-4 focus:ring-primary/12 focus:bg-surface'
            }
            focus:outline-none ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs font-medium text-danger flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
