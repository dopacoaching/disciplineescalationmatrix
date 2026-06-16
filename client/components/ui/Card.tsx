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
      className={`rounded-3xl shadow-card border border-bsoft bg-surface p-5 transition-all duration-200
        ${onClick ? 'cursor-pointer active:scale-[0.985] hover:shadow-card-md hover:-translate-y-0.5' : ''}
        ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
