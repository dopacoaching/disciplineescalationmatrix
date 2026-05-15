'use client';
import { useState } from 'react';
import { useGetAuditLogQuery } from '@/store/api/dashboardApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { Spinner } from '@/components/ui/Spinner';
import type { AuditLogEntry } from '@/types';

const ACTION_META: Record<string, { label: string; dot: string }> = {
  'auth.login':        { label: 'Logged in',        dot: 'bg-blue-400' },
  'auth.logout':       { label: 'Logged out',       dot: 'bg-blue-300' },
  'auth.login_failed': { label: 'Login failed',      dot: 'bg-red-500' },
  'staff.create':      { label: 'Created staff',     dot: 'bg-violet-500' },
  'staff.update':      { label: 'Updated staff',     dot: 'bg-violet-400' },
  'staff.deactivate':  { label: 'Deactivated staff', dot: 'bg-red-500' },
  'staff.reactivate':  { label: 'Reactivated staff', dot: 'bg-green-500' },
  'admin.create':      { label: 'Created admin',     dot: 'bg-indigo-500' },
  'admin.update':      { label: 'Updated admin',     dot: 'bg-indigo-400' },
  'admin.deactivate':  { label: 'Deactivated admin', dot: 'bg-red-500' },
  'admin.reactivate':  { label: 'Reactivated admin', dot: 'bg-green-500' },
  'batch.create':      { label: 'Created batch',     dot: 'bg-emerald-500' },
  'batch.update':      { label: 'Updated batch',     dot: 'bg-emerald-400' },
  'batch.delete':      { label: 'Deleted batch',     dot: 'bg-red-500' },
  'student.create':    { label: 'Added student',     dot: 'bg-amber-500' },
  'student.update':    { label: 'Updated student',   dot: 'bg-amber-400' },
  'student.delete':    { label: 'Deleted student',   dot: 'bg-red-500' },
  'entry.create':      { label: 'Logged entry',      dot: 'bg-orange-400' },
  'entry.delete':      { label: 'Deleted entry',     dot: 'bg-red-500' },
};

const FILTERS = [
  { value: '',        label: 'All' },
  { value: 'auth',    label: 'Auth' },
  { value: 'entry',   label: 'Entries' },
  { value: 'student', label: 'Students' },
  { value: 'staff',   label: 'Staff' },
  { value: 'admin',   label: 'Admins' },
  { value: 'batch',   label: 'Batches' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function AuditRow({ log }: { log: AuditLogEntry }) {
  const isError = log.status === 'error';
  const meta = ACTION_META[log.action] ?? { label: log.action, dot: 'bg-gray-400' };
  const dot = isError ? 'bg-red-500' : meta.dot;
  const date = new Date(log.createdAt);

  return (
    <div className={`flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 ${isError ? 'bg-red-50 -mx-4 px-4' : ''}`}>
      <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-semibold">{log.actorUsername}</span>
          <span className="text-gray-400 text-xs ml-1">({log.actorRole})</span>
          {' · '}
          <span className={isError ? 'text-red-600 font-medium' : ''}>{meta.label}</span>
          {log.targetName && <span className="text-gray-500"> — {log.targetName}</span>}
        </p>
        {isError && log.details && (
          <p className="text-xs text-red-500 mt-0.5">{log.details}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {timeAgo(log.createdAt)}
          {' · '}
          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo]     = useState<string | undefined>();
  const [action, setAction] = useState('');

  const { data: logs, isLoading } = useGetAuditLogQuery({
    limit: 100,
    fromDate: from,
    toDate: to,
    action: action || undefined,
  });

  const errorCount = logs?.filter(l => l.status === 'error').length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Audit Log" />
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
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!isLoading && errorCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">{errorCount} error{errorCount > 1 ? 's' : ''} in this view</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4">
          {isLoading ? (
            <Spinner className="py-8" />
          ) : !logs?.length ? (
            <p className="text-sm text-gray-400 py-8 text-center">No activity found</p>
          ) : (
            <>
              {logs.map(log => <AuditRow key={log._id} log={log} />)}
              {logs.length === 100 && (
                <p className="text-xs text-gray-400 text-center py-3">Showing most recent 100 entries</p>
              )}
            </>
          )}
        </div>
      </div>
      <AdminBottomNav />
    </div>
  );
}
