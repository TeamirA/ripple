import { prisma } from '../../config/database.js';
import { createdAtCursorWhere, createdAtOrderBy } from '../../utils/pagination.js';
import { buildPostSelect } from './posts.selects.js';

export function createPost({ authorId, content, imageUrl, imagePublicId }, viewerId = authorId) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: { authorId, content, imageUrl, imagePublicId },
      select: buildPostSelect(viewerId),
    });
    await tx.user.update({ where: { id: authorId }, data: { postsCount: { increment: 1 } } });
    return post;
  });
}

export function findPostById(id, viewerId) {
  return prisma.post.findUnique({ where: { id }, select: buildPostSelect(viewerId) });
}

export function findPostOwnership(id) {
  return prisma.post.findUnique({
    where: { id },
    select: { id: true, authorId: true, imagePublicId: true },
  });
}

export function updatePostContent(id, content, viewerId) {
  return prisma.post.update({
    where: { id },
    data: { content, editedAt: new Date() },
    select: buildPostSelect(viewerId),
  });
}

export function deletePost(id, authorId) {
  return prisma.$transaction([
    prisma.post.delete({ where: { id } }),
    prisma.user.update({ where: { id: authorId }, data: { postsCount: { decrement: 1 } } }),
  ]);
}

export function findPostsByAuthor(authorId, { cursor, limit }, viewerId) {
  return prisma.post.findMany({
    where: { authorId, ...createdAtCursorWhere(cursor) },
    orderBy: createdAtOrderBy(),
    take: limit + 1,
    select: buildPostSelect(viewerId),
  });
}
