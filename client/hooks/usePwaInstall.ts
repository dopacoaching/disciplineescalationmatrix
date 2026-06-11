'use client';
import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'dopa_pwa_dismissed';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);  // true = hidden by default (avoid flash)
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const standalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    setIsDismissed(localStorage.getItem(DISMISSED_KEY) === '1');

    // iPadOS 13+ reports as macOS — also check maxTouchPoints
    const ua = navigator.userAgent;
    setIsIos(
      /iphone|ipad|ipod/i.test(ua) ||
      (navigator.maxTouchPoints > 1 && /mac/i.test(ua)),
    );

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const prompt = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setIsDismissed(true);
  }, []);

  return {
    canPrompt: !!deferredPrompt,
    isIos,
    isStandalone,
    isDismissed,
    shouldShow: !isStandalone && !isDismissed && (!!deferredPrompt || isIos),
    prompt,
    dismiss,
  };
}
