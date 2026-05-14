'use client';
import { useGetAuditLogQuery } from '@/store/api/dashboardApi';
import { Spinner } from '@/components/ui/Spinner';
import type { AuditLogEntry } from '@/types';

const ACTION_META: Record<string, { label: string; dot: string }> = {
  'auth.login':        { label: 'Logged in',        dot: 'bg-blue-400' },
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function AuditRow({ log }: { log: AuditLogEntry }) {
  const meta = ACTION_META[log.action] ?? { label: log.action, dot: 'bg-gray-400' };
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${meta.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-semibold">{log.actorUsername}</span>
          {' · '}
          <span>{meta.label}</span>
          {log.targetName && (
            <span className="text-gray-500"> — {log.targetName}</span>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(log.createdAt)}</p>
      </div>
    </div>
  );
}

interface Props {
  fromDate?: string;
  toDate?: string;
}

export function AuditLogFeed({ fromDate, toDate }: Props) {
  const { data: logs, isLoading } = useGetAuditLogQuery({ limit: 50, fromDate, toDate });

  return (
    <div>
      <h3 className="text-base font-bold text-gray-800 mb-3">Recent Activity</h3>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4">
        {isLoading ? (
          <Spinner className="py-6" />
        ) : !logs?.length ? (
          <p className="text-sm text-gray-400 py-6 text-center">No activity yet</p>
        ) : (
          logs.map(log => <AuditRow key={log._id} log={log} />)
        )}
      </div>
    </div>
  );
}
