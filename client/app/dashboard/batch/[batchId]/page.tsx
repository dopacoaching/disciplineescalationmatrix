'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useGetStudentsQuery } from '@/store/api/studentsApi';
import { useGetBatchesQuery } from '@/store/api/batchesApi';
import { TopBar } from '@/components/ui/TopBar';
import { StaffBottomNav } from '@/components/ui/BottomNav';
import { FAB } from '@/components/ui/FAB';
import { Spinner } from '@/components/ui/Spinner';

export default function BatchStudentList() {
  const { batchId } = useParams<{ batchId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: batches } = useGetBatchesQuery();
  const { data: students, isLoading } = useGetStudentsQuery({ batchId });

  const batch = batches?.find(b => b._id === batchId);
  const filtered = students?.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.registerNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title={batch?.name || t('batch.students')} showBack />

      <div className="px-4 pt-4 space-y-3">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or register number..."
          className="h-12 w-full px-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {isLoading ? (
          <Spinner className="py-12" />
        ) : filtered?.length === 0 ? (
          <p className="text-center text-gray-400 py-12">{t('empty.noStudents')}</p>
        ) : (
          <div className="space-y-2">
            {filtered?.map(student => (
              <button
                key={student._id}
                onClick={() => router.push(`/dashboard/batch/${batchId}/student/${student._id}`)}
                className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left flex items-center justify-between active:scale-[0.99] transition-transform"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{student.fullName}</p>
                  <p className="text-sm text-gray-500">{student.registerNumber}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!batch?.isArchived && (
        <FAB onClick={() => router.push(`/dashboard/batch/${batchId}/add-student`)} label={t('student.addTitle')} />
      )}
      <StaffBottomNav />
    </div>
  );
}
