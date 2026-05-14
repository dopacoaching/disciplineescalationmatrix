'use client';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { setLanguage } from '@/store/languageSlice';
import { useTranslation } from 'react-i18next';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
}

export function TopBar({ title, showBack, backHref }: TopBarProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const lang = useAppSelector(s => s.language.current);
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
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 shadow-sm">
      {showBack && (
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 text-navy"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 text-lg font-bold text-navy truncate">{title}</h1>
      <button
        onClick={toggleLang}
        className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-bg text-primary border border-primary/30 min-h-[36px]"
        aria-label="Toggle language"
      >
        {lang === 'en' ? 'ML' : 'EN'}
      </button>
    </header>
  );
}
