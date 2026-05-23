'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useGetStudentByIdQuery, useUpdateStudentMutation, useDeleteStudentMutation } from '@/store/api/studentsApi';
import { useGetEntriesQuery, useDeleteEntryMutation } from '@/store/api/entriesApi';
import { useGetBatchesQuery } from '@/store/api/batchesApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { escalationBadgeVariant, escalationKey } from '@/lib/escalation';

const severityBorder: Record<string, string> = {
  high:   'border-l-danger',
  medium: 'border-l-flagged',
  low:    'border-l-success',
};

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferBatch, setTransferBatch] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [deleteEntryError, setDeleteEntryError] = useState<string | null>(null);
  const [deleteStudentError, setDeleteStudentError] = useState<string | null>(null);

  const { data: student } = useGetStudentByIdQuery(id);
  const { data: entries, isLoading: entriesLoading } = useGetEntriesQuery({ studentId: id });
  const { data: batches } = useGetBatchesQuery();
  const [updateStudent, { isLoading: transferLoading }] = useUpdateStudentMutation();
  const [deleteStudent, { isLoading: deletingStudent }] = useDeleteStudentMutation();
  const [deleteEntry, { isLoading: deletingEntry }] = useDeleteEntryMutation();

  const handleTransfer = async () => {
    if (!transferBatch) return;
    setTransferError(null);
    try {
      await updateStudent({ id, data: { batchId: transferBatch } }).unwrap();
      setTransferOpen(false);
    } catch {
      setTransferError(t('error.generic'));
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    setDeleteEntryError(null);
    try {
      await deleteEntry(entryId).unwrap();
      setDeleteEntryId(null);
    } catch {
      setDeleteEntryError(t('error.generic'));
    }
  };

  const handleDeleteStudent = async () => {
    if (!confirm(t('action.confirm'))) return;
    setDeleteStudentError(null);
    try {
      await deleteStudent(id).unwrap();
      router.replace('/admin/students');
    } catch {
      setDeleteStudentError(t('error.generic'));
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <TopBar title={student?.fullName || 'Student'} showBack backHref="/admin/students" />

      <div className="px-4 pt-4 space-y-4">
        {/* Student card */}
        {student && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card-md overflow-hidden">
            {/* Escalation level color strip */}
            <div className={`h-1.5 w-full ${student.currentEscalationLevel === 3 ? 'bg-danger' : student.currentEscalationLevel === 2 ? 'bg-flagged' : 'bg-success'}`} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold text-gray-900">{student.fullName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{student.registerNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{student.batchId?.name}</p>
                </div>
                <Badge variant={escalationBadgeVariant(student.currentEscalationLevel)} label={t(escalationKey(student.currentEscalationLevel))} />
              </div>
              <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { setTransferBatch(''); setTransferError(null); setTransferOpen(true); }}>
                    {t('student.transfer')}
                  </Button>
                  <Button size="sm" variant="danger" loading={deletingStudent} onClick={handleDeleteStudent}>
                    {t('action.delete')}
                  </Button>
                </div>
                {deleteStudentError && <p className="text-xs text-danger">{deleteStudentError}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Entry history */}
        <div>
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">{t('student.entryHistory')}</h3>

          {entriesLoading ? (
            <Spinner className="py-8" />
          ) : entries?.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 text-center">
              <p className="text-sm text-gray-400">{t('empty.noEntries')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries?.map(entry => (
                <div
                  key={entry._id}
                  className={`bg-white rounded-2xl border-l-4 border border-gray-100 shadow-card ${severityBorder[entry.severity] ?? 'border-l-gray-200'}`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{t(`remark.${entry.remarkId}`)}</p>
                        {entry.customRemark && (
                          <p className="text-xs text-gray-400 italic mt-0.5">"{entry.customRemark}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1.5">
                          {t('admin.reportedBy')}: <span className="font-medium">{entry.staffId?.fullName}</span>
                          <span className="text-gray-300 mx-1">·</span>{entry.staffId?.role}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge variant={entry.severity as any} label={t(`severity.${entry.severity}`)} />
                    </div>

                    {deleteEntryId === entry._id ? (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="danger" loading={deletingEntry} onClick={() => handleDeleteEntry(entry._id)}>
                            {t('action.confirmDelete')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setDeleteEntryId(null); setDeleteEntryError(null); }}>
                            {t('action.cancel')}
                          </Button>
                        </div>
                        {deleteEntryError && <p className="text-xs text-danger">{deleteEntryError}</p>}
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteEntryId(entry._id)}
                        className="mt-2 text-xs font-semibold text-danger hover:text-red-700 transition-colors"
                      >
                        {t('action.delete')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title={t('student.transfer')}>
        <div className="space-y-4">
          <select
            value={transferBatch}
            onChange={e => setTransferBatch(e.target.value)}
            className="h-12 w-full px-4 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm font-medium text-gray-700 bg-white"
          >
            <option value="">{t('student.selectBatch')}</option>
            {batches?.filter(b => !b.isArchived && b._id !== student?.batchId?._id).map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
          {transferError && <p className="text-sm text-danger bg-danger-bg rounded-xl px-3 py-2">{transferError}</p>}
          <Button size="lg" loading={transferLoading} onClick={handleTransfer} disabled={!transferBatch}>
            {t('action.confirmTransfer')}
          </Button>
        </div>
      </Modal>

      <AdminBottomNav />
    </div>
  );
}
