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
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import '@/lib/i18n';

const schema = z.object({
  identifier: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const lang = useAppSelector(s => s.language.current);
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
    } catch {
      setError('root', { message: t('login.error') });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-navy to-primary-dark flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <img src="/icons/icon-512.png" alt="DEM" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-md object-cover" />
          <h1 className="text-2xl font-bold text-navy">{t('app.name')}</h1>
          <p className="text-gray-500 text-sm">Admin {t('login.title')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('login.identifier')}
            placeholder="admin@dopacoaching.com"
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
            <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{errors.root.message}</p>
          )}
          <Button type="submit" size="lg" loading={isLoading}>
            {t('login.submit')}
          </Button>
        </form>

        <div className="flex items-center justify-between pt-2">
          <Link href="/login" className="text-sm text-primary hover:underline min-h-[44px] flex items-center">
            {t('login.staffLink')}
          </Link>
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
