'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store';
import { useGetStudentsQuery, useDeleteStudentMutation } from '@/store/api/studentsApi';
import { useCreateEntryMutation } from '@/store/api/entriesApi';
import { PRESET_REMARKS } from '@/constants/remarks';
import { TopBar } from '@/components/ui/TopBar';
import { StaffBottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { RemarkSelector } from '@/components/staff/RemarkSelector';
import { escalationKey, escalationBadgeVariant, computePreviewLevel } from '@/lib/escalation';

export default function RemarkEntryPage() {
  const { batchId, studentId } = useParams<{ batchId: string; studentId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [customRemark, setCustomRemark] = useState('');
  const [otherSeverity, setOtherSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [createEntry, { isLoading }] = useCreateEntryMutation();
  const [deleteStudent, { isLoading: removing }] = useDeleteStudentMutation();
  const { data: students } = useGetStudentsQuery({ batchId });
  const isCampusIncharge = useAppSelector(s => s.auth.user?.isCampusIncharge) === true;

  const student = students?.find(s => s._id === studentId);
  const selectedRemark = PRESET_REMARKS.find(r => r.id === selected);
  const currentCount = student?.entryCount || 0;
  // For "other", severity is the staff's pick; preset remarks use their fixed severity.
  const effectiveHigh = selected === 'other' ? otherSeverity === 'high' : selectedRemark?.severity === 'high';
  const previewLevel = selected
    ? computePreviewLevel(currentCount + 1, effectiveHigh)
    : null;

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitError(null);
    try {
      await createEntry({
        studentId,
        remarkId: selected,
        customRemark: selected === 'other' ? customRemark : undefined,
        severity: selected === 'other' ? otherSeverity : undefined,
      }).unwrap();
      router.replace('/dashboard/entry-confirmed');
    } catch (err: any) {
      setSubmitError(err?.data?.message || t('error.generic'));
    }
  };

  const handleRemove = async () => {
    setRemoveError(null);
    try {
      await deleteStudent(studentId).unwrap();
      router.replace(`/dashboard/batch/${batchId}`);
    } catch (err: any) {
      setRemoveError(err?.data?.message || t('error.generic'));
    }
  };

  return (
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={student?.fullName || 'Entry'} showBack />

      <div className="px-4 pt-4 space-y-4">
        {/* Student card */}
        {student && (
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card overflow-hidden">
            <div className={`h-1 w-full ${student.currentEscalationLevel === 3 ? 'bg-danger' : student.currentEscalationLevel === 2 ? 'bg-flagged' : 'bg-success'}`} />
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{student.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{student.registerNumber}</p>
              </div>
              <Badge
                variant={escalationBadgeVariant(student.currentEscalationLevel)}
                label={t(escalationKey(student.currentEscalationLevel))}
              />
            </div>
          </div>
        )}

        <p className="text-xs font-bold text-navy/60 dark:text-gray-400 uppercase tracking-wider">{t('remark.selectPrompt')}</p>

        <RemarkSelector selected={selected} onSelect={setSelected} />

        {selected === 'other' && (
          <>
            <div>
              <label className="block text-xs font-bold text-navy/60 dark:text-gray-400 uppercase tracking-wider mb-2">{t('remark.otherPrompt')}</label>
              <textarea
                value={customRemark}
                onChange={e => setCustomRemark(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-bmedium bg-surface text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 min-h-[100px] resize-none text-sm transition-all placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Describe the issue..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy/60 dark:text-gray-400 uppercase tracking-wider mb-2">{t('remark.severityPrompt')}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map(sev => {
                  const active = otherSeverity === sev;
                  const activeClass =
                    sev === 'high'   ? 'border-danger bg-danger/10 text-danger'
                    : sev === 'medium' ? 'border-flagged bg-flagged/10 text-flagged'
                    : 'border-success bg-success/10 text-success';
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setOtherSeverity(sev)}
                      className={`h-11 rounded-2xl border text-sm font-semibold transition-all ${active ? activeClass : 'border-bmedium text-gray-500 dark:text-gray-400 hover:bg-page/50'}`}
                    >
                      {t(`severity.${sev}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {selected && previewLevel && (
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{t('entry.afterEntry')}</p>
            <Badge
              variant={escalationBadgeVariant(previewLevel)}
              label={t(escalationKey(previewLevel))}
            />
          </div>
        )}

        {submitError && (
          <div className="bg-danger-bg rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-danger">{submitError}</p>
          </div>
        )}

        <Button
          size="lg"
          onClick={handleSubmit}
          loading={isLoading}
          disabled={!selected || (selected === 'other' && customRemark.trim().length === 0)}
        >
          {t('remark.submit')}
        </Button>

        {/* Remove student — campus in-charge only */}
        {isCampusIncharge && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => { setRemoveError(null); setRemoveOpen(true); }}
              className="w-full flex items-center justify-center gap-1.5 h-11 rounded-2xl border border-danger/30 bg-danger/5 text-danger text-sm font-semibold hover:bg-danger/10 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('student.remove')}
            </button>
          </div>
        )}
      </div>

      {/* Remove confirmation */}
      <Modal open={removeOpen} onClose={() => setRemoveOpen(false)} title={t('student.remove')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('student.removeWarning')}
          </p>
          {student && (
            <div className="bg-page/60 rounded-2xl px-4 py-3">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{student.fullName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{student.registerNumber}</p>
            </div>
          )}
          {removeError && <p className="text-sm text-danger bg-danger-bg rounded-xl px-3 py-2">{removeError}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" size="md" className="flex-1" onClick={() => setRemoveOpen(false)}>{t('action.cancel')}</Button>
            <Button variant="danger" size="md" className="flex-1" loading={removing} onClick={handleRemove}>{t('action.confirmDelete')}</Button>
          </div>
        </div>
      </Modal>

      <StaffBottomNav />
    </div>
  );
}
