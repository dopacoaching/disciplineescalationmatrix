'use client';
import { useTranslation } from 'react-i18next';
import type { AuditLogEntry } from '@/types';

export const ACTION_META: Record<string, { key: string; dot: string }> = {
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

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AuditRow({ log }: { log: AuditLogEntry }) {
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
