'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetEntriesQuery, useDeleteEntryMutation } from '@/store/api/entriesApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';

const severityBorder: Record<string, string> = {
  high:   'border-l-danger',
  medium: 'border-l-flagged',
  low:    'border-l-success',
};

export default function AdminEntriesPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo] = useState<string | undefined>();
  const [sort, setSort] = useState('newest');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: entries, isLoading } = useGetEntriesQuery({ fromDate: from, toDate: to, sort });
  const [deleteEntry, { isLoading: deleting }] = useDeleteEntryMutation();

  const handleDateChange = (f?: string, t2?: string) => { setFrom(f); setTo(t2); };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id).unwrap();
      setDeleteId(null);
    } catch {
      alert(t('error.generic'));
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <TopBar title={t('nav.entries')} />
      <div className="px-4 pt-4 space-y-3">
        <DateRangeFilter onChange={handleDateChange} />

        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="h-10 w-full px-3 rounded-xl border-2 border-gray-200 text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 font-medium text-gray-700"
        >
          <option value="newest">{t('sort.mostRecent')}</option>
          <option value="oldest">Oldest first</option>
          <option value="highest_severity">Highest severity</option>
        </select>

        {isLoading ? (
          <Spinner className="py-12" />
        ) : entries?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-10 text-center">
            <p className="text-sm text-gray-400">{t('empty.noEntries')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries?.map(entry => (
              <div
                key={entry._id}
                className={`bg-white rounded-2xl border-l-4 border border-gray-100 shadow-card ${severityBorder[entry.severity] ?? 'border-l-gray-200'}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate text-sm">{entry.studentId?.fullName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {entry.studentId?.registerNumber}
                        {(entry.studentId?.batchId as any)?.name && ` · ${(entry.studentId.batchId as any).name}`}
                      </p>
                      <p className="text-sm text-gray-700 mt-2 font-medium">{t(`remark.${entry.remarkId}`)}</p>
                      {entry.customRemark && (
                        <p className="text-xs text-gray-400 italic mt-0.5">"{entry.customRemark}"</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5">
                        {t('admin.reportedBy')}: <span className="font-medium">{entry.staffId?.fullName}</span>
                        {' · '}{new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant={entry.severity as BadgeVariant} label={t(`severity.${entry.severity}`)} />
                      <Badge variant={`level${entry.escalationLevel}` as BadgeVariant} label={`L${entry.escalationLevel}`} />
                    </div>
                  </div>

                  {deleteId === entry._id ? (
                    <div className="mt-3 flex gap-2 pt-3 border-t border-gray-100">
                      <Button size="sm" variant="danger" loading={deleting} onClick={() => handleDelete(entry._id)}>
                        Confirm delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(null)}>{t('action.cancel')}</Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteId(entry._id)}
                      className="mt-2 text-xs font-semibold text-danger hover:text-red-700 transition-colors"
                    >
                      {t('action.delete')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AdminBottomNav />
    </div>
  );
}
