'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useStaffLoginMutation } from '@/store/api/authApi';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUser } from '@/store/authSlice';
import { setLanguage } from '@/store/languageSlice';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import '@/lib/i18n';

const schema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const lang = useAppSelector(s => s.language.current);
  const [staffLogin, { isLoading }] = useStaffLoginMutation();

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const toggleLang = () => {
    const next = lang === 'en' ? 'ml' : 'en';
    dispatch(setLanguage(next));
    i18n.changeLanguage(next);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const user = await staffLogin(data).unwrap();
      dispatch(setUser({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        assignedBatches: user.assignedBatches,
      }));
      if (user.assignedBatches?.length === 1) {
        router.replace(`/dashboard/batch/${user.assignedBatches[0]}`);
      } else {
        router.replace('/dashboard');
      }
    } catch (err: any) {
      if (err?.data?.message === 'Account deactivated') {
        setError('root', { message: t('login.deactivated') });
      } else {
        setError('root', { message: t('login.error') });
      }
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-navy to-primary-dark flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <img src="/icons/icon-512.png" alt="DEM" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-md object-cover" />
          <h1 className="text-2xl font-bold text-navy">{t('app.name')}</h1>
          <p className="text-gray-500 text-sm">{t('login.title')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('login.username')}
            placeholder="your.username"
            autoComplete="username"
            {...register('username')}
            error={errors.username?.message}
          />
          <Input
            label={t('login.password')}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
            error={errors.password?.message}
          />
          {errors.root && (
            <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{errors.root.message}</p>
          )}
          <Button type="submit" size="lg" loading={isLoading}>
            {t('login.submit')}
          </Button>
        </form>

        <div className="flex justify-end pt-2">
          <button
            onClick={toggleLang}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary-bg text-primary border border-primary/20 min-h-[36px]"
          >
            {lang === 'en' ? 'ML' : 'EN'}
          </button>
        </div>
      </div>
    </main>
  );
}
