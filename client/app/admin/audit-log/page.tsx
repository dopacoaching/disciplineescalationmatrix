'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store';
import { useGetAuditLogQuery } from '@/store/api/dashboardApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { Spinner } from '@/components/ui/Spinner';
import type { AuditLogEntry } from '@/types';

const ACTION_META: Record<string, { key: string; dot: string }> = {
  'auth.login':        { key: 'audit.action.login',           dot: 'bg-blue-400' },
  'auth.logout':       { key: 'audit.action.logout',          dot: 'bg-blue-300' },
  'auth.login_failed': { key: 'audit.action.loginFailed',     dot: 'bg-red-500' },
  'staff.create':      { key: 'audit.action.staffCreate',     dot: 'bg-violet-500' },
  'staff.update':      { key: 'audit.action.staffUpdate',     dot: 'bg-violet-400' },
  'staff.deactivate':  { key: 'audit.action.staffDeactivate', dot: 'bg-red-500' },
  'staff.reactivate':  { key: 'audit.action.staffReactivate', dot: 'bg-emerald-500' },
  'admin.create':      { key: 'audit.action.adminCreate',     dot: 'bg-indigo-500' },
  'admin.update':      { key: 'audit.action.adminUpdate',     dot: 'bg-indigo-400' },
  'admin.deactivate':  { key: 'audit.action.adminDeactivate', dot: 'bg-red-500' },
  'admin.reactivate':  { key: 'audit.action.adminReactivate', dot: 'bg-emerald-500' },
  'batch.create':      { key: 'audit.action.batchCreate',     dot: 'bg-emerald-500' },
  'batch.update':      { key: 'audit.action.batchUpdate',     dot: 'bg-emerald-400' },
  'batch.delete':      { key: 'audit.action.batchDelete',     dot: 'bg-red-500' },
  'student.create':    { key: 'audit.action.studentCreate',   dot: 'bg-amber-500' },
  'student.update':    { key: 'audit.action.studentUpdate',   dot: 'bg-amber-400' },
  'student.delete':    { key: 'audit.action.studentDelete',   dot: 'bg-red-500' },
  'entry.create':      { key: 'audit.action.entryCreate',     dot: 'bg-orange-400' },
  'entry.delete':      { key: 'audit.action.entryDelete',     dot: 'bg-red-500' },
  'student.clearFlag': { key: 'audit.action.studentClearFlag', dot: 'bg-emerald-500' },
};

const FILTERS = [
  { value: '',        labelKey: 'audit.filter.all' },
  { value: 'auth',    labelKey: 'audit.filter.auth' },
  { value: 'entry',   labelKey: 'audit.filter.entries' },
  { value: 'student', labelKey: 'audit.filter.students' },
  { value: 'staff',   labelKey: 'audit.filter.staff' },
  { value: 'admin',   labelKey: 'audit.filter.admins' },
  { value: 'batch',   labelKey: 'audit.filter.batches' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function AuditRow({ log }: { log: AuditLogEntry }) {
  const { t } = useTranslation();
  const isError = log.status === 'error';
  const meta = ACTION_META[log.action] ?? { key: null, dot: 'bg-gray-400' };
  const dot = isError ? 'bg-red-500' : meta.dot;
  const date = new Date(log.createdAt);

  return (
    <div className={`flex items-start gap-3 py-3 border-b border-bsoft last:border-0 ${isError ? 'bg-red-50/60 dark:bg-red-900/10 -mx-4 px-4' : ''}`}>
      <div className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${dot} ring-2 ring-offset-1 ${isError ? 'ring-red-200 dark:ring-red-800' : 'ring-surface dark:ring-surface'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-800 dark:text-gray-200 leading-snug">
          <span className="font-semibold">{log.actorUsername}</span>
          <span className="text-gray-400 ml-1">({log.actorRole})</span>
          <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
          <span className={isError ? 'text-red-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}>{meta.key ? t(meta.key) : log.action}</span>
          {log.targetName && <span className="text-gray-500 dark:text-gray-400"> — {log.targetName}</span>}
        </p>
        {isError && log.details && (
          <p className="text-xs text-red-500 mt-0.5 font-medium">{log.details}</p>
        )}
        <p className="text-[10px] text-gray-400 mt-0.5">
          {timeAgo(log.createdAt)}
          {' · '}
          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  const { t } = useTranslation();
  const isSuper = useAppSelector(s => s.auth.user?.isSuperAdmin) !== false;
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo]     = useState<string | undefined>();
  const [action, setAction] = useState('');

  const { data: logs, isLoading } = useGetAuditLogQuery({
    limit: 100,
    fromDate: from,
    toDate: to,
    action: action || undefined,
  }, { skip: !isSuper });

  const errorCount = logs?.filter(l => l.status === 'error').length ?? 0;

  if (!isSuper) {
    return (
      <div className="min-h-screen bg-page pb-24">
        <TopBar title={t('nav.auditLog')} />
        <div className="px-4 pt-4">
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-10 text-center">
            <p className="text-sm text-gray-400">{t('admin.superOnly')}</p>
          </div>
        </div>
        <AdminBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={t('nav.auditLog')} />
      <div className="px-4 pt-4 space-y-4">
        <DateRangeFilter onChange={(f, t2) => { setFrom(f); setTo(t2); }} />

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map(f => (
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
