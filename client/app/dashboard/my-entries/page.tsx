'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetEntriesQuery } from '@/store/api/entriesApi';
import { TopBar } from '@/components/ui/TopBar';
import { StaffBottomNav } from '@/components/ui/BottomNav';
import { Spinner } from '@/components/ui/Spinner';

export default function MyEntriesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data: entries, isLoading } = useGetEntriesQuery({});

  const filtered = entries?.filter(e =>
    e.studentId?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title={t('nav.myEntries')} />
      <div className="px-4 pt-4 space-y-3">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by student name..."
          className="h-12 w-full px-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {isLoading ? (
          <Spinner className="py-12" />
        ) : filtered?.length === 0 ? (
          <p className="text-center text-gray-400 py-12">{t('empty.noEntries')}</p>
        ) : (
          <div className="space-y-2">
            {filtered?.map(entry => (
              <div key={entry._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{entry.studentId?.fullName}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{t(`remark.${entry.remarkId}`)}</p>
                    {entry.customRemark && (
                      <p className="text-sm text-gray-400 italic mt-0.5">"{entry.customRemark}"</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <StaffBottomNav />
    </div>
  );
}
