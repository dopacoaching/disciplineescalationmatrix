'use client';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useGetFlaggedQuery } from '@/store/api/dashboardApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { escalationBadgeVariant, escalationKey } from '@/lib/escalation';

export default function RequiresAttentionPage() {
  const { t } = useTranslation();
  const { data: flagged, isLoading } = useGetFlaggedQuery({});

  return (
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={t('admin.flaggedList')} showBack backHref="/admin/dashboard" />

      <div className="px-4 pt-4 space-y-4">
        {isLoading ? (
          <Spinner className="py-12" />
        ) : flagged?.length === 0 ? (
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-10 text-center">
            <p className="text-sm text-gray-400">{t('empty.noStudents')}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card overflow-hidden">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-bsoft bg-page/50">
              <div className="w-1 shrink-0" />
              <p className="flex-1 text-[10px] font-bold uppercase tracking-wider text-navy/50 dark:text-gray-500">{t('col.name')}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50 dark:text-gray-500">{t('col.level')}</p>
            </div>
            {flagged?.map(s => (
              <Link key={s._id} href={`/admin/students/${s._id}`}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-bsoft last:border-0 hover:bg-page/40 transition-colors">
                  <div className={`w-1 self-stretch rounded-full shrink-0 ${s.currentEscalationLevel === 3 ? 'bg-danger' : 'bg-flagged'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">{s.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{(s.batchId as any)?.name} · {s.entryCount} {t('student.entriesCount')}</p>
                    {s.lastEntryAt && (
                      <p className="text-xs text-gray-400">{t('admin.lastEntry')}: {new Date(s.lastEntryAt).toLocaleDateString()}</p>
                    )}
                  </div>
                  <Badge variant={escalationBadgeVariant(s.currentEscalationLevel)} label={t(escalationKey(s.currentEscalationLevel))} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <AdminBottomNav />
    </div>
  );
}
