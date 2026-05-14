'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useGetStudentsQuery } from '@/store/api/studentsApi';
import { useCreateEntryMutation } from '@/store/api/entriesApi';
import { PRESET_REMARKS } from '@/constants/remarks';
import { TopBar } from '@/components/ui/TopBar';
import { StaffBottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RemarkSelector } from '@/components/staff/RemarkSelector';
import { escalationKey, escalationBadgeVariant, computePreviewLevel } from '@/lib/escalation';

export default function RemarkEntryPage() {
  const { batchId, studentId } = useParams<{ batchId: string; studentId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [customRemark, setCustomRemark] = useState('');
  const [createEntry, { isLoading }] = useCreateEntryMutation();
  const { data: students } = useGetStudentsQuery({ batchId });

  const student = students?.find(s => s._id === studentId);
  const selectedRemark = PRESET_REMARKS.find(r => r.id === selected);
  const currentCount = student?.entryCount || 0;
  const previewLevel = selected
    ? computePreviewLevel(
        currentCount + 1,
        selectedRemark?.severity === 'high' || (student?.currentEscalationLevel === 3 && selected !== null)
      )
    : null;

  const handleSubmit = async () => {
    if (!selected) return;
    try {
      await createEntry({
        studentId,
        remarkId: selected,
        customRemark: selected === 'other' ? customRemark : undefined,
      }).unwrap();
      router.replace('/dashboard/entry-confirmed');
    } catch {
      alert(t('error.generic'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title={student?.fullName || 'Entry'} showBack />

      <div className="px-4 pt-4 space-y-4">
        {student && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="font-bold text-gray-900">{student.fullName}</p>
            <p className="text-sm text-gray-500">{student.registerNumber}</p>
            <div className="mt-2">
              <Badge
                variant={escalationBadgeVariant(student.currentEscalationLevel)}
                label={t(escalationKey(student.currentEscalationLevel))}
              />
            </div>
          </div>
        )}

        <p className="text-sm font-semibold text-gray-700">{t('remark.selectPrompt')}</p>

        <RemarkSelector selected={selected} onSelect={setSelected} />

        {selected === 'other' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('remark.otherPrompt')}</label>
            <textarea
              value={customRemark}
              onChange={e => setCustomRemark(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
              placeholder="Describe the issue..."
            />
          </div>
        )}

        {selected && previewLevel && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-2">After this entry:</p>
            <Badge
              variant={escalationBadgeVariant(previewLevel)}
              label={t(escalationKey(previewLevel))}
            />
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
      </div>

      <StaffBottomNav />
    </div>
  );
}
