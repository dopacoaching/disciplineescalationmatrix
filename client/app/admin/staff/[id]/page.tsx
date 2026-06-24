'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useGetStaffActivityQuery, useGetStaffEntriesQuery } from '@/store/api/staffApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/admin/StatCard';

const PREVIEW_COUNT = 5;

const severityDot: Record<string, string> = {
  high:   'bg-danger',
  medium: 'bg-flagged',
  low:    'bg-success',
};

// A compact "Show all (N) / Show less" toggle used under each capped list.
function ShowMoreButton({ expanded, total, onToggle }: { expanded: boolean; total: number; onToggle: () => void }) {
  const { t } = useTranslation();
  if (total <= PREVIEW_COUNT) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-2 w-full text-xs font-semibold text-primary hover:text-primary/80 py-2 rounded-2xl border border-bsoft hover:bg-page/40 transition-colors"
    >
      {expanded ? t('action.showLess') : t('action.showAll', { count: total })}
    </button>
  );
}

// Format a 'YYYY-MM-DD' string as a readable, locale-aware date without
// re-introducing timezone drift (treat it as a local calendar day).
function fmtDay(s: string): string {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function StaffActivityPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: activity, isLoading } = useGetStaffActivityQuery(id);
  const { data: entries, isLoading: entriesLoading } = useGetStaffEntriesQuery(id);

  const [entriesExpanded, setEntriesExpanded] = useState(false);
  const [daysExpanded, setDaysExpanded] = useState(false);
  const [missedExpanded, setMissedExpanded] = useState(false);

  const staff = activity?.staff;

  const shownDaily = daysExpanded ? activity?.daily ?? [] : (activity?.daily ?? []).slice(0, PREVIEW_COUNT);
  const shownMissed = missedExpanded ? activity?.missedDates ?? [] : (activity?.missedDates ?? []).slice(0, PREVIEW_COUNT);
  const shownEntries = entriesExpanded ? entries ?? [] : (entries ?? []).slice(0, PREVIEW_COUNT);

  return (
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={staff?.fullName || t('nav.staff')} showBack backHref="/admin/staff" />

      <div className="px-4 pt-4 space-y-5">
        {isLoading || !activity ? (
          <Spinner className="py-10" />
        ) : (
          <>
            {/* Staff identity card */}
            <div className="bg-surface rounded-3xl border border-bsoft shadow-card-md p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-base font-bold text-primary">{staff?.fullName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg font-extrabold text-gray-900 dark:text-gray-100">{staff?.fullName}</p>
                    {staff && <Badge variant={staff.role} label={staff.role} />}
                    {staff && !staff.isActive && <Badge variant="archived" label={t('action.inactive')} />}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">@{staff?.username}</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-2 mt-2.5">
                    {staff?.assignedBatches?.map(b => (
                      <span key={b._id} className="text-xs bg-primary-bg dark:bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{b.name}</span>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2.5">
                    {t('admin.joined')}: {staff && new Date(staff.createdAt).toLocaleDateString()}
                    {activity.lastEntryAt && (
                      <>
                        <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                        {t('admin.lastEntry')}: {new Date(activity.lastEntryAt).toLocaleDateString()}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard value={activity.totalEntries} label={t('staff.stat.totalEntries')} color="primary" />
              <StatCard value={activity.activeDays} label={t('staff.stat.activeDays')} color="success" />
              <StatCard value={activity.missedDays} label={t('staff.stat.missedDays')} color="flagged" />
              <StatCard value={activity.bySeverity.high} label={t('staff.stat.highSeverity')} color="danger" />
            </div>

            {/* Severity breakdown */}
            <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-4">
              <h3 className="text-sm font-bold text-navy dark:text-gray-200 uppercase tracking-wider mb-3">{t('staff.severityBreakdown')}</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                {(['high', 'medium', 'low'] as const).map(sev => (
                  <div key={sev} className="rounded-2xl bg-page/60 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${severityDot[sev]}`} />
                      <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{activity.bySeverity[sev]}</p>
                    </div>
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1">{t(`severity.${sev}`)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-day entry counts */}
            <div>
              <h3 className="text-sm font-bold text-navy dark:text-gray-200 uppercase tracking-wider mb-3">{t('staff.entriesPerDay')}</h3>
              {activity.daily.length === 0 ? (
                <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-8 text-center">
                  <p className="text-sm text-gray-400">{t('empty.noEntries')}</p>
                </div>
              ) : (
                <>
                  <div className="bg-surface rounded-3xl border border-bsoft shadow-card overflow-hidden">
                    {shownDaily.map(d => (
                      <div key={d._id} className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-bsoft last:border-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{fmtDay(d._id)}</p>
                        <span className="text-xs font-bold text-primary bg-primary-bg dark:bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                          {d.count} {t('student.entriesCount')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <ShowMoreButton expanded={daysExpanded} total={activity.daily.length} onToggle={() => setDaysExpanded(v => !v)} />
                </>
              )}
            </div>

            {/* Missed days (no entries) */}
            <div>
              <h3 className="text-sm font-bold text-navy dark:text-gray-200 uppercase tracking-wider mb-1">{t('staff.missedDays')}</h3>
              <p className="text-xs text-gray-400 mb-3">{t('staff.missedDaysHint')}</p>
              {activity.missedDates.length === 0 ? (
                <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-6 text-center">
                  <p className="text-sm text-success font-medium">{t('staff.noMissedDays')}</p>
                </div>
              ) : (
                <>
                  <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-3">
                    <div className="flex flex-wrap gap-2">
                      {shownMissed.map(d => (
                        <span key={d} className="text-xs bg-flagged/10 text-flagged px-2.5 py-1 rounded-full font-medium">{fmtDay(d)}</span>
                      ))}
                    </div>
                  </div>
                  <ShowMoreButton expanded={missedExpanded} total={activity.missedDates.length} onToggle={() => setMissedExpanded(v => !v)} />
                </>
              )}
            </div>

            {/* Full entry history */}
            <div>
              <h3 className="text-sm font-bold text-navy dark:text-gray-200 uppercase tracking-wider mb-3">{t('staff.allEntries')}</h3>
              {entriesLoading ? (
                <Spinner className="py-8" />
              ) : (entries?.length ?? 0) === 0 ? (
                <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-8 text-center">
                  <p className="text-sm text-gray-400">{t('empty.noEntries')}</p>
                </div>
              ) : (
                <>
                <div className="bg-surface rounded-3xl border border-bsoft shadow-card overflow-hidden">
                  {shownEntries.map(entry => (
                    <div key={entry._id} className="border-b border-bsoft last:border-0">
                      <div className="flex items-start gap-3 px-4 py-3">
                        <div className={`w-1 self-stretch rounded-full shrink-0 ${severityDot[entry.severity] ?? 'bg-gray-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t(`remark.${entry.remarkId}`)}</p>
                          {entry.customRemark && (
                            <p className="text-xs text-gray-400 italic mt-0.5">&quot;{entry.customRemark}&quot;</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {entry.studentId?.fullName}
                            {entry.studentId?.registerNumber && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
                                {entry.studentId.registerNumber}
                              </>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</p>
                        </div>
                        <Badge variant={entry.severity as any} label={t(`severity.${entry.severity}`)} />
                      </div>
                    </div>
                  ))}
                </div>
                <ShowMoreButton expanded={entriesExpanded} total={entries?.length ?? 0} onToggle={() => setEntriesExpanded(v => !v)} />
                </>
              )}
            </div>
          </>
        )}
      </div>

      <AdminBottomNav />
    </div>
  );
}
