import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// vite 6 / vitest 2의 nested vite 타입 차이로 인한 PluginOption 충돌 회피
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reactPlugin = react() as any;

export default defineConfig({
  plugins: [reactPlugin],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: [
      'src/store/**/*.test.{ts,tsx}',
      'src/services/**/*.test.{ts,tsx}',
      'src/query-keys/**/*.test.{ts,tsx}',
      'src/router/**/*.test.{ts,tsx}',
      'src/components/**/*.test.{ts,tsx}',
      'src/utils/**/*.test.{ts,tsx}',
      'src/hooks/**/*.test.{ts,tsx}',
      'src/pages/**/*.test.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test-setup.ts', 'src/main.tsx'],
    },
  },
});
