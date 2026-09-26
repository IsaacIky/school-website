import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#4B2E83',
          'purple-dark': '#3a2268',
          'purple-light': '#6b4aad',
          yellow: '#F2C200',
          'yellow-dark': '#d4a900',
          dark: '#0B1020',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
