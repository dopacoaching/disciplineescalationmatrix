'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useGetStaffQuery, useCreateStaffMutation, useUpdateStaffMutation } from '@/store/api/staffApi';
import { useGetBatchesQuery } from '@/store/api/batchesApi';
import type { Staff, Batch } from '@/types';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';

// Used for both create and edit — password is optional to allow "keep existing" on edit.
// Required-on-create is enforced in onSubmit.
const schema = z.object({
  fullName: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(8).or(z.literal('')).optional(),
  role: z.enum(['teacher', 'warden']),
  assignedBatches: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

export default function AdminStaffPage() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const { data: staff, isLoading } = useGetStaffQuery({});
  const { data: batches } = useGetBatchesQuery();
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: updating }] = useUpdateStaffMutation();

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'teacher', assignedBatches: [] },
  });

  const openCreate = () => {
    setEditingStaff(null);
    reset({ fullName: '', username: '', password: '', role: 'teacher', assignedBatches: [] });
    setModalOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditingStaff(s);
    reset({
      fullName: s.fullName,
      username: s.username,
      password: '',
      role: s.role,
      assignedBatches: (s.assignedBatches as Batch[])?.map(b => b._id) || [],
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editingStaff) {
        const { password, ...rest } = data;
        await updateStaff({ id: editingStaff._id, data: password ? { ...rest, password } : rest }).unwrap();
      } else {
        if (!data.password) {
          setError('password', { message: 'Password is required' });
          return;
        }
        await createStaff({ ...data, password: data.password }).unwrap();
      }
      setModalOpen(false);
    } catch (err: any) {
      setError('root', { message: err?.data?.message || t('error.generic') });
    }
  };

  const handleToggleActive = async (s: Staff) => {
    if (!confirm(t('action.confirm'))) return;
    try {
      await updateStaff({ id: s._id, data: { isActive: !s.isActive } }).unwrap();
    } catch {
      alert(t('error.generic'));
    }
  };

  const watchedBatches = watch('assignedBatches');

  const toggleBatch = (batchId: string) => {
    const current = watchedBatches || [];
    if (current.includes(batchId)) {
      setValue('assignedBatches', current.filter(b => b !== batchId));
    } else {
      setValue('assignedBatches', [...current, batchId]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <TopBar title={t('nav.staff')} />
      <div className="px-4 pt-4 space-y-4">
        <Button onClick={openCreate} className="w-full">{t('staff.addStaff')}</Button>

        {isLoading ? <Spinner className="py-8" /> : (
          <div className="space-y-2">
            {staff?.map(s => (
              <div
                key={s._id}
                className={`bg-white rounded-2xl border border-gray-100 shadow-card p-4 ${!s.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-primary">{s.fullName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{s.fullName}</p>
                        <Badge variant={s.role} label={s.role} />
                        {!s.isActive && <Badge variant="archived" label="Inactive" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">@{s.username}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.entryCount} entries</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(s.assignedBatches as Batch[])?.map(b => (
                          <span key={b._id} className="text-xs bg-primary-bg text-primary px-2 py-0.5 rounded-full font-medium">{b.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>{t('action.edit')}</Button>
                    <Button size="sm" variant={s.isActive ? 'ghost' : 'secondary'} onClick={() => handleToggleActive(s)}>
                      {s.isActive ? t('action.deactivate') : t('action.reactivate')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingStaff ? 'Edit Staff' : t('staff.addStaff')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('staff.fullName')} {...register('fullName')} error={errors.fullName?.message} />
          <Input label={t('staff.username')} {...register('username')} error={errors.username?.message} />
          <Input
            label={t('staff.password')}
            type="password"
            placeholder={editingStaff ? 'Leave blank to keep current' : ''}
            {...register('password')}
            error={errors.password?.message}
          />
          <div>
            <label className="block text-[10px] font-bold text-navy/50 uppercase tracking-wider mb-2">{t('staff.role')}</label>
            <div className="flex gap-3">
              {(['teacher', 'warden'] as const).map(role => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={role} {...register('role')} className="text-primary" />
                  <span className="text-sm font-medium text-gray-700">{t(`staff.role.${role}`)}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-navy/50 uppercase tracking-wider mb-2">{t('staff.batches')}</label>
            {batches?.filter(b => !b.isArchived).length === 0 ? (
              <p className="text-sm text-gray-400 italic">No active batches available.</p>
            ) : (
              <div className="space-y-2">
                {batches?.filter(b => !b.isArchived).map(b => (
                  <label key={b._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={watchedBatches?.includes(b._id)}
                      onChange={() => toggleBatch(b._id)}
                      className="rounded text-primary"
                    />
                    <span className="text-sm text-gray-700">{b.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {errors.root && (
            <p className="text-sm text-danger bg-danger-bg rounded-xl px-3 py-2">{errors.root.message}</p>
          )}
          <Button type="submit" size="lg" loading={creating || updating}>
            {editingStaff ? t('action.save') : t('action.add')}
          </Button>
        </form>
      </Modal>

      <AdminBottomNav />
    </div>
  );
}
