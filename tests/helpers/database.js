import { prisma } from '../../src/config/database.js';

export async function resetDatabase() {
  await prisma.$executeRaw`TRUNCATE "Notification", "CommentLike", "Like", "Comment", "Follow", "Post", "User" CASCADE`;
}

export function disconnectDatabase() {
  return prisma.$disconnect();
}

export { prisma };
