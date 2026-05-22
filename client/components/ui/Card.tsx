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
      className={`rounded-2xl shadow-card border border-gray-100/80 bg-white p-4
        ${onClick ? 'cursor-pointer active:scale-[0.985] hover:shadow-card-md transition-all duration-150' : ''}
        ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
