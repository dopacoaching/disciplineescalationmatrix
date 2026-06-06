'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}
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
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

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

  const handleExport = async (format: 'pdf' | 'excel') => {
    setDownloading(format);
    setExportError(null);
    try {
      const params = new URLSearchParams({ format, studentId: id });
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const name = student?.fullName?.replace(/\s+/g, '-') || id;
      await downloadFile(`/api/entries/export?${params}`, `entries-${name}.${ext}`);
    } catch {
      setExportError(t('export.failed'));
    } finally {
      setDownloading(null);
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
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={student?.fullName || 'Student'} showBack backHref="/admin/students" />

      <div className="px-4 pt-4 space-y-4">
        {/* Student card */}
        {student && (
          <div className="bg-surface rounded-2xl border border-bsoft shadow-card-md overflow-hidden">
            <div className={`h-1.5 w-full ${student.currentEscalationLevel === 3 ? 'bg-danger' : student.currentEscalationLevel === 2 ? 'bg-flagged' : 'bg-success'}`} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-gray-100">{student.fullName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{student.registerNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{student.batchId?.name}</p>
                </div>
                <Badge variant={escalationBadgeVariant(student.currentEscalationLevel)} label={t(escalationKey(student.currentEscalationLevel))} />
              </div>
              <div className="pt-3 mt-3 border-t border-bsoft space-y-2">
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
          <h3 className="text-sm font-bold text-navy dark:text-gray-200 uppercase tracking-wider mb-3">{t('student.entryHistory')}</h3>

          {(entries?.length ?? 0) > 0 && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleExport('pdf')}
                disabled={!!downloading}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border-2 border-danger/30 bg-danger/5 text-danger text-xs font-semibold hover:bg-danger/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {downloading === 'pdf' ? t('export.downloading') : (
                  <>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    {t('export.pdf')}
                  </>
                )}
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={!!downloading}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {downloading === 'excel' ? t('export.downloading') : (
                  <>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('export.excel')}
                  </>
                )}
              </button>
            </div>
          )}
          {exportError && <p className="text-xs text-danger bg-danger-bg rounded-xl px-3 py-2 mb-3">{exportError}</p>}

          {entriesLoading ? (
            <Spinner className="py-8" />
          ) : entries?.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-bsoft shadow-card p-8 text-center">
              <p className="text-sm text-gray-400">{t('empty.noEntries')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries?.map(entry => (
                <div
                  key={entry._id}
                  className={`bg-surface rounded-2xl border-l-4 border border-bsoft shadow-card ${severityBorder[entry.severity] ?? 'border-l-gray-200'}`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t(`remark.${entry.remarkId}`)}</p>
                        {entry.customRemark && (
                          <p className="text-xs text-gray-400 italic mt-0.5">"{entry.customRemark}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1.5">
                          {t('admin.reportedBy')}: <span className="font-medium text-gray-600 dark:text-gray-300">{entry.staffId?.fullName}</span>
                          <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>{entry.staffId?.role}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge variant={entry.severity as any} label={t(`severity.${entry.severity}`)} />
                    </div>

                    {deleteEntryId === entry._id ? (
                      <div className="mt-3 pt-3 border-t border-bsoft space-y-2">
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
            className="h-12 w-full px-4 rounded-xl border-2 border-bmedium bg-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm font-medium"
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
