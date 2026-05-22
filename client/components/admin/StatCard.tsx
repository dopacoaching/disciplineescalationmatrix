'use client';

interface StatCardProps {
  value: number | string;
  label: string;
  color?: 'primary' | 'flagged' | 'danger' | 'success';
}

const configs: Record<NonNullable<StatCardProps['color']>, { gradient: string; iconPath: string }> = {
  primary: {
    gradient: 'from-[#06aec6] to-[#0e7a96]',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
  flagged: {
    gradient: 'from-amber-400 to-orange-500',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  danger: {
    gradient: 'from-red-500 to-[#A32D2D]',
    iconPath: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  success: {
    gradient: 'from-emerald-400 to-[#3B6D11]',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

export function StatCard({ value, label, color = 'primary' }: StatCardProps) {
  const { gradient, iconPath } = configs[color];
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 relative overflow-hidden shadow-card-md`}>
      {/* Watermark icon */}
      <div className="absolute -right-2 -top-2 opacity-[0.15]">
        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
        </svg>
      </div>
      {/* Decorative circle */}
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
      <p className="text-3xl font-extrabold text-white tracking-tight relative">{value}</p>
      <p className="text-xs font-semibold text-white/80 mt-1.5 leading-snug pr-8 relative">{label}</p>
    </div>
  );
}
