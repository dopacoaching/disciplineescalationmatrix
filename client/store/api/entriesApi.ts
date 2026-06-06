import { baseApi } from './baseApi';
import type { Entry } from '@/types';

interface EntryFilters {
  studentId?: string;
  staffId?: string;
  batchId?: string;
  fromDate?: string;
  toDate?: string;
  severity?: string;
  sort?: string;
}

export const entriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEntries: builder.query<Entry[], EntryFilters>({
      query: (params) => ({ url: '/entries', params }),
      providesTags: ['Entry'],
    }),
    createEntry: builder.mutation<Entry, { studentId: string; remarkId: string; customRemark?: string }>({
      query: (body) => ({ url: '/entries', method: 'POST', body }),
      invalidatesTags: ['Entry', 'Student', 'Dashboard'],
    }),
    deleteEntry: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/entries/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Entry', 'Student', 'Dashboard'],
    }),
  }),
});

export const { useGetEntriesQuery, useCreateEntryMutation, useDeleteEntryMutation } = entriesApi;
