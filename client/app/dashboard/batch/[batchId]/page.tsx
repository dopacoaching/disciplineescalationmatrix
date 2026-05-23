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
import { Badge } from '@/components/ui/Badge';
import { escalationBadgeVariant, escalationKey } from '@/lib/escalation';

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
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <TopBar title={batch?.name || t('batch.students')} showBack />

      <div className="px-4 pt-4 space-y-3">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or register number..."
            className="h-12 w-full pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm text-gray-900 placeholder-gray-400"
          />
        </div>

        {isLoading ? (
          <Spinner className="py-12" />
        ) : filtered?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-10 text-center">
            <p className="text-sm text-gray-400">{t('empty.noStudents')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered?.map(student => (
              <button
                key={student._id}
                onClick={() => router.push(`/dashboard/batch/${batchId}/student/${student._id}`)}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-md active:scale-[0.985] transition-all p-4 text-left flex items-center gap-3"
              >
                <div className={`w-1 self-stretch rounded-full shrink-0 ${student.currentEscalationLevel === 3 ? 'bg-danger' : student.currentEscalationLevel === 2 ? 'bg-flagged' : 'bg-success'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-sm">{student.fullName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{student.registerNumber}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={escalationBadgeVariant(student.currentEscalationLevel)} label={t(escalationKey(student.currentEscalationLevel))} />
                  <span className="text-xs text-gray-400">{student.entryCount} {t('student.entriesCount')}</span>
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
