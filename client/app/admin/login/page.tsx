'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAdminLoginMutation } from '@/store/api/authApi';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUser } from '@/store/authSlice';
import { setLanguage } from '@/store/languageSlice';
import { toggleTheme } from '@/store/themeSlice';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import '@/lib/i18n';

const schema = z.object({
  identifier: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

function SunIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.71.71M6.34 17.66l-.71.71M17.66 17.66l-.71-.71M6.34 6.34l-.71-.71M12 7a5 5 0 100 10A5 5 0 0012 7z" /></svg>;
}
function MoonIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
}

export default function AdminLoginPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const lang = useAppSelector(s => s.language.current);
  const theme = useAppSelector(s => s.theme.current);
  const [adminLogin, { isLoading }] = useAdminLoginMutation();

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
      const user = await adminLogin(data).unwrap();
      dispatch(setUser({ id: user.id, username: user.username, role: 'admin' }));
      router.replace('/admin/dashboard');
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
      {/* Controls: language + theme */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => dispatch(toggleTheme())}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 text-white border border-white/25 hover:bg-white/25 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
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
        <p className="text-sm text-white/60 mt-1">Admin {t('login.title')}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface rounded-3xl shadow-card-lg p-6 space-y-5">
        {/* Admin badge */}
        <div className="flex items-center gap-2 bg-navy-bg dark:bg-navy/20 rounded-xl px-3.5 py-2.5">
          <svg className="w-4 h-4 text-navy dark:text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-xs font-semibold text-navy dark:text-gray-200">{t('admin.access')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('login.identifier')}
            placeholder="Email or username"
            autoComplete="username"
            {...register('identifier')}
            error={errors.identifier?.message}
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

        <div className="border-t border-bsoft pt-4 text-center">
          <Link href="/login" className="text-sm text-primary-dark dark:text-primary font-semibold hover:underline">
            {t('login.staffLink')}
          </Link>
        </div>
      </div>
    </main>
  );
}
