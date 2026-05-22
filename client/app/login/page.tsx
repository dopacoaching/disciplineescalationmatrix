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
    <main className="min-h-screen bg-gradient-to-b from-navy via-navy-light to-[#17829e] flex flex-col items-center justify-center px-4 py-10">
      {/* Language toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLang}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/15 text-white border border-white/25 hover:bg-white/25 transition-colors"
        >
          {lang === 'en' ? 'ML' : 'EN'}
        </button>
      </div>

      {/* Branding */}
      <div className="mb-7 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-card-md overflow-hidden">
          <img src="/icons/icon-512.png" alt="DEM" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-xl font-extrabold text-white tracking-wide">{t('app.name')}</h1>
        <p className="text-sm text-white/60 mt-1">{t('login.title')}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-card-lg p-6 space-y-5">
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
            <div className="flex items-start gap-2.5 bg-danger-bg border border-danger/20 rounded-xl px-3.5 py-2.5">
              <svg className="w-4 h-4 text-danger shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-danger font-medium">{errors.root.message}</p>
            </div>
          )}

          <Button type="submit" size="lg" loading={isLoading}>
            {t('login.submit')}
          </Button>
        </form>

        <div className="border-t border-gray-100 pt-4 text-center">
          <a href="/admin/login" className="text-sm text-primary-dark font-semibold hover:underline">
            {t('login.adminLink')}
          </a>
        </div>
      </div>
    </main>
  );
}
