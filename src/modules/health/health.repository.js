import { prisma } from '../../config/database.js';

export async function pingDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}
