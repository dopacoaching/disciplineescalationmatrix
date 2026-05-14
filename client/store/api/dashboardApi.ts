import { baseApi } from './baseApi';
import type { AuditLogEntry, DashboardStats, FlaggedStudent, StaffActivity } from '@/types';

interface DateRange {
  fromDate?: string;
  toDate?: string;
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, DateRange>({
      query: (params) => ({ url: '/dashboard/stats', params }),
      providesTags: ['Dashboard'],
    }),
    getFlagged: builder.query<FlaggedStudent[], DateRange>({
      query: (params) => ({ url: '/dashboard/flagged', params }),
      providesTags: ['Dashboard'],
    }),
    getStaffActivity: builder.query<StaffActivity[], DateRange>({
      query: (params) => ({ url: '/dashboard/staff-activity', params }),
      providesTags: ['Dashboard'],
    }),
    getAuditLog: builder.query<AuditLogEntry[], { limit?: number; fromDate?: string; toDate?: string; action?: string }>({
      query: (params) => ({ url: '/audit-log', params }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardStatsQuery, useGetFlaggedQuery, useGetStaffActivityQuery, useGetAuditLogQuery } = dashboardApi;
