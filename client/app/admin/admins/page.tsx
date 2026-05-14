'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useGetAdminsQuery, useCreateAdminMutation, useUpdateAdminMutation } from '@/store/api/adminsApi';
import { useAppSelector } from '@/store';
import type { Admin } from '@/types';
import { TopBar } from '@/components/ui/TopBar';
import { AdminBottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';

const schema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function AdminAdminsPage() {
  const { t } = useTranslation();
  const currentUser = useAppSelector(s => s.auth.user);
  const [modalOpen, setModalOpen] = useState(false);
  const { data: admins, isLoading } = useGetAdminsQuery();
  const [createAdmin, { isLoading: creating }] = useCreateAdminMutation();
  const [updateAdmin] = useUpdateAdminMutation();

  const { register, handleSubmit, formState: { errors }, reset, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createAdmin({ email: data.email, username: data.username, password: data.password }).unwrap();
      setModalOpen(false);
      reset();
    } catch (err: any) {
      setError('root', { message: err?.data?.message || t('error.generic') });
    }
  };

  const handleToggle = async (admin: Admin) => {
    if (!confirm(t('action.confirm'))) return;
    try {
      await updateAdmin({ id: admin._id, data: { isActive: !admin.isActive } }).unwrap();
    } catch {
      alert(t('error.generic'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title={t('nav.admins')} />
      <div className="px-4 pt-4 space-y-3">
        <Button onClick={() => setModalOpen(true)} className="w-full">{t('admin.addAdmin')}</Button>

        {isLoading ? <Spinner className="py-8" /> : (
          <div className="space-y-2">
            {admins?.map(admin => (
              <div key={admin._id} className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between ${!admin.isActive ? 'opacity-60' : ''}`}>
                <div>
                  <p className="font-semibold text-gray-900">@{admin.username}</p>
                  <p className="text-sm text-gray-500">{admin.email}</p>
                  <p className="text-xs text-gray-400">Joined {new Date(admin.createdAt).toLocaleDateString()}</p>
                  {!admin.isActive && <span className="text-xs text-danger">Inactive</span>}
                </div>
                {admin._id !== currentUser?.id && (
                  <Button
                    size="sm"
                    variant={admin.isActive ? 'ghost' : 'secondary'}
                    onClick={() => handleToggle(admin)}
                  >
                    {admin.isActive ? t('action.deactivate') : t('action.reactivate')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('admin.addAdmin')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('admin.email')} type="email" {...register('email')} error={errors.email?.message} />
          <Input label={t('admin.username')} {...register('username')} error={errors.username?.message} />
          <Input label={t('admin.password')} type="password" {...register('password')} error={errors.password?.message} />
          <Input label={t('admin.confirmPassword')} type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
          {errors.root && (
            <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{errors.root.message}</p>
          )}
          <Button type="submit" size="lg" loading={creating}>{t('action.add')}</Button>
        </form>
      </Modal>

      <AdminBottomNav />
    </div>
  );
}
