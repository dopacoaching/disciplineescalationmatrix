'use client';
import { useTranslation } from 'react-i18next';
import { useGetDashboardStatsQuery, useGetFlaggedQuery } from '@/store/api/dashboardApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { StatCard } from '@/components/admin/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { escalationBadgeVariant, escalationKey } from '@/lib/escalation';
import Link from 'next/link';

export default function AdminDashboard() {
  const { t } = useTranslation();

  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery({});
  const { data: flagged, isLoading: flaggedLoading } = useGetFlaggedQuery({});

  return (
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={t('admin.dashboard.title')} />

      <div className="px-4 pt-4 space-y-5">
        {/* Stats grid */}
        {statsLoading ? (
          <Spinner className="py-8" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard value={stats?.totalEntries ?? 0}      label={t('admin.totalEntries')}    color="primary"  />
            <StatCard value={stats?.flaggedCount ?? 0}      label={t('admin.flaggedStudents')} color="flagged"  />
            <StatCard value={stats?.adminActionCount ?? 0}  label={t('admin.adminAction')}     color="danger"   />
            <StatCard value={stats?.highSeverityCount ?? 0} label={t('admin.highSeverity')}    color="danger"   />
          </div>
        )}

        {/* Flagged students */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-navy dark:text-gray-200 uppercase tracking-wider">{t('admin.flaggedList')}</h3>
            <Link href="/admin/students?sort=most_flagged" className="text-xs font-semibold text-primary hover:underline">
              {t('action.viewAll')}
            </Link>
          </div>
          {flaggedLoading ? <Spinner className="py-6" /> : flagged?.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-bsoft shadow-card p-6 text-center">
              <p className="text-sm text-gray-400">{t('empty.noStudents')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {flagged?.map(s => (
                <Link key={s._id} href={`/admin/students/${s._id}`}>
                  <div className="bg-surface rounded-2xl border border-bsoft shadow-card hover:shadow-card-md transition-shadow p-4 flex items-center gap-3">
                    <div className={`w-1 self-stretch rounded-full shrink-0 ${s.currentEscalationLevel === 3 ? 'bg-danger' : 'bg-flagged'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">{s.fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{(s.batchId as any)?.name} · {s.entryCount} {t('student.entriesCount')}</p>
                      {s.lastEntryAt && (
                        <p className="text-xs text-gray-400 mt-0.5">{t('admin.lastEntry')}: {new Date(s.lastEntryAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    <Badge variant={escalationBadgeVariant(s.currentEscalationLevel)} label={t(escalationKey(s.currentEscalationLevel))} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Link href="/admin/admins">
          <div className="bg-surface rounded-2xl border border-bsoft shadow-card hover:shadow-card-md transition-shadow p-4 flex items-center justify-between">
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
      </div>
      <AdminBottomNav />
    </div>
  );
}
