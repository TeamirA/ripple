import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Reuse one client across hot reloads and serverless invocations to avoid exhausting connections.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProduction ? ['error'] : ['warn', 'error'],
  });

if (!env.isProduction) globalForPrisma.prisma = prisma;
