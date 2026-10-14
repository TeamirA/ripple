import { userInfo } from 'node:os';

export const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? `postgresql://${userInfo().username}@localhost:5432/ripple_test`;
