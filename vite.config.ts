import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API_PROXY_TARGET = process.env.VITE_DEV_API_PROXY ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/tests/unit/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
    },
    exclude: ['src/tests/e2e/**'],
  },
});
