/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Crimson Pro"', '"Lora"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        parchment: {
          50: '#FAF8F5',
          100: '#F4F0E8',
          200: '#EAE3D5',
          300: '#DDD2BE',
        },
        terracotta: {
          500: '#8C5A3C',
          600: '#74482E',
          400: '#D4A373',
        },
      },
    },
  },
  plugins: [],
};
