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

export default function AdminEntriesPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo] = useState<string | undefined>();
  const [sort, setSort] = useState('newest');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: entries, isLoading } = useGetEntriesQuery({ fromDate: from, toDate: to, sort });
  const [deleteEntry, { isLoading: deleting }] = useDeleteEntryMutation();

  const handleDateChange = (f?: string, t2?: string) => {
    setFrom(f);
    setTo(t2);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id).unwrap();
      setDeleteId(null);
    } catch {
      alert(t('error.generic'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title={t('nav.entries')} />
      <div className="px-4 pt-4 space-y-4">
        <DateRangeFilter onChange={handleDateChange} />
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="h-10 w-full px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none"
        >
          <option value="newest">{t('sort.mostRecent')}</option>
          <option value="oldest">Oldest first</option>
          <option value="highest_severity">Highest severity</option>
        </select>

        {isLoading ? <Spinner className="py-8" /> : entries?.length === 0 ? (
          <p className="text-center text-gray-400 py-12">{t('empty.noEntries')}</p>
        ) : (
          <div className="space-y-2">
            {entries?.map(entry => (
              <div key={entry._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{entry.studentId?.fullName}</p>
                    <p className="text-sm text-gray-500">{entry.studentId?.registerNumber} · {entry.studentId?.batchId?.name}</p>
                    <p className="text-sm text-gray-700 mt-1">{t(`remark.${entry.remarkId}`)}</p>
                    {entry.customRemark && <p className="text-sm text-gray-400 italic">"{entry.customRemark}"</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {t('admin.reportedBy')}: {entry.staffId?.fullName} · {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={entry.severity} label={t(`severity.${entry.severity}`)} />
                    <Badge variant={`level${entry.escalationLevel}` as BadgeVariant} label={`L${entry.escalationLevel}`} />
                  </div>
                </div>
                {deleteId === entry._id ? (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="danger" loading={deleting} onClick={() => handleDelete(entry._id)}>
                      {t('action.confirm')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(null)}>{t('action.cancel')}</Button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteId(entry._id)} className="mt-2 text-xs text-danger hover:underline">
                    {t('action.delete')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <AdminBottomNav />
    </div>
  );
}
