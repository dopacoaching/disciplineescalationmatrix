'use client';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useGetBatchesQuery } from '@/store/api/batchesApi';
import { TopBar } from '@/components/ui/TopBar';
import { StaffBottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
export default function StaffDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: batches, isLoading } = useGetBatchesQuery();

  useEffect(() => {
    if (batches && batches.length === 1) {
      router.replace(`/dashboard/batch/${batches[0]._id}`);
    }
  }, [batches, router]);

  if (isLoading || (batches && batches.length === 1)) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page pb-24">
      <TopBar title={t('app.name')} />
      <div className="px-4 pt-5 space-y-3">
        {batches?.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-bsoft shadow-card p-8 text-center mt-4">
            <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{t('empty.noBatches')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('empty.contactAdmin')}</p>
          </div>
        ) : (
          batches?.map(batch => (
            <Link key={batch._id} href={`/dashboard/batch/${batch._id}`}>
              <Card className={`flex items-center justify-between ${batch.isArchived ? 'opacity-60' : ''}`}>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{batch.name}</p>
                  {batch.isArchived && (
                    <Badge variant="archived" label={t('batch.archived')} className="mt-1" />
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Card>
            </Link>
          ))
        )}
      </div>
      <StaffBottomNav />
    </div>
  );
}
