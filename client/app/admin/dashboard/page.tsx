'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store';
import { useGetDashboardStatsQuery, useGetFlaggedQuery, useGetAuditLogQuery } from '@/store/api/dashboardApi';
import { useGetEntriesQuery } from '@/store/api/entriesApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { StatCard } from '@/components/admin/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { RecordedActionRow } from '@/components/admin/RecordedActionRow';
import { escalationBadgeVariant, escalationKey } from '@/lib/escalation';
import Link from 'next/link';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const isSuper = useAppSelector(s => s.auth.user?.isSuperAdmin) !== false;
  // Which marked-students modal is open: level 2 (flagged), 3 (admin action), or none.
  const [markedLevel, setMarkedLevel] = useState<2 | 3 | null>(null);
  // High-severity entries modal (fetched on demand when opened).
  const [highOpen, setHighOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery({});
  const { data: flagged, isLoading: flaggedLoading } = useGetFlaggedQuery({});
  const { data: highEntries, isLoading: highLoading } = useGetEntriesQuery(
    { severity: 'high', sort: 'newest' },
    { skip: !highOpen },
  );
  // "Record Admin Action" events (student.clearFlag) — super admins see
  // every batch's, scoped (batch-assigned) admins get theirs only, filtered
  // server-side.
  const { data: recentActions, isLoading: actionsLoading } = useGetAuditLogQuery({ limit: 6, action: 'student.clearFlag' });

  const markedStudents = flagged?.filter(s => s.currentEscalationLevel === markedLevel) ?? [];

  return (
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={t('admin.dashboard.title')} />

      <div className="px-4 pt-4 space-y-5">
        {/* Stats grid */}
        {statsLoading ? (
          <Spinner className="py-8" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/entries" className="block rounded-2xl transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <StatCard value={stats?.totalEntries ?? 0}      label={t('admin.totalEntries')}    color="primary"  />
            </Link>
            <button type="button" onClick={() => setMarkedLevel(2)} className="block text-left rounded-2xl transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <StatCard value={stats?.flaggedCount ?? 0}      label={t('admin.flaggedStudents')} color="flagged"  />
            </button>
            <button type="button" onClick={() => setMarkedLevel(3)} className="block text-left rounded-2xl transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <StatCard value={stats?.adminActionCount ?? 0}  label={t('admin.adminAction')}     color="danger"   />
            </button>
            <button type="button" onClick={() => setHighOpen(true)} className="block text-left rounded-2xl transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <StatCard value={stats?.highSeverityCount ?? 0} label={t('admin.highSeverity')}    color="danger"   />
            </button>
          </div>
        )}

        {/* Requires Attention — moved to its own page, reachable via this button */}
        <Link href="/admin/requires-attention">
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card hover:shadow-card-md transition-shadow p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-flagged/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-flagged" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{t('admin.flaggedList')}</p>
                {!flaggedLoading && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{(flagged?.length ?? 0)} {t('admin.studentsNeedAttention')}</p>
                )}
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {isSuper && (
        <Link href="/admin/admins">
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card hover:shadow-card-md transition-shadow p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-navy-bg dark:bg-navy/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-navy dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{t('nav.admins')}</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
        )}

        {/* Recent Admin Actions — super admins see every batch; scoped
            (batch-assigned) admins get the same feed pre-filtered to their
            own batches by the server. */}
        <div className="bg-surface rounded-3xl border border-bsoft shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4">
            <h3 className="text-sm font-bold text-navy dark:text-gray-200">{t('admin.recentActions')}</h3>
            <Link href="/admin/audit-log" className="text-xs font-semibold text-primary hover:underline">
              {t('action.viewAll')}
            </Link>
          </div>
          <div className="mt-2">
            {actionsLoading ? (
              <Spinner className="py-6" />
            ) : !recentActions?.length ? (
              <p className="text-sm text-gray-400 py-6 text-center px-4">{t('empty.noActivity')}</p>
            ) : (
              recentActions.map(log => <RecordedActionRow key={log._id} log={log} />)
            )}
          </div>
        </div>
      </div>

      {/* Marked students modal — shows only the students behind the clicked stat */}
      <Modal
        open={markedLevel !== null}
        onClose={() => setMarkedLevel(null)}
        title={markedLevel === 3 ? t('admin.adminAction') : t('admin.flaggedStudents')}
      >
        {flaggedLoading ? (
          <Spinner className="py-6" />
        ) : markedStudents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{t('empty.noStudents')}</p>
        ) : (
          <div className="space-y-2">
            {markedStudents.map(s => (
              <Link
                key={s._id}
                href={`/admin/students/${s._id}`}
                onClick={() => setMarkedLevel(null)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-bsoft hover:bg-page/40 transition-colors"
              >
                <div className={`w-1 self-stretch rounded-full shrink-0 ${s.currentEscalationLevel === 3 ? 'bg-danger' : 'bg-flagged'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">{s.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{(s.batchId as any)?.name} · {s.entryCount} {t('student.entriesCount')}</p>
                  {s.lastEntryAt && (
                    <p className="text-xs text-gray-400">{t('admin.lastEntry')}: {new Date(s.lastEntryAt).toLocaleDateString()}</p>
                  )}
                </div>
                <Badge variant={escalationBadgeVariant(s.currentEscalationLevel)} label={t(escalationKey(s.currentEscalationLevel))} />
              </Link>
            ))}
          </div>
        )}
      </Modal>

      {/* High-severity entries modal */}
      <Modal open={highOpen} onClose={() => setHighOpen(false)} title={t('admin.highSeverity')}>
        {highLoading ? (
          <Spinner className="py-6" />
        ) : (highEntries?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{t('empty.noEntries')}</p>
        ) : (
          <div className="space-y-2">
            {highEntries?.map(entry => (
              <Link
                key={entry._id}
                href={`/admin/students/${entry.studentId?._id}`}
                onClick={() => setHighOpen(false)}
                className="flex items-start gap-3 px-3 py-2.5 rounded-2xl border border-bsoft hover:bg-page/40 transition-colors"
              >
                <div className="w-1 self-stretch rounded-full shrink-0 bg-danger" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">{entry.studentId?.fullName}</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{t(`remark.${entry.remarkId}`)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(entry.studentId?.batchId as any)?.name}
                    <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="high" label={t('severity.high')} />
              </Link>
            ))}
          </div>
        )}
      </Modal>

      <AdminBottomNav />
    </div>
  );
}
