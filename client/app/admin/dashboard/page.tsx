'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetDashboardStatsQuery, useGetFlaggedQuery, useGetStaffActivityQuery } from '@/store/api/dashboardApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { StatCard } from '@/components/admin/StatCard';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { escalationBadgeVariant, escalationKey } from '@/lib/escalation';
import Link from 'next/link';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo] = useState<string | undefined>();

  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery({ fromDate: from, toDate: to });
  const { data: flagged, isLoading: flaggedLoading } = useGetFlaggedQuery({ fromDate: from, toDate: to });
  const { data: staffActivity } = useGetStaffActivityQuery({ fromDate: from, toDate: to });

  const handleDateChange = (f?: string, t2?: string) => {
    setFrom(f);
    setTo(t2);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title={t('admin.dashboard.title')} />
      <div className="px-4 pt-4 space-y-5">
        <DateRangeFilter onChange={handleDateChange} />

        {statsLoading ? <Spinner className="py-8" /> : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard value={stats?.totalEntries ?? 0} label={t('admin.totalEntries')} color="primary" />
            <StatCard value={stats?.flaggedCount ?? 0} label={t('admin.flaggedStudents')} color="flagged" />
            <StatCard value={stats?.adminActionCount ?? 0} label={t('admin.adminAction')} color="danger" />
            <StatCard value={stats?.highSeverityCount ?? 0} label={t('admin.highSeverity')} color="danger" />
          </div>
        )}

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">{t('admin.flaggedList')}</h3>
          {flaggedLoading ? <Spinner className="py-6" /> : flagged?.length === 0 ? (
            <p className="text-sm text-gray-400">{t('empty.noStudents')}</p>
          ) : (
            <div className="space-y-2">
              {flagged?.map(s => (
                <Link key={s._id} href={`/admin/students/${s._id}`}>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{s.fullName}</p>
                      <p className="text-sm text-gray-500">{s.batchId?.name} · {s.entryCount} entries</p>
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
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">{t('admin.staffActivity')}</h3>
          <div className="space-y-2">
            {staffActivity?.map(s => (
              <div key={s._id} className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between ${s.entryCount === 0 ? 'opacity-60' : ''}`}>
                <div>
                  <p className="font-semibold text-gray-900">{s.fullName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={s.role} label={s.role} />
                    <p className="text-sm text-gray-500">{s.entryCount} entries</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {s.lastEntryAt ? new Date(s.lastEntryAt).toLocaleDateString() : t('admin.noEntries')}
                </p>
              </div>
            ))}
          </div>
        </div>
        <Link href="/admin/admins">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <p className="font-semibold text-gray-900">{t('nav.admins')}</p>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
      <AdminBottomNav />
    </div>
  );
}
