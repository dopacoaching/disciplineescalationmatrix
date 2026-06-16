'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePwaInstall } from '@/hooks/usePwaInstall';

function ShareIcon() {
  return (
    <svg className="w-5 h-5 inline-block align-text-bottom" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function IosShareIcon() {
  // iOS Share sheet arrow-up icon
  return (
    <svg className="w-4 h-4 inline-block align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 11V6.5M9 6.5L6.5 9M9 6.5L11.5 9M15 13h1a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4a2 2 0 012-2h1" />
    </svg>
  );
}

function AddBoxIcon() {
  return (
    <svg className="w-4 h-4 inline-block align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IosInstructionSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full bg-surface rounded-t-3xl border-t border-bsoft shadow-2xl p-6 pb-10 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-bmedium" />

        <div className="text-center pt-2">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl overflow-hidden border border-bsoft shadow">
            <img src="/icons/icon-192.png" alt="App icon" className="w-full h-full object-cover" />
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100">{t('pwa.iosTitle')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('pwa.iosSubtitle')}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-page rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-sm">1</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('pwa.iosStep1a')} <span className="inline-flex items-center gap-1 font-semibold text-primary"><IosShareIcon /> {t('pwa.iosStep1b')}</span> {t('pwa.iosStep1c')}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-page rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-sm">2</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('pwa.iosStep2a')} <span className="inline-flex items-center gap-1 font-semibold"><AddBoxIcon /> {t('pwa.iosStep2b')}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 bg-page rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-sm">3</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{t('pwa.iosStep3')}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full h-12 rounded-2xl bg-primary text-white font-bold text-sm"
        >
          {t('action.done')}
        </button>
      </div>
    </div>
  );
}

export function PwaInstallBanner() {
  const { t } = useTranslation();
  const { shouldShow, canPrompt, isIos, prompt, dismiss } = usePwaInstall();
  const [showIosSheet, setShowIosSheet] = useState(false);

  if (!shouldShow) return null;

  const handleInstall = async () => {
    if (isIos) {
      setShowIosSheet(true);
    } else {
      await prompt();
    }
  };

  return (
    <>
      {/* Banner floating above bottom nav */}
      <div className="fixed bottom-[68px] left-3 right-3 z-20 flex items-center gap-3 glass border border-bsoft rounded-3xl shadow-card-md px-4 py-3 animate-fade-in-up">
        <img src="/icons/icon-192.png" alt="" className="w-9 h-9 rounded-xl shrink-0 border border-bsoft" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">{t('pwa.bannerTitle')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t('pwa.bannerSubtitle')}</p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 h-9 px-4 rounded-full bg-primary text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all"
        >
          {t('pwa.install')}
        </button>
        <button
          onClick={dismiss}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-page active:bg-page transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {showIosSheet && (
        <IosInstructionSheet onClose={() => { setShowIosSheet(false); dismiss(); }} />
      )}
    </>
  );
}
