'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('dopa_theme');
    if (stored === 'dark' || stored === 'light') return stored;
  }
  return 'light';
}

const themeSlice = createSlice({
  name: 'theme',
  initialState: { current: getInitialTheme() } as { current: Theme },
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.current = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('dopa_theme', action.payload);
        const html = document.documentElement;
        if (action.payload === 'dark') html.classList.add('dark');
        else html.classList.remove('dark');
      }
    },
    toggleTheme(state) {
      const next: Theme = state.current === 'light' ? 'dark' : 'light';
      state.current = next;
      if (typeof window !== 'undefined') {
        localStorage.setItem('dopa_theme', next);
        const html = document.documentElement;
        if (next === 'dark') html.classList.add('dark');
        else html.classList.remove('dark');
      }
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
