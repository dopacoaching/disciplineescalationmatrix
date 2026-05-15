'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetBatchesQuery, useCreateBatchMutation, useUpdateBatchMutation, useDeleteBatchMutation } from '@/store/api/batchesApi';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminBatchesPage() {
  const { t } = useTranslation();
  const { data: batches, isLoading } = useGetBatchesQuery();
  const [createBatch, { isLoading: creating }] = useCreateBatchMutation();
  const [updateBatch] = useUpdateBatchMutation();
  const [deleteBatch] = useDeleteBatchMutation();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createBatch({ name: newName.trim() }).unwrap();
      setNewName('');
    } catch (err: any) {
      alert(err?.data?.message || t('error.generic'));
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateBatch({ id, data: { name: editName.trim() } }).unwrap();
      setEditId(null);
    } catch (err: any) {
      alert(err?.data?.message || t('error.generic'));
    }
  };

  const handleArchive = async (id: string, current: boolean) => {
    try {
      await updateBatch({ id, data: { isArchived: !current } }).unwrap();
    } catch {
      alert(t('error.generic'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('action.confirm'))) return;
    try {
      await deleteBatch(id).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || t('error.generic'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title={t('nav.batches')} />
      <div className="px-4 pt-4 space-y-4">
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New batch name..."
            className="flex-1 h-12 px-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} loading={creating}>{t('batch.newBatch')}</Button>
        </div>

        {isLoading ? <Spinner className="py-8" /> : (
          <div className="space-y-2">
            {batches?.map(batch => (
              <div key={batch._id} className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 ${batch.isArchived ? 'opacity-70' : ''}`}>
                {editId === batch._id ? (
                  <div className="flex gap-2">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleRename(batch._id)}>{t('action.save')}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>{t('action.cancel')}</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{batch.name}</p>
                      {batch.isArchived && <Badge variant="archived" label={t('batch.archived')} className="mt-1" />}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditId(batch._id); setEditName(batch.name); }}
                        className="text-xs text-primary hover:underline px-2 py-1"
                      >
                        {t('action.edit')}
                      </button>
                      <button
                        onClick={() => handleArchive(batch._id, batch.isArchived)}
                        className="text-xs text-gray-500 hover:underline px-2 py-1"
                      >
                        {batch.isArchived ? t('batch.unarchive') : t('batch.archive')}
                      </button>
                      <button
                        onClick={() => handleDelete(batch._id)}
                        className="text-xs text-danger hover:underline px-2 py-1"
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
