'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

interface DateRangeFilterProps {
  onChange: (from?: string, to?: string) => void;
}

export function DateRangeFilter({ onChange }: DateRangeFilterProps) {
  const { t } = useTranslation();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    onChange(from || undefined, to || undefined);
    setApplied(true);
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    setApplied(false);
    onChange(undefined, undefined);
  };

  const dateInputClass = 'h-10 w-full px-3 rounded-2xl border border-bmedium text-sm bg-surface text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 font-medium transition-all';

  return (
    <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-4 space-y-3 transition-colors duration-200">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-navy/50 dark:text-gray-500 uppercase tracking-wider mb-1">{t('filter.from')}</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={dateInputClass} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-navy/50 dark:text-gray-500 uppercase tracking-wider mb-1">{t('filter.to')}</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className={dateInputClass} />
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <Button onClick={handleApply} size="sm" className="flex-1">{t('filter.apply')}</Button>
        {applied && <Button onClick={handleClear} size="sm" variant="ghost">{t('filter.clear')}</Button>}
        {applied && from && to && (
          <p className="text-xs text-gray-400 ml-auto">
            {new Date(from).toLocaleDateString()} – {new Date(to).toLocaleDateString()}
          </p>
        )}
        {!applied && <p className="text-xs text-gray-400">{t('filter.showingAll')}</p>}
      </div>
    </div>
  );
}
