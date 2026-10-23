import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './tests/setup/testDatabaseUrl.js';

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
      DATABASE_URL_UNPOOLED: testDatabaseUrl,
      JWT_SECRET: 'test-secret-that-is-definitely-long-enough-123',
      LOG_LEVEL: 'silent',
    },
  },
});
