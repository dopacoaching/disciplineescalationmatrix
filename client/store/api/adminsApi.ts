import { baseApi } from './baseApi';
import type { Admin } from '@/types';

export const adminsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdmins: builder.query<Admin[], void>({
      query: () => '/admins',
      providesTags: ['Admin'],
    }),
    createAdmin: builder.mutation<Admin, { email: string; fullName: string; username: string; password: string; isSuperAdmin: boolean; assignedBatches: string[] }>({
      query: (body) => ({ url: '/admins', method: 'POST', body }),
      invalidatesTags: ['Admin'],
    }),
    updateAdmin: builder.mutation<Admin, { id: string; data: { isActive?: boolean } }>({
      query: ({ id, data }) => ({ url: `/admins/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Admin'],
    }),
  }),
});

export const { useGetAdminsQuery, useCreateAdminMutation, useUpdateAdminMutation } = adminsApi;
