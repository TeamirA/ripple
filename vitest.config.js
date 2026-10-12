import { defineConfig } from 'vitest/config';

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? 'postgresql://localhost:5432/ripple_test';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Integration suites share one database, so run files sequentially.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
      JWT_SECRET: 'test-secret-that-is-definitely-long-enough-123',
      LOG_LEVEL: 'silent',
    },
  },
});
