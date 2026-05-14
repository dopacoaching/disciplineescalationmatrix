'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LanguageState {
  current: 'en' | 'ml';
}

function getInitialLang(): 'en' | 'ml' {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('dopa_lang');
    if (stored === 'ml' || stored === 'en') return stored;
  }
  return 'en';
}

const languageSlice = createSlice({
  name: 'language',
  initialState: { current: getInitialLang() } as LanguageState,
  reducers: {
    setLanguage(state, action: PayloadAction<'en' | 'ml'>) {
      state.current = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('dopa_lang', action.payload);
      }
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
