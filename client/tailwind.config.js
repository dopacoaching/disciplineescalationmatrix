/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
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
        'card':     '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-md':  '0 4px 12px -2px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.06)',
        'card-lg':  '0 8px 24px -4px rgba(0,0,0,0.12), 0 4px 8px -4px rgba(0,0,0,0.08)',
        'nav':      '0 -1px 0 0 rgba(0,0,0,0.06), 0 -4px 16px -4px rgba(0,0,0,0.08)',
        'topbar':   '0 1px 0 0 rgba(0,0,0,0.10), 0 4px 12px -4px rgba(0,0,0,0.16)',
        'fab':      '0 4px 16px rgba(6,174,198,0.40), 0 2px 6px rgba(6,174,198,0.20)',
        'input':    '0 1px 2px 0 rgba(0,0,0,0.05)',
      },
      borderRadius: {
        'xl':  '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
