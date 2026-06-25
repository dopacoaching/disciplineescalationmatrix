import { baseApi } from './baseApi';
import type { Staff, Entry, StaffActivityDetail } from '@/types';

interface StaffFilters {
  search?: string;
  role?: string;
  batchId?: string;
}

interface CreateStaffPayload {
  fullName: string;
  username: string;
  password: string;
  role: 'teacher' | 'warden';
  assignedBatches?: string[];
  isCampusIncharge?: boolean;
}

interface UpdateStaffPayload {
  fullName?: string;
  username?: string;
  password?: string;
  role?: 'teacher' | 'warden';
  assignedBatches?: string[];
  isActive?: boolean;
  isCampusIncharge?: boolean;
}

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaff: builder.query<Staff[], StaffFilters>({
      query: (params) => ({ url: '/staff', params }),
      providesTags: ['Staff'],
    }),
    createStaff: builder.mutation<Staff, CreateStaffPayload>({
      query: (body) => ({ url: '/staff', method: 'POST', body }),
      invalidatesTags: ['Staff'],
    }),
    updateStaff: builder.mutation<Staff, { id: string; data: UpdateStaffPayload }>({
      query: ({ id, data }) => ({ url: `/staff/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Staff'],
    }),
    getStaffEntries: builder.query<Entry[], string>({
      query: (id) => `/staff/${id}/entries`,
      providesTags: ['Entry'],
    }),
    // Named *Detail to avoid colliding with dashboardApi's getStaffActivity,
    // which injects into the same baseApi but returns a different shape.
    getStaffActivityDetail: builder.query<StaffActivityDetail, string>({
      query: (id) => `/staff/${id}/activity`,
      providesTags: ['Entry', 'Staff'],
    }),
  }),
});

export const { useGetStaffQuery, useCreateStaffMutation, useUpdateStaffMutation, useGetStaffEntriesQuery, useGetStaffActivityDetailQuery } = staffApi;
