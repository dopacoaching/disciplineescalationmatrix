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
import { toggleTheme } from '@/store/themeSlice';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import '@/lib/i18n';

const schema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

function SunIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.71.71M6.34 17.66l-.71.71M17.66 17.66l-.71-.71M6.34 6.34l-.71-.71M12 7a5 5 0 100 10A5 5 0 0012 7z" /></svg>;
}
function MoonIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
}

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const lang = useAppSelector(s => s.language.current);
  const theme = useAppSelector(s => s.theme.current);
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
        isCampusIncharge: user.isCampusIncharge,
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
    <main className="min-h-screen bg-brand-gradient flex flex-col items-center justify-center px-4 py-10">
      {/* Controls: language + theme */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => dispatch(toggleTheme())}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15 text-white border border-white/25 hover:bg-white/25 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button
          onClick={toggleLang}
          className="text-xs font-bold px-3.5 h-9 rounded-full bg-white/15 text-white border border-white/25 hover:bg-white/25 transition-colors"
        >
          {lang === 'en' ? 'ML' : 'EN'}
        </button>
      </div>

      {/* Branding */}
      <div className="mb-7 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-card-md overflow-hidden">
          <img src="/logo.png" alt="NERU" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-extrabold text-white tracking-wide">{t('app.name')}</h1>
        <p className="text-sm text-white/60 mt-1">{t('login.title')}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface rounded-3xl shadow-card-lg p-6 space-y-5">
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
      </div>
    </main>
  );
}
