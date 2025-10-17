import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './public/index.html', './src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          500: '#38bdf8',
        },
      },
    },
  },
  plugins: [],
};

export default config;
