'use client';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import '@/lib/i18n';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUser, clearUser } from '@/store/authSlice';
import { setLanguage } from '@/store/languageSlice';
import { setTheme } from '@/store/themeSlice';
import { useMeQuery } from '@/store/api/authApi';
import { baseApi } from '@/store/api/baseApi';
import { useTranslation } from 'react-i18next';

// Public paths where no session exists yet — skip /me entirely to avoid 401 noise
const PUBLIC_PATHS = ['/', '/login', '/admin/login', '/offline'];

function ThemeInitializer() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(s => s.theme.current);

  // On first mount, read localStorage and sync Redux state if it differs from the
  // slice's own initialState read (handles SSR hydration edge cases).
  useEffect(() => {
    const stored = localStorage.getItem('dopa_theme') as 'light' | 'dark' | null;
    if (stored && stored !== theme) dispatch(setTheme(stored));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // All DOM/localStorage side-effects live here — reducers are kept pure.
  useEffect(() => {
    localStorage.setItem('dopa_theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  return null;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const { i18n } = useTranslation();
  const lang = useAppSelector(s => s.language.current);

  // If pathname is null (e.g. server-side or during initial client hydration/routing transitions),
  // default to isPublic=true to prevent making /me API requests before the route is ready.
  const isPublic = !pathname || PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  const { data, isLoading, isError } = useMeQuery(undefined, { skip: isPublic });

  // Restore language preference from localStorage once on mount
  useEffect(() => {
    const stored = localStorage.getItem('dopa_lang') as 'en' | 'ml' | null;
    if (stored) {
      dispatch(setLanguage(stored));
      i18n.changeLanguage(stored);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep i18n in sync with Redux language state
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  // When landing on a public page, wipe auth + RTK Query cache so the next
  // protected-page visit always re-fetches /me with isLoading=true (gate blocks).
  useEffect(() => {
    if (!isPublic) return;
    dispatch(clearUser());
    dispatch(baseApi.util.resetApiState());
  }, [isPublic, dispatch]);

  // Sync auth state from /me response on protected pages
  useEffect(() => {
    if (isPublic || isLoading) return;
    if (isError) {
      dispatch(clearUser());
      const isAdmin = pathname ? pathname.startsWith('/admin') : false;
      router.replace(isAdmin ? '/admin/login' : '/login');
    } else if (data) {
      dispatch(setUser({
        id: data._id || data.id,
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        assignedBatches: data.assignedBatches,
      }));
    }
  }, [data, isLoading, isError, isPublic, dispatch, pathname, router]);

  // Block protected pages until /me resolves successfully.
  // Also block on isError so dashboard queries don't fire before the redirect effect runs.
  if (!isPublic && (isLoading || isError)) return null;

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeInitializer />
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
