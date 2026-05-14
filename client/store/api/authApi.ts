import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    adminLogin: builder.mutation<any, { identifier: string; password: string }>({
      query: (body) => ({ url: '/auth/admin-login', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    staffLogin: builder.mutation<any, { username: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      // No invalidatesTags — caller resets the entire cache via baseApi.util.resetApiState()
      // so no in-flight refetch of /me happens after the cookie is cleared
    }),
    me: builder.query<any, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
  }),
});

export const { useAdminLoginMutation, useStaffLoginMutation, useLogoutMutation, useMeQuery } = authApi;
