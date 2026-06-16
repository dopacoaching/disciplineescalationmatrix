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

  const { data: students, isLoading } = useGetStudentsQuery({
    search, batchId: batchId || undefined,
    escalationLevel: escalationLevel ? parseInt(escalationLevel) : undefined,
    sort,
  });
  const { data: batches } = useGetBatchesQuery();

  const selectClass = 'h-10 px-3 rounded-2xl border border-bmedium text-xs font-semibold bg-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/12';

  return (
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={t('nav.students')} />
      <div className="px-4 pt-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or register number..."
            className="h-12 w-full pl-10 pr-4 rounded-2xl border border-bmedium bg-surface text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 text-sm placeholder-gray-400 dark:placeholder-gray-600"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <select value={batchId} onChange={e => setBatchId(e.target.value)} className={selectClass}>
            <option value="">{t('filter.allBatches')}</option>
            {batches?.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <select value={escalationLevel} onChange={e => setEscalationLevel(e.target.value)} className={selectClass}>
            <option value="">{t('filter.allLevels')}</option>
            <option value="1">{t('escalation.level1Short')}</option>
            <option value="2">{t('escalation.level2Short')}</option>
            <option value="3">{t('escalation.level3Short')}</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className={selectClass}>
            <option value="most_flagged">{t('sort.mostFlagged')}</option>
            <option value="least_flagged">{t('sort.leastFlagged')}</option>
            <option value="most_recent">{t('sort.mostRecent')}</option>
            <option value="az">{t('sort.alphabetical')}</option>
          </select>
        </div>

        {isLoading ? (
          <Spinner className="py-12" />
        ) : students?.length === 0 ? (
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-10 text-center">
            <p className="text-sm text-gray-400">{t('empty.noStudents')}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card overflow-hidden">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-bsoft bg-page/50">
              <div className="w-1 shrink-0" />
              <p className="flex-1 text-[10px] font-bold uppercase tracking-wider text-navy/50 dark:text-gray-500">{t('col.name')}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50 dark:text-gray-500 w-16 text-right">{t('col.level')}</p>
            </div>
            {students?.map(s => (
              <Link key={s._id} href={`/admin/students/${s._id}`}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-bsoft last:border-0 hover:bg-page/40 active:bg-page/60 transition-colors">
                  <div className={`w-1 self-stretch rounded-full shrink-0 ${s.currentEscalationLevel === 3 ? 'bg-danger' : s.currentEscalationLevel === 2 ? 'bg-flagged' : 'bg-success'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">{s.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.registerNumber} · {(s.batchId as any)?.name}</p>
                    <p className="text-xs text-gray-400">{s.entryCount} {t('student.entriesCount')}</p>
                  </div>
                  <Badge variant={escalationBadgeVariant(s.currentEscalationLevel)} label={t(escalationKey(s.currentEscalationLevel))} />
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
