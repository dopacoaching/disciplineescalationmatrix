'use client';

export type BadgeVariant =
  | 'low' | 'medium' | 'high'
  | 'level1' | 'level2' | 'level3'
  | 'teacher' | 'warden' | 'admin' | 'archived';

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

const styles: Record<BadgeVariant, { chip: string; dot: string }> = {
  low:      { chip: 'bg-success/12 text-success border border-success/20',    dot: 'bg-success' },
  medium:   { chip: 'bg-flagged/12 text-flagged border border-flagged/20',    dot: 'bg-flagged' },
  high:     { chip: 'bg-danger/12 text-danger border border-danger/20',       dot: 'bg-danger' },
  level1:   { chip: 'bg-blue-50 text-blue-700 border border-blue-200',        dot: 'bg-blue-400' },
  level2:   { chip: 'bg-flagged-bg text-flagged border border-flagged/25',    dot: 'bg-flagged' },
  level3:   { chip: 'bg-danger-bg text-danger border border-danger/25',       dot: 'bg-danger' },
  teacher:  { chip: 'bg-primary-bg text-primary-dark border border-primary/20', dot: 'bg-primary' },
  warden:   { chip: 'bg-purple-50 text-purple-700 border border-purple-200',  dot: 'bg-purple-500' },
  admin:    { chip: 'bg-navy-bg text-navy border border-navy/20',             dot: 'bg-navy' },
  archived: { chip: 'bg-gray-100 text-gray-500 border border-gray-200',       dot: 'bg-gray-400' },
};

const SHOW_DOT: BadgeVariant[] = ['low', 'medium', 'high', 'level1', 'level2', 'level3'];

export function Badge({ variant, label, className = '' }: BadgeProps) {
  const { chip, dot } = styles[variant];
  const showDot = SHOW_DOT.includes(variant);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${chip} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />}
      {label}
    </span>
  );
}
