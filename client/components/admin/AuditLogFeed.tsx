'use client';
import { useGetAuditLogQuery } from '@/store/api/dashboardApi';
import { Spinner } from '@/components/ui/Spinner';
import type { AuditLogEntry } from '@/types';

const ACTION_META: Record<string, { label: string; dot: string }> = {
  'auth.login':        { label: 'Logged in',        dot: 'bg-blue-400'    },
  'auth.logout':       { label: 'Logged out',        dot: 'bg-blue-300'    },
  'auth.login_failed': { label: 'Login failed',      dot: 'bg-red-500'     },
  'staff.create':      { label: 'Created staff',     dot: 'bg-violet-500'  },
  'staff.update':      { label: 'Updated staff',     dot: 'bg-violet-400'  },
  'staff.deactivate':  { label: 'Deactivated staff', dot: 'bg-red-500'     },
  'staff.reactivate':  { label: 'Reactivated staff', dot: 'bg-emerald-500' },
  'admin.create':      { label: 'Created admin',     dot: 'bg-indigo-500'  },
  'admin.update':      { label: 'Updated admin',     dot: 'bg-indigo-400'  },
  'admin.deactivate':  { label: 'Deactivated admin', dot: 'bg-red-500'     },
  'admin.reactivate':  { label: 'Reactivated admin', dot: 'bg-emerald-500' },
  'batch.create':      { label: 'Created batch',     dot: 'bg-emerald-500' },
  'batch.update':      { label: 'Updated batch',     dot: 'bg-emerald-400' },
  'batch.delete':      { label: 'Deleted batch',     dot: 'bg-red-500'     },
  'student.create':    { label: 'Added student',     dot: 'bg-amber-500'   },
  'student.update':    { label: 'Updated student',   dot: 'bg-amber-400'   },
  'student.delete':    { label: 'Deleted student',   dot: 'bg-red-500'     },
  'entry.create':      { label: 'Logged entry',      dot: 'bg-orange-400'  },
  'entry.delete':      { label: 'Deleted entry',     dot: 'bg-red-500'     },
};

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
  const isError = log.status === 'error';
  const meta = ACTION_META[log.action] ?? { label: log.action, dot: 'bg-gray-300' };
  const dot = isError ? 'bg-red-500' : meta.dot;

  return (
    <div className={`flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 ${isError ? 'bg-red-50/60 -mx-4 px-4' : ''}`}>
      <div className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${dot} ring-2 ring-offset-1 ${isError ? 'ring-red-200' : 'ring-white'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-800 leading-snug">
          <span className="font-semibold">{log.actorUsername}</span>
          <span className="text-gray-400 ml-1">({log.actorRole})</span>
          <span className="text-gray-300 mx-1">·</span>
          <span className={isError ? 'text-red-600 font-semibold' : 'text-gray-700'}>{meta.label}</span>
          {log.targetName && <span className="text-gray-500"> — {log.targetName}</span>}
        </p>
        {isError && log.details && (
          <p className="text-xs text-red-500 mt-0.5 font-medium">{log.details}</p>
        )}
        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(log.createdAt)}</p>
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
      <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">Recent Activity</h3>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card px-4">
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
