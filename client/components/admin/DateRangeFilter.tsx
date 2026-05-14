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

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('filter.from')}</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="h-10 w-full px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('filter.to')}</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="h-10 w-full px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleApply} size="sm" className="flex-1">{t('filter.apply')}</Button>
        {applied && <Button onClick={handleClear} size="sm" variant="ghost">{t('filter.clear')}</Button>}
      </div>
      {applied && from && to && (
        <p className="text-xs text-gray-500">
          {t('filter.showing')} {new Date(from).toLocaleDateString()} – {new Date(to).toLocaleDateString()}
        </p>
      )}
      {!applied && <p className="text-xs text-gray-400">{t('filter.showingAll')}</p>}
    </div>
  );
}
