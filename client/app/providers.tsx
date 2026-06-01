'use client';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import '@/lib/i18n';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUser, clearUser } from '@/store/authSlice';
import { setLanguage } from '@/store/languageSlice';
import { setTheme } from '@/store/themeSlice';
import { useMeQuery } from '@/store/api/authApi';
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

  // Guard: prevent a second redirect from firing while the first navigation is still
  // in-flight. Without this, rapid state updates (isError → resetApiState → re-render)
  // can cause duplicate router.replace calls and an infinite render cascade.
  const redirectingRef = useRef(false);

  // If pathname is null (SSR / initial hydration transition), treat as public to avoid
  // making /me requests before the route is known.
  const isPublic = !pathname || PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  // refetchOnMountOrArgChange: true ensures a fresh /me request fires every time the
  // user navigates from a public page to a protected one — even if there is a stale
  // cached error result. This replaces the previous resetApiState() approach which
  // cleared the entire RTK cache and caused an infinite re-render cascade:
  //   isError → redirect → resetApiState → query re-fires → isError → redirect …
  const { data, isLoading, isError } = useMeQuery(undefined, {
    skip: isPublic,
    refetchOnMountOrArgChange: true,
  });

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

  // When landing on a public page: clear auth state and reset the redirect guard.
  // Do NOT call resetApiState() here — it clears active query subscriptions mid-flight
  // and causes the cascade loop described above.
  useEffect(() => {
    if (!isPublic) return;
    redirectingRef.current = false;
    dispatch(clearUser());
  }, [isPublic, dispatch]);

  // Sync auth state from /me response on protected pages
  useEffect(() => {
    if (isPublic || isLoading) return;

    if (isError) {
      // Only redirect once per auth failure — guard against the effect firing
      // a second time while the router.replace navigation is still pending.
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      dispatch(clearUser());
      const isAdmin = pathname ? pathname.startsWith('/admin') : false;
      router.replace(isAdmin ? '/admin/login' : '/login');
    } else if (data) {
      redirectingRef.current = false;
      dispatch(setUser({
        id: data._id || data.id,
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        assignedBatches: data.assignedBatches,
      }));
    }
  }, [data, isLoading, isError, isPublic, dispatch, pathname, router]);

  // Block protected-page content until /me resolves.
  // Block on isError too so child queries don't fire before the redirect runs.
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
