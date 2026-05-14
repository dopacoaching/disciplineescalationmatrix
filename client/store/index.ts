import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice';
import languageReducer from './languageSlice';
import { baseApi } from './api/baseApi';

// Import all injected endpoints to register them
import './api/authApi';
import './api/batchesApi';
import './api/studentsApi';
import './api/entriesApi';
import './api/staffApi';
import './api/adminsApi';
import './api/dashboardApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    language: languageReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
