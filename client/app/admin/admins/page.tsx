'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useGetAdminsQuery, useCreateAdminMutation, useUpdateAdminMutation } from '@/store/api/adminsApi';
import { useGetBatchesQuery } from '@/store/api/batchesApi';
import { useAppSelector } from '@/store';
import type { Admin, Batch } from '@/types';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';

const schema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8).or(z.literal('')).optional(),
  confirmPassword: z.string().optional(),
  isSuperAdmin: z.boolean(),
  assignedBatches: z.array(z.string()),
}).refine(d => (d.password || '') === (d.confirmPassword || ''), {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine(d => d.isSuperAdmin || d.assignedBatches.length > 0, {
  message: 'Assign at least one batch',
  path: ['assignedBatches'],
});
type FormData = z.infer<typeof schema>;

export default function AdminAdminsPage() {
  const { t } = useTranslation();
  const currentUser = useAppSelector(s => s.auth.user);
  // Treat undefined as super (legacy admins) — matches the server's resolution.
  const isSuper = currentUser?.isSuperAdmin !== false;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const { data: admins, isLoading } = useGetAdminsQuery(undefined, { skip: !isSuper });
  const { data: batches } = useGetBatchesQuery(undefined, { skip: !isSuper });
  const [createAdmin, { isLoading: creating }] = useCreateAdminMutation();
  const [updateAdmin, { isLoading: updating }] = useUpdateAdminMutation();

  // Only the primary admin account may edit other admins' details — everyone
  // else can still deactivate/reactivate, matching the server-side rule.
  const me = admins?.find(a => a._id === currentUser?.id);
  const canEditAdmins = me?.email?.toLowerCase() === 'it@dopacoaching.com';

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isSuperAdmin: true, assignedBatches: [] },
  });

  const superAdmin = watch('isSuperAdmin');
  const watchedBatches = watch('assignedBatches');

  const openCreate = () => {
    setEditingAdmin(null);
    reset({ fullName: '', email: '', username: '', password: '', confirmPassword: '', isSuperAdmin: true, assignedBatches: [] });
    setModalOpen(true);
  };

  const openEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    reset({
      fullName: admin.fullName || '',
      email: admin.email,
      username: admin.username,
      password: '',
      confirmPassword: '',
      isSuperAdmin: admin.isSuperAdmin,
      assignedBatches: (admin.assignedBatches as Batch[])?.map(b => typeof b === 'string' ? b : b._id) || [],
    });
    setModalOpen(true);
  };

  const toggleBatch = (batchId: string) => {
    const current = watchedBatches || [];
    setValue('assignedBatches', current.includes(batchId) ? current.filter(b => b !== batchId) : [...current, batchId]);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editingAdmin) {
        await updateAdmin({
          id: editingAdmin._id,
          data: {
            fullName: data.fullName,
            email: data.email,
            username: data.username,
            ...(data.password ? { password: data.password } : {}),
            isSuperAdmin: data.isSuperAdmin,
            assignedBatches: data.isSuperAdmin ? [] : data.assignedBatches,
          },
        }).unwrap();
      } else {
        if (!data.password) {
          setError('password', { message: t('error.passwordRequired') });
          return;
        }
        await createAdmin({
          fullName: data.fullName,
          email: data.email,
          username: data.username,
          password: data.password,
          isSuperAdmin: data.isSuperAdmin,
          assignedBatches: data.isSuperAdmin ? [] : data.assignedBatches,
        }).unwrap();
      }
      setModalOpen(false);
      reset();
    } catch (err: any) {
      setError('root', { message: err?.data?.message || t('error.generic') });
    }
  };

  const handleToggle = async (admin: Admin) => {
    if (!confirm(t('action.confirm'))) return;
    setToggleError(null);
    try {
      await updateAdmin({ id: admin._id, data: { isActive: !admin.isActive } }).unwrap();
    } catch {
      setToggleError(t('error.generic'));
    }
  };

  // Scoped admins cannot manage admins — the server rejects them too.
  if (!isSuper) {
    return (
      <div className="min-h-screen bg-page pb-24">
        <TopBar title={t('nav.admins')} />
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
      <TopBar title={t('nav.admins')} />
      <div className="px-4 pt-4 space-y-4">
        <Button onClick={openCreate} className="w-full">{t('admin.addAdmin')}</Button>

        {toggleError && <p className="text-sm text-danger bg-danger-bg rounded-xl px-3 py-2">{toggleError}</p>}

        {isLoading ? <Spinner className="py-8" /> : admins?.length === 0 ? (
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card p-10 text-center">
            <p className="text-sm text-gray-400">{t('empty.noAdmins')}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-3xl border border-bsoft shadow-card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-bsoft bg-page/50">
              <p className="flex-1 text-[10px] font-bold uppercase tracking-wider text-navy/50 dark:text-gray-500">{t('col.name')}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50 dark:text-gray-500">{t('col.status')}</p>
            </div>
            {admins?.map(admin => (
              <div
                key={admin._id}
                className={`flex items-start gap-3 px-4 py-3 border-b border-bsoft last:border-0 ${!admin.isActive ? 'opacity-60' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-navy/10 dark:bg-navy/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-navy dark:text-gray-300">{(admin.fullName || admin.username).charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{admin.fullName || admin.username}</p>
                    <Badge variant={admin.isSuperAdmin ? 'admin' : 'teacher'} label={admin.isSuperAdmin ? t('admin.super') : t('admin.scoped')} />
                    {!admin.isActive && <Badge variant="archived" label={t('action.inactive')} />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{admin.username} · {admin.email}</p>
                  {!admin.isSuperAdmin && (
                    <div className="flex flex-wrap gap-x-3 gap-y-2 mt-2.5">
                      {(admin.assignedBatches as Batch[])?.map(b => (
                        <span key={b._id} className="text-xs bg-primary-bg dark:bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{b.name}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{t('admin.joined')} {new Date(admin.createdAt).toLocaleDateString()}</p>
                </div>
                {admin._id !== currentUser?.id && (
                  <div className="flex flex-col gap-1 shrink-0">
                    {canEditAdmins && (
                      <Button size="sm" variant="secondary" onClick={() => openEdit(admin)}>
                        {t('action.edit')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={admin.isActive ? 'ghost' : 'secondary'}
                      onClick={() => handleToggle(admin)}
                    >
                      {admin.isActive ? t('action.deactivate') : t('action.reactivate')}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingAdmin ? t('admin.editAdmin') : t('admin.addAdmin')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('admin.fullName')} {...register('fullName')} error={errors.fullName?.message} />
          <Input label={t('admin.email')} type="email" {...register('email')} error={errors.email?.message} />
          <Input label={t('admin.username')} {...register('username')} error={errors.username?.message} />
          <Input
            label={t('admin.password')}
            type="password"
            placeholder={editingAdmin ? t('staff.passwordPlaceholder') : ''}
            {...register('password')}
            error={errors.password?.message}
          />
          <Input label={t('admin.confirmPassword')} type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" {...register('isSuperAdmin')} className="rounded text-primary mt-0.5" />
            <span className="text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('admin.superAdmin')}</span>
              <span className="block text-xs text-gray-400">{t('admin.superAdminHint')}</span>
            </span>
          </label>

          {!superAdmin && (
            <div>
              <label className="block text-[10px] font-bold text-navy/50 dark:text-gray-500 uppercase tracking-wider mb-2">{t('staff.batches')}</label>
              {batches?.filter(b => !b.isArchived).length === 0 ? (
                <p className="text-sm text-gray-400 italic">{t('staff.noActiveBatches')}</p>
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
                      <span className="text-sm text-gray-700 dark:text-gray-300">{b.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.assignedBatches && <p className="text-sm text-danger mt-1.5">{errors.assignedBatches.message}</p>}
            </div>
          )}

          {errors.root && (
            <p className="text-sm text-danger bg-danger-bg rounded-xl px-3 py-2">{errors.root.message}</p>
          )}
          <Button type="submit" size="lg" loading={editingAdmin ? updating : creating}>
            {editingAdmin ? t('action.save') : t('action.add')}
          </Button>
        </form>
      </Modal>

      <AdminBottomNav />
    </div>
  );
}
