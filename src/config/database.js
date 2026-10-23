import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * Neon's pooled hosts ("-pooler") run PgBouncer in transaction mode, which Prisma
 * needs to be told about; a short connect timeout also covers serverless cold starts.
 */
export function buildDatasourceUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  if (url.hostname.includes('-pooler') && !url.searchParams.has('pgbouncer')) {
    url.searchParams.set('pgbouncer', 'true');
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '15');
  }
  return url.toString();
}

// Reuse one client across hot reloads and serverless invocations to avoid exhausting connections.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: buildDatasourceUrl(env.DATABASE_URL),
    log: env.isProduction ? ['error'] : ['warn', 'error'],
  });

if (!env.isProduction) globalForPrisma.prisma = prisma;
