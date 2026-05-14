'use client';

interface StatCardProps {
  value: number | string;
  label: string;
  color?: 'primary' | 'flagged' | 'danger' | 'success';
}

const colorMap = {
  primary: 'text-primary',
  flagged: 'text-flagged',
  danger: 'text-danger',
  success: 'text-success',
};

export function StatCard({ value, label, color = 'primary' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className={`text-3xl font-bold ${colorMap[color]}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1 leading-tight">{label}</p>
    </div>
  );
}
