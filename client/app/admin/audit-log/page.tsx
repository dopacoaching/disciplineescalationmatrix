'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store';
import { useGetAuditLogQuery } from '@/store/api/dashboardApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { Spinner } from '@/components/ui/Spinner';
import { downloadFile } from '@/lib/downloadFile';
import { AuditRow } from '@/components/admin/AuditRow';

const FILTERS = [
  { value: '',        labelKey: 'audit.filter.all' },
  { value: 'auth',    labelKey: 'audit.filter.auth' },
  { value: 'entry',   labelKey: 'audit.filter.entries' },
  { value: 'student', labelKey: 'audit.filter.students' },
  { value: 'staff',   labelKey: 'audit.filter.staff' },
  { value: 'admin',   labelKey: 'audit.filter.admins' },
  { value: 'batch',   labelKey: 'audit.filter.batches' },
];

export default function AuditLogPage() {
  const { t } = useTranslation();
  const isSuper = useAppSelector(s => s.auth.user?.isSuperAdmin) !== false;
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo]     = useState<string | undefined>();
  const [action, setAction] = useState('');
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data: logs, isLoading } = useGetAuditLogQuery({
    limit: 100,
    fromDate: from,
    toDate: to,
    action: action || undefined,
  });

  const errorCount = logs?.filter(l => l.status === 'error').length ?? 0;
  // Auth/admin-management actions are global, not batch-tagged — a scoped
  // admin will never have any, so hide those chips for them.
  const filters = isSuper ? FILTERS : FILTERS.filter(f => f.value !== 'auth' && f.value !== 'admin');

  const handleExport = async (format: 'pdf' | 'excel') => {
    setDownloading(format);
    setExportError(null);
    try {
      const params = new URLSearchParams({ format });
      if (from) params.set('fromDate', from);
      if (to) params.set('toDate', to);
      if (action) params.set('action', action);
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const label = from && to ? `${from}-to-${to}` : 'all';
      await downloadFile(`/api/audit-log/export?${params}`, `audit-log-${label}.${ext}`);
    } catch {
      setExportError(t('export.failed'));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={t('nav.auditLog')} />
      <div className="px-4 pt-4 space-y-4">
        <DateRangeFilter onChange={(f, t2) => { setFrom(f); setTo(t2); }} />

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setAction(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                action === f.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-gray-500 dark:text-gray-400 border-bmedium hover:border-primary/40'
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>

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
        {exportError && <p className="text-xs text-danger bg-danger-bg rounded-xl px-3 py-2">{exportError}</p>}

        {!isLoading && errorCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{errorCount} {errorCount > 1 ? t('audit.errorsInView') : t('audit.errorInView')}</p>
          </div>
        )}

        <div className="bg-surface rounded-3xl border border-bsoft shadow-card px-4">
          {isLoading ? (
            <Spinner className="py-8" />
          ) : !logs?.length ? (
            <p className="text-sm text-gray-400 py-8 text-center">{t('empty.noActivity')}</p>
          ) : (
            <>
              {logs.map(log => <AuditRow key={log._id} log={log} />)}
              {logs.length === 100 && (
                <p className="text-xs text-gray-400 text-center py-3">{t('audit.showingLimit')}</p>
              )}
            </>
          )}
        </div>
      </div>
      <AdminBottomNav />
    </div>
  );
}
