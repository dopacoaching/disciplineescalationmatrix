'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark';

// Read localStorage once at module load — safe because this only runs in the browser
// (the store is never imported by Next.js server-side RSC code in this project).
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
    // Reducers are pure — all DOM/localStorage side-effects live in ThemeInitializer (providers.tsx)
    setTheme(state, action: PayloadAction<Theme>) {
      state.current = action.payload;
    },
    toggleTheme(state) {
      state.current = state.current === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
