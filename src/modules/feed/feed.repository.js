import { prisma } from '../../config/database.js';
import { AppError } from '../../utils/AppError.js';
import { createdAtCursorWhere, createdAtOrderBy, decodeCursor } from '../../utils/pagination.js';
import { buildPostSelect } from '../posts/posts.selects.js';

/** Posts by the viewer and everyone they follow, newest first. */
export function findFollowingFeed(viewerId, { cursor, limit }) {
  return prisma.post.findMany({
    where: {
      AND: [
        {
          OR: [
            { authorId: viewerId },
            { author: { followers: { some: { followerId: viewerId } } } },
          ],
        },
        createdAtCursorWhere(cursor),
      ],
    },
    orderBy: createdAtOrderBy(),
    take: limit + 1,
    select: buildPostSelect(viewerId),
  });
}

export function findRecentPosts({ cursor, limit }, viewerId) {
  return prisma.post.findMany({
    where: createdAtCursorWhere(cursor),
    orderBy: createdAtOrderBy(),
    take: limit + 1,
    select: buildPostSelect(viewerId),
  });
}

function likesCursorWhere(cursor) {
  const values = decodeCursor(cursor);
  if (!values) return {};
  if (!Number.isInteger(values.likesCount) || typeof values.id !== 'string') {
    throw AppError.badRequest('Invalid pagination cursor');
  }
  return {
    OR: [
      { likesCount: { lt: values.likesCount } },
      { likesCount: values.likesCount, id: { lt: values.id } },
    ],
  };
}

/** Posts published since `since`, most liked first; keyset on (likesCount, id). */
export function findTrendingPosts(since, { cursor, limit }, viewerId) {
  return prisma.post.findMany({
    where: { createdAt: { gte: since }, ...likesCursorWhere(cursor) },
    orderBy: [{ likesCount: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    select: buildPostSelect(viewerId),
  });
}
