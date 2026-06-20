'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store';
import { useGetBatchesQuery, useCreateBatchMutation, useUpdateBatchMutation, useDeleteBatchMutation } from '@/store/api/batchesApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminBatchesPage() {
  const { t } = useTranslation();
  const isSuper = useAppSelector(s => s.auth.user?.isSuperAdmin) !== false;
  const { data: batches, isLoading } = useGetBatchesQuery();
  const [createBatch, { isLoading: creating }] = useCreateBatchMutation();
  const [updateBatch] = useUpdateBatchMutation();
  const [deleteBatch] = useDeleteBatchMutation();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const inputClass = 'h-11 px-3.5 rounded-2xl border border-bmedium bg-surface text-gray-800 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 text-sm font-medium placeholder-gray-400 dark:placeholder-gray-600 transition-all';

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreateError(null);
    try {
      await createBatch({ name: newName.trim() }).unwrap();
      setNewName('');
    } catch (err: any) {
      setCreateError(err?.data?.message || t('error.generic'));
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    setRenameError(null);
    try {
      await updateBatch({ id, data: { name: editName.trim() } }).unwrap();
      setEditId(null);
    } catch (err: any) {
      setRenameError(err?.data?.message || t('error.generic'));
    }
  };

  const handleArchive = async (id: string, current: boolean) => {
    setPageError(null);
    try {
      await updateBatch({ id, data: { isArchived: !current } }).unwrap();
    } catch {
      setPageError(t('error.generic'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('action.confirm'))) return;
    setPageError(null);
    try {
      await deleteBatch(id).unwrap();
    } catch (err: any) {
      setPageError(err?.data?.message || t('error.generic'));
    }
  };

  if (!isSuper) {
    return (
      <div className="min-h-screen bg-page pb-24">
        <TopBar title={t('nav.batches')} />
        <div className="px-4 pt-4">
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-10 text-center">
            <p className="text-sm text-gray-400">{t('admin.superOnly')}</p>
          </div>
        </div>
        <AdminBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={t('nav.batches')} />
      <div className="px-4 pt-4 space-y-4">
        {/* Create new */}
        <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-4">
          <p className="text-xs font-bold text-navy/60 dark:text-gray-400 uppercase tracking-wider mb-3">{t('batch.newBatch')}</p>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Batch name..."
              className={`flex-1 ${inputClass}`}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} loading={creating} size="md">{t('action.add')}</Button>
          </div>
          {createError && <p className="text-xs text-danger mt-2">{createError}</p>}
        </div>

        {pageError && <p className="text-sm text-danger bg-danger-bg rounded-xl px-3 py-2">{pageError}</p>}

        {isLoading ? <Spinner className="py-8" /> : batches?.length === 0 ? (
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-10 text-center">
            <p className="text-sm text-gray-400">{t('empty.noAdminBatches')}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card overflow-hidden">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-bsoft bg-page/50">
              <p className="flex-1 text-[10px] font-bold uppercase tracking-wider text-navy/50 dark:text-gray-500">{t('col.name')}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50 dark:text-gray-500">{t('col.status')}</p>
            </div>
            {batches?.map(batch => (
              <div
                key={batch._id}
                className={`px-4 py-3 border-b border-bsoft last:border-0 transition-opacity ${batch.isArchived ? 'opacity-60' : ''}`}
              >
                {editId === batch._id ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className={`flex-1 ${inputClass}`}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(batch._id); if (e.key === 'Escape') setEditId(null); }}
                      />
                      <Button size="sm" onClick={() => handleRename(batch._id)}>{t('action.save')}</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditId(null); setRenameError(null); }}>{t('action.cancel')}</Button>
                    </div>
                    {renameError && <p className="text-xs text-danger">{renameError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{batch.name}</p>
                      {batch.isArchived && <Badge variant="archived" label={t('batch.archived')} className="mt-0.5" />}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditId(batch._id); setEditName(batch.name); }}
                        className="text-xs font-semibold text-primary hover:underline px-2 py-1.5 rounded-lg hover:bg-primary-bg dark:hover:bg-primary/10 transition-colors"
                      >
                        {t('action.edit')}
                      </button>
                      <button
                        onClick={() => handleArchive(batch._id, batch.isArchived)}
                        className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:underline px-2 py-1.5 rounded-lg hover:bg-page transition-colors"
                      >
                        {batch.isArchived ? t('batch.unarchive') : t('batch.archive')}
                      </button>
                      <button
                        onClick={() => handleDelete(batch._id)}
                        className="text-xs font-semibold text-danger hover:underline px-2 py-1.5 rounded-lg hover:bg-danger-bg transition-colors"
                      >
                        {t('action.delete')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <AdminBottomNav />
    </div>
  );
}
