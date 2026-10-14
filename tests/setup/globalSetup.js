import { execSync } from 'node:child_process';
import { testDatabaseUrl } from './testDatabaseUrl.js';

/** Brings the test database schema up to date once before any suite runs. */
export default function setup() {
  execSync('npx prisma migrate deploy', {
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: testDatabaseUrl, DIRECT_DATABASE_URL: testDatabaseUrl },
  });
}
