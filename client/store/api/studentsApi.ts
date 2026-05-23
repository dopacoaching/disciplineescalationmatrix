import { baseApi } from './baseApi';
import type { PopulatedStudent } from '@/types';

interface StudentFilters {
  batchId?: string;
  search?: string;
  escalationLevel?: number;
  sort?: string;
  fromDate?: string;
  toDate?: string;
}

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<PopulatedStudent[], StudentFilters>({
      query: (params) => ({ url: '/students', params }),
      providesTags: ['Student'],
    }),
    getStudentById: builder.query<PopulatedStudent, string>({
      query: (id) => ({ url: `/students/${id}` }),
      providesTags: ['Student'],
    }),
    createStudent: builder.mutation<PopulatedStudent, { registerNumber: string; fullName: string; batchId: string }>({
      query: (body) => ({ url: '/students', method: 'POST', body }),
      invalidatesTags: ['Student'],
    }),
    updateStudent: builder.mutation<PopulatedStudent, { id: string; data: Partial<Pick<PopulatedStudent, 'fullName'> & { batchId: string }> }>({
      query: ({ id, data }) => ({ url: `/students/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Student'],
    }),
    deleteStudent: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/students/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Student', 'Entry', 'Dashboard'],
    }),
  }),
});

export const { useGetStudentsQuery, useGetStudentByIdQuery, useCreateStudentMutation, useUpdateStudentMutation, useDeleteStudentMutation } = studentsApi;
