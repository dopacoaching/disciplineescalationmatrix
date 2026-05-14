'use client';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export default function EntryConfirmedPage() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 space-y-6">
      <div className="w-24 h-24 rounded-full bg-success-bg flex items-center justify-center">
        <svg className="w-14 h-14 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('confirm.entryRecorded')}</h2>
        <p className="text-gray-500 mt-1">Entry has been submitted successfully</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        <Button size="lg" onClick={() => router.push('/dashboard')}>
          {t('confirm.newEntry')}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => router.back()}>
          {t('confirm.sameBatch')}
        </Button>
      </div>
    </div>
  );
}
