'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useGetStudentsQuery, useUpdateStudentMutation, useDeleteStudentMutation } from '@/store/api/studentsApi';
import { useGetEntriesQuery, useDeleteEntryMutation } from '@/store/api/entriesApi';
import { useGetBatchesQuery } from '@/store/api/batchesApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { escalationBadgeVariant, escalationKey } from '@/lib/escalation';

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferBatch, setTransferBatch] = useState('');
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  const { data: students } = useGetStudentsQuery({});
  const { data: entries, isLoading: entriesLoading } = useGetEntriesQuery({ studentId: id });
  const { data: batches } = useGetBatchesQuery();
  const [updateStudent, { isLoading: transferLoading }] = useUpdateStudentMutation();
  const [deleteStudent] = useDeleteStudentMutation();
  const [deleteEntry, { isLoading: deletingEntry }] = useDeleteEntryMutation();

  const student = students?.find(s => s._id === id);

  const handleTransfer = async () => {
    if (!transferBatch) return;
    await updateStudent({ id, data: { batchId: transferBatch } }).unwrap();
    setTransferOpen(false);
  };

  const handleDeleteEntry = async (entryId: string) => {
    await deleteEntry(entryId).unwrap();
    setDeleteEntryId(null);
  };

  const handleDeleteStudent = async () => {
    if (!confirm(t('action.confirm'))) return;
    await deleteStudent(id).unwrap();
    router.replace('/admin/students');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title={student?.fullName || 'Student'} showBack backHref="/admin/students" />
      <div className="px-4 pt-4 space-y-4">
        {student && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl font-bold text-gray-900">{student.fullName}</p>
                <p className="text-sm text-gray-500">{student.registerNumber}</p>
                <p className="text-sm text-gray-500">{student.batchId?.name}</p>
              </div>
              <Badge variant={escalationBadgeVariant(student.currentEscalationLevel)} label={t(escalationKey(student.currentEscalationLevel))} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="secondary" onClick={() => { setTransferBatch(''); setTransferOpen(true); }}>
                {t('student.transfer')}
              </Button>
              <Button size="sm" variant="danger" onClick={handleDeleteStudent}>
                {t('action.delete')}
              </Button>
            </div>
          </div>
        )}

        <h3 className="text-base font-bold text-gray-800">Entry History</h3>

        {entriesLoading ? <Spinner className="py-8" /> : entries?.length === 0 ? (
          <p className="text-center text-gray-400 py-8">{t('empty.noEntries')}</p>
        ) : (
          <div className="space-y-2">
            {entries?.map(entry => (
              <div key={entry._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{t(`remark.${entry.remarkId}`)}</p>
                    {entry.customRemark && <p className="text-sm text-gray-400 italic">"{entry.customRemark}"</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {t('admin.reportedBy')}: {entry.staffId?.fullName} ({entry.staffId?.role})
                    </p>
                    <p className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge variant={entry.severity} label={t(`severity.${entry.severity}`)} />
                </div>
                {deleteEntryId === entry._id ? (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="danger" loading={deletingEntry} onClick={() => handleDeleteEntry(entry._id)}>
                      {t('action.confirm')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteEntryId(null)}>
                      {t('action.cancel')}
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteEntryId(entry._id)}
                    className="mt-2 text-xs text-danger hover:underline"
                  >
                    {t('action.delete')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title={t('student.transfer')}>
        <div className="space-y-4">
          <select
            value={transferBatch}
            onChange={e => setTransferBatch(e.target.value)}
            className="h-12 w-full px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select batch...</option>
            {batches?.filter(b => !b.isArchived && b._id !== student?.batchId?._id).map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
          <Button size="lg" loading={transferLoading} onClick={handleTransfer} disabled={!transferBatch}>
            Confirm Transfer
          </Button>
        </div>
      </Modal>

      <AdminBottomNav />
    </div>
  );
}
