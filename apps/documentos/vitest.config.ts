import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-test-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-test-key',
      ENCRYPTION_KEY: 'test-master-key-32-characters!!',
    },
    coverage: {
      provider: 'v8',
      include: ['app/**/*.ts', 'lib/**/*.ts'],
      exclude: ['**/__tests__/**', 'lib/swagger.ts', 'app/api/swagger/**', 'app/docs/**'],
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
    },
  },
});
