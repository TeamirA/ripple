import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

// Runs during deploys: seeds the demo data on a fresh database and never touches one
// that already has users (seed.js truncates every table).
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL_UNPOOLED });

try {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.info(`Database already has ${userCount} users; skipping seed.`);
  } else {
    execFileSync(process.execPath, ['prisma/seed.js'], {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_UNPOOLED },
    });
  }
} finally {
  await prisma.$disconnect();
}
