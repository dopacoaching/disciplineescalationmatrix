'use client';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { setLanguage } from '@/store/languageSlice';
import { toggleTheme } from '@/store/themeSlice';
import { useTranslation } from 'react-i18next';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
}

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.71.71M6.34 17.66l-.71.71M17.66 17.66l-.71-.71M6.34 6.34l-.71-.71M12 7a5 5 0 100 10A5 5 0 0012 7z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

export function TopBar({ title, showBack, backHref }: TopBarProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const lang = useAppSelector(s => s.language.current);
  const theme = useAppSelector(s => s.theme.current);
  const { i18n } = useTranslation();

  const toggleLang = () => {
    const next = lang === 'en' ? 'ml' : 'en';
    dispatch(setLanguage(next));
    i18n.changeLanguage(next);
  };

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <header className="glass sticky top-0 z-40 border-b border-bsoft px-4 h-16 flex items-center gap-2">
      {showBack && (
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 -ml-1 rounded-full text-navy dark:text-gray-200 hover:bg-surface2 active:bg-bmedium transition-colors shrink-0"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 text-[17px] font-bold text-navy dark:text-gray-100 truncate tracking-tight">{title}</h1>

      {/* Theme toggle */}
      <button
        onClick={() => dispatch(toggleTheme())}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-surface2 text-navy/70 dark:text-gray-300 border border-bmedium hover:bg-bmedium active:scale-95 transition-all shrink-0"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="text-[11px] font-bold px-3 h-9 rounded-full bg-surface2 text-navy/70 dark:text-gray-300 border border-bmedium hover:bg-bmedium active:scale-95 transition-all shrink-0"
        aria-label="Toggle language"
      >
        {lang === 'en' ? 'ML' : 'EN'}
      </button>
    </header>
  );
}
