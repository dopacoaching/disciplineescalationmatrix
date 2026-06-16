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
  low:      { chip: 'bg-success/12 text-success',    dot: 'bg-success' },
  medium:   { chip: 'bg-flagged/12 text-flagged',    dot: 'bg-flagged' },
  high:     { chip: 'bg-danger/12 text-danger',      dot: 'bg-danger' },
  level1:   { chip: 'bg-blue-500/12 text-blue-600 dark:text-blue-300', dot: 'bg-blue-400' },
  level2:   { chip: 'bg-flagged/12 text-flagged',    dot: 'bg-flagged' },
  level3:   { chip: 'bg-danger/12 text-danger',      dot: 'bg-danger' },
  teacher:  { chip: 'bg-primary/12 text-primary-dark dark:text-primary', dot: 'bg-primary' },
  warden:   { chip: 'bg-purple-500/12 text-purple-600 dark:text-purple-300', dot: 'bg-purple-500' },
  admin:    { chip: 'bg-navy/10 text-navy dark:bg-navy/30 dark:text-gray-200', dot: 'bg-navy' },
  archived: { chip: 'bg-surface2 text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' },
};

const SHOW_DOT: BadgeVariant[] = ['low', 'medium', 'high', 'level1', 'level2', 'level3'];

export function Badge({ variant, label, className = '' }: BadgeProps) {
  const { chip, dot } = styles[variant];
  const showDot = SHOW_DOT.includes(variant);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${chip} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />}
      {label}
    </span>
  );
}
