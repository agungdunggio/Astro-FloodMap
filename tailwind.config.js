/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a8a',
        accent: '#3b82f6',
        error: '#dc2626',
        warning: '#e65100',
        'text-primary': '#111827',
        'text-secondary': '#4b5563',
        'text-muted': '#6b7280',
        'border-muted': '#bdbdbd',
      },
    },
  },
  plugins: [require('tailwind-scrollbar')],
};