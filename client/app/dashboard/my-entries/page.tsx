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
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
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
            className="h-12 w-full pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm text-gray-900 placeholder-gray-400"
          />
        </div>

        {isLoading ? (
          <Spinner className="py-12" />
        ) : filtered?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-10 text-center">
            <p className="text-sm text-gray-400">{t('empty.noEntries')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered?.map(entry => (
              <div
                key={entry._id}
                className={`bg-white rounded-2xl border-l-4 border border-gray-100 shadow-card ${severityBorder[entry.severity] ?? 'border-l-gray-200'}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate text-sm">{entry.studentId?.fullName}</p>
                      <p className="text-sm text-gray-700 mt-1 font-medium">{t(`remark.${entry.remarkId}`)}</p>
                      {entry.customRemark && (
                        <p className="text-xs text-gray-400 italic mt-0.5">"{entry.customRemark}"</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={entry.severity as BadgeVariant} label={t(`severity.${entry.severity}`)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <StaffBottomNav />
    </div>
  );
}
