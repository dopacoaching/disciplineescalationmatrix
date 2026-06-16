/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic tokens — values come from CSS variables so they flip with dark mode
        page:     'var(--color-page)',
        surface:  'var(--color-surface)',
        surface2: 'var(--color-surface2)',
        bsoft:    'var(--color-bsoft)',
        bmedium:  'var(--color-bmedium)',
        primary: {
          DEFAULT: '#06aec6',
          dark:    '#17829e',
          bg:      '#e0f7fa',
        },
        navy: {
          DEFAULT: '#1a365d',
          light:   '#224585',
          bg:      '#e8edf5',
        },
        flagged: {
          DEFAULT: '#854F0B',
          bg:      '#FAEEDA',
        },
        danger: {
          DEFAULT: '#A32D2D',
          bg:      '#FCEBEB',
        },
        success: {
          DEFAULT: '#3B6D11',
          bg:      '#EAF3DE',
        },
        neutral: {
          DEFAULT: '#5F5E5A',
          bg:      '#F1EFE8',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'Noto Sans', 'Noto Sans Malayalam', 'sans-serif'],
      },
      boxShadow: {
        // Softer, more diffuse shadows for a calm, premium feel
        'card':     '0 1px 2px 0 rgba(16,24,40,0.04), 0 1px 3px 0 rgba(16,24,40,0.05)',
        'card-md':  '0 4px 16px -4px rgba(16,24,40,0.08), 0 2px 6px -2px rgba(16,24,40,0.05)',
        'card-lg':  '0 16px 40px -12px rgba(16,24,40,0.16), 0 6px 14px -6px rgba(16,24,40,0.08)',
        'nav':      '0 -1px 0 0 rgba(16,24,40,0.04), 0 -8px 28px -10px rgba(16,24,40,0.12)',
        'topbar':   '0 1px 0 0 rgba(16,24,40,0.04), 0 6px 20px -10px rgba(16,24,40,0.12)',
        'fab':      '0 8px 24px -4px rgba(6,174,198,0.45), 0 4px 10px -2px rgba(6,174,198,0.25)',
        'input':    '0 1px 2px 0 rgba(16,24,40,0.04)',
      },
      borderRadius: {
        'xl':  '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #1a365d 0%, #17829e 55%, #06aec6 100%)',
      },
    },
  },
  plugins: [],
};
