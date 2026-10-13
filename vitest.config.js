import { userInfo } from 'node:os';
import { defineConfig } from 'vitest/config';

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? `postgresql://${userInfo().username}@localhost:5432/ripple_test`;

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Integration suites share one database, so run files sequentially.
    fileParallelism: false,
    globalSetup: ['tests/setup/globalSetup.js'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
      DIRECT_DATABASE_URL: testDatabaseUrl,
      JWT_SECRET: 'test-secret-that-is-definitely-long-enough-123',
      LOG_LEVEL: 'silent',
    },
  },
});
