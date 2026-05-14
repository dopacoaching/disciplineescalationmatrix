import { baseApi } from './baseApi';
import type { Batch } from '@/types';

export const batchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBatches: builder.query<Batch[], void>({
      query: () => '/batches',
      providesTags: ['Batch'],
    }),
    createBatch: builder.mutation<Batch, { name: string }>({
      query: (body) => ({ url: '/batches', method: 'POST', body }),
      invalidatesTags: ['Batch'],
    }),
    updateBatch: builder.mutation<Batch, { id: string; data: Partial<Pick<Batch, 'name' | 'isArchived'>> }>({
      query: ({ id, data }) => ({ url: `/batches/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Batch'],
    }),
    deleteBatch: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/batches/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Batch'],
    }),
  }),
});

export const { useGetBatchesQuery, useCreateBatchMutation, useUpdateBatchMutation, useDeleteBatchMutation } = batchesApi;
