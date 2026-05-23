'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useCreateStudentMutation } from '@/store/api/studentsApi';
import { TopBar } from '@/components/ui/TopBar';
import { StaffBottomNav } from '@/components/ui/BottomNav';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  registerNumber: z.string().min(1, 'Required'),
  fullName: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

export default function AddStudentPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [createStudent, { isLoading }] = useCreateStudentMutation();

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createStudent({ ...data, batchId }).unwrap();
      router.replace(`/dashboard/batch/${batchId}`);
    } catch (err: any) {
      if (err?.data?.message?.includes('already exists')) {
        setError('registerNumber', { message: t('error.duplicateRegister') });
      } else {
        setError('root', { message: t('error.generic') });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <TopBar title={t('student.addTitle')} showBack />
      <div className="px-4 pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label={t('student.registerNumber')}
            placeholder="e.g. 2024001"
            {...register('registerNumber')}
            error={errors.registerNumber?.message}
          />
          <Input
            label={t('student.fullName')}
            placeholder="Full name"
            {...register('fullName')}
            error={errors.fullName?.message}
          />
          {errors.root && (
            <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{errors.root.message}</p>
          )}
          <Button type="submit" size="lg" loading={isLoading}>
            {t('student.save')}
          </Button>
        </form>
      </div>
      <StaffBottomNav />
    </div>
  );
}
