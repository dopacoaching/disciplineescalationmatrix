'use client';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`rounded-2xl shadow-card border border-bsoft bg-surface p-4 transition-colors duration-200
        ${onClick ? 'cursor-pointer active:scale-[0.985] hover:shadow-card-md transition-all duration-150' : ''}
        ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
