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
        // Montserrat for UI; Noto Sans Malayalam as fallback for ML script rendering
        sans: ['Montserrat', 'Noto Sans', 'Noto Sans Malayalam', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
