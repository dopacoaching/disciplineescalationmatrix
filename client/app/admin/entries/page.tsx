'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetEntriesQuery, useDeleteEntryMutation } from '@/store/api/entriesApi';
import { useGetBatchesQuery } from '@/store/api/batchesApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

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
  const [batchId, setBatchId] = useState<string | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data: batches } = useGetBatchesQuery();
  const { data: entries, isLoading } = useGetEntriesQuery({ fromDate: from, toDate: to, sort, batchId });
  const [deleteEntry, { isLoading: deleting }] = useDeleteEntryMutation();

  const handleDateChange = (f?: string, t2?: string) => { setFrom(f); setTo(t2); };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setDownloading(format);
    setExportError(null);
    try {
      const params = new URLSearchParams({ format, sort });
      if (from) params.set('fromDate', from);
      if (to) params.set('toDate', to);
      if (batchId) params.set('batchId', batchId);
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const label = from && to ? `${from}-to-${to}` : 'all';
      await downloadFile(`/api/entries/export?${params}`, `entries-${label}.${ext}`);
    } catch {
      setExportError(t('export.failed'));
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    try {
      await deleteEntry(id).unwrap();
      setDeleteId(null);
    } catch {
      setDeleteError(t('error.generic'));
    }
  };

  return (
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={t('nav.entries')} />
      <div className="px-4 pt-4 space-y-3">
        <DateRangeFilter onChange={handleDateChange} />

        <select
          value={batchId ?? ''}
          onChange={e => setBatchId(e.target.value || undefined)}
          className="h-10 w-full px-3 rounded-2xl border border-bmedium text-sm bg-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 font-medium"
        >
          <option value="">{t('filter.allBatches')}</option>
          {batches?.map(b => (
            <option key={b._id} value={b._id}>{b.name}{b.isArchived ? ` (${t('batch.archived')})` : ''}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!downloading}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl border border-danger/30 bg-danger/5 text-danger text-xs font-semibold hover:bg-danger/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading === 'pdf' ? (
              <>{t('export.downloading')}</>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                {t('export.pdf')}
              </>
            )}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={!!downloading}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading === 'excel' ? (
              <>{t('export.downloading')}</>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('export.excel')}
              </>
            )}
          </button>
        </div>
        {exportError && (
          <p className="text-xs text-danger bg-danger-bg rounded-xl px-3 py-2">{exportError}</p>
        )}

        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="h-10 w-full px-3 rounded-2xl border border-bmedium text-sm bg-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 font-medium"
        >
          <option value="newest">{t('sort.mostRecent')}</option>
          <option value="oldest">{t('sort.oldest')}</option>
          <option value="highest_severity">{t('sort.highestSeverity')}</option>
        </select>

        {isLoading ? (
          <Spinner className="py-12" />
        ) : entries?.length === 0 ? (
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-10 text-center">
            <p className="text-sm text-gray-400">{t('empty.noEntries')}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card overflow-hidden">
            {/* Column headers */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-bsoft bg-page/50">
              <div className="w-1 shrink-0" />
              <p className="flex-1 text-[10px] font-bold uppercase tracking-wider text-navy/50 dark:text-gray-500">{t('col.name')} / {t('col.remark')}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50 dark:text-gray-500 w-14 text-right">{t('col.severity')}</p>
            </div>
            {entries?.map(entry => (
              <div
                key={entry._id}
                className={`border-b border-bsoft last:border-0 border-l-4 ${severityBorder[entry.severity] ?? 'border-l-gray-200'} ${deleteId === entry._id ? 'bg-danger-bg/30' : ''}`}
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm">{entry.studentId?.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.studentId?.registerNumber}
                      {(entry.studentId?.batchId as any)?.name && ` · ${(entry.studentId.batchId as any).name}`}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 font-medium">{t(`remark.${entry.remarkId}`)}</p>
                    {entry.customRemark && (
                      <p className="text-xs text-gray-400 italic mt-0.5">"{entry.customRemark}"</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {t('admin.reportedBy')}: <span className="font-medium">{entry.staffId?.fullName}</span>
                      {' · '}{new Date(entry.createdAt).toLocaleString()}
                    </p>
                    {deleteId === entry._id ? (
                      <div className="mt-2 flex gap-2 items-center">
                        <Button size="sm" variant="danger" loading={deleting} onClick={() => handleDelete(entry._id)}>
                          {t('action.confirmDelete')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setDeleteId(null); setDeleteError(null); }}>{t('action.cancel')}</Button>
                        {deleteError && <p className="text-xs text-danger">{deleteError}</p>}
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteId(entry._id)}
                        className="mt-1.5 text-xs font-semibold text-danger hover:text-red-700 transition-colors"
                      >
                        {t('action.delete')}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={entry.severity as BadgeVariant} label={t(`severity.${entry.severity}`)} />
                    <Badge variant={`level${entry.escalationLevel}` as BadgeVariant} label={`L${entry.escalationLevel}`} />
                  </div>
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
