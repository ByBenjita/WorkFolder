import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_ANON_KEY: 'anon-test-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-test-key',
      MP_ACCESS_TOKEN: 'TEST-fake-token',
      MP_CURRENCY: 'USD',
      FRONTEND_URL: 'http://localhost:3000',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/lib/swagger.ts', 'src/app/api/swagger/**', 'src/app/docs/**'],
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
