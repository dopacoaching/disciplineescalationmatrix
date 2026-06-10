'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetEntriesQuery } from '@/store/api/entriesApi';
import { TopBar } from '@/components/ui/TopBar';
import { StaffBottomNav } from '@/components/ui/BottomNav';
import { Spinner } from '@/components/ui/Spinner';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';

const severityBorder: Record<string, string> = {
  high:   'border-l-danger',
  medium: 'border-l-flagged',
  low:    'border-l-success',
};

export default function MyEntriesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data: entries, isLoading } = useGetEntriesQuery({});

  const filtered = entries?.filter(e =>
    e.studentId?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={t('nav.myEntries')} />
      <div className="px-4 pt-4 space-y-3">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name..."
            className="h-12 w-full pl-10 pr-4 rounded-xl border-2 border-bmedium bg-surface text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm placeholder-gray-400 dark:placeholder-gray-600"
          />
        </div>

        {isLoading ? (
          <Spinner className="py-12" />
        ) : filtered?.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-bsoft shadow-card p-10 text-center">
            <p className="text-sm text-gray-400">{t('empty.noEntries')}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-bsoft shadow-card overflow-hidden">
            {/* Column headers */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-bsoft bg-page/50">
              <div className="w-1 shrink-0" />
              <p className="flex-1 text-[10px] font-bold uppercase tracking-wider text-navy/50 dark:text-gray-500">{t('col.name')} / {t('col.remark')}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50 dark:text-gray-500 w-14 text-right">{t('col.severity')}</p>
            </div>
            {filtered?.map(entry => (
              <div
                key={entry._id}
                className={`flex items-start gap-3 px-4 py-3 border-b border-bsoft last:border-0 border-l-4 ${severityBorder[entry.severity] ?? 'border-l-gray-200'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm">{entry.studentId?.fullName}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 font-medium">{t(`remark.${entry.remarkId}`)}</p>
                  {entry.customRemark && (
                    <p className="text-xs text-gray-400 italic mt-0.5">"{entry.customRemark}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <Badge variant={entry.severity as BadgeVariant} label={t(`severity.${entry.severity}`)} />
              </div>
            ))}
          </div>
        )}
      </div>
      <StaffBottomNav />
    </div>
  );
}
