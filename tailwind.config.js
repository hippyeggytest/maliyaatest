/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        tajawal: ['Tajawal', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f9f2f2',
          100: '#f2e5e5',
          200: '#e6cccc',
          300: '#d9b3b3',
          400: '#cc9999',
          500: '#bf8080',
          600: '#a64d4d',
          700: '#800000', // Maroon
          800: '#660000',
          900: '#4d0000',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
      },
    },
  },
  plugins: [],
};
 