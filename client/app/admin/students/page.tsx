'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useGetStudentsQuery } from '@/store/api/studentsApi';
import { useGetBatchesQuery } from '@/store/api/batchesApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { escalationBadgeVariant, escalationKey } from '@/lib/escalation';

export default function AdminStudentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [batchId, setBatchId] = useState('');
  const [escalationLevel, setEscalationLevel] = useState('');
  const [sort, setSort] = useState('most_flagged');

  const { data: students, isLoading } = useGetStudentsQuery({ search, batchId: batchId || undefined, escalationLevel: escalationLevel ? parseInt(escalationLevel) : undefined, sort });
  const { data: batches } = useGetBatchesQuery();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title={t('nav.students')} />
      <div className="px-4 pt-4 space-y-3">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or register number..."
          className="h-12 w-full px-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            value={batchId}
            onChange={e => setBatchId(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none"
          >
            <option value="">All batches</option>
            {batches?.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <select
            value={escalationLevel}
            onChange={e => setEscalationLevel(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none"
          >
            <option value="">All levels</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none"
          >
            <option value="most_flagged">{t('sort.mostFlagged')}</option>
            <option value="least_flagged">{t('sort.leastFlagged')}</option>
            <option value="most_recent">{t('sort.mostRecent')}</option>
            <option value="az">{t('sort.alphabetical')}</option>
          </select>
        </div>

        {isLoading ? <Spinner className="py-12" /> : students?.length === 0 ? (
          <p className="text-center text-gray-400 py-12">{t('empty.noStudents')}</p>
        ) : (
          <div className="space-y-2">
            {students?.map(s => (
              <Link key={s._id} href={`/admin/students/${s._id}`}>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{s.fullName}</p>
                    <p className="text-sm text-gray-500">{s.registerNumber} · {s.batchId?.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <Badge variant={escalationBadgeVariant(s.currentEscalationLevel)} label={t(escalationKey(s.currentEscalationLevel))} />
                    <span className="text-xs text-gray-400">{s.entryCount} entries</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <AdminBottomNav />
    </div>
  );
}
