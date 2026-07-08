'use client';
import { useTranslation } from 'react-i18next';
import type { AuditLogEntry } from '@/types';

// Mirrors the entry-row layout used on /admin/entries (bold name, description
// text, "reported/action by" meta line) so a recorded admin action reads the
// same way a teacher-submitted entry does.
export function RecordedActionRow({ log }: { log: AuditLogEntry }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-bsoft last:border-0 border-l-4 border-l-success">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm">{log.targetName}</p>
        {log.details ? (
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 font-medium">"{log.details}"</p>
        ) : (
          <p className="text-sm text-gray-400 italic mt-1.5">{t('student.noActionDescription')}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {t('student.actionBy')}: <span className="font-medium text-gray-600 dark:text-gray-300">{log.actorUsername}</span>
          <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
          {new Date(log.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
