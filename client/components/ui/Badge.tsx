'use client';

export type BadgeVariant = 'low' | 'medium' | 'high' | 'level1' | 'level2' | 'level3' | 'teacher' | 'warden' | 'admin' | 'archived';

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  low: 'bg-success/10 text-success',
  medium: 'bg-flagged/10 text-flagged',
  high: 'bg-danger/10 text-danger',
  level1: 'bg-blue-100 text-blue-800',
  level2: 'bg-flagged-bg text-flagged',
  level3: 'bg-danger-bg text-danger',
  teacher: 'bg-primary-bg text-primary',
  warden: 'bg-purple-100 text-purple-800',
  admin: 'bg-gray-100 text-gray-700',
  archived: 'bg-gray-100 text-gray-500',
};

export function Badge({ variant, label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant]} ${className}`}>
      {label}
    </span>
  );
}
