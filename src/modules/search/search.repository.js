import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../utils/AppError.js';
import { decodeCursor } from '../../utils/pagination.js';
import { escapeLikePattern } from '../../utils/escapeLikePattern.js';
import { buildPostSelect } from '../posts/posts.selects.js';
import { USER_CARD_SELECT } from '../users/users.selects.js';

/**
 * Matches username or display name anywhere (trigram-indexed ILIKE), ranked by
 * exact username, then prefix match, then trigram similarity, then popularity.
 */
export async function searchUserIds(query, limit) {
  const contains = `%${escapeLikePattern(query)}%`;
  const prefix = `${escapeLikePattern(query)}%`;
  const rows = await prisma.$queryRaw`
    SELECT id FROM "User"
    WHERE username ILIKE ${contains} OR "displayName" ILIKE ${contains}
    ORDER BY
      (username = lower(${query})) DESC,
      (username ILIKE ${prefix} OR "displayName" ILIKE ${prefix}) DESC,
      GREATEST(similarity(username, ${query}), similarity("displayName", ${query})) DESC,
      "followersCount" DESC,
      id
    LIMIT ${limit}`;
  return rows.map((row) => row.id);
}

function postCursorCondition(cursor) {
  const values = decodeCursor(cursor);
  if (!values) return Prisma.empty;

  const createdAt = new Date(values.createdAt);
  if (Number.isNaN(createdAt.getTime()) || typeof values.id !== 'string') {
    throw AppError.badRequest('Invalid pagination cursor');
  }
  // createdAt is a UTC "timestamp without time zone", so compare against a UTC literal.
  return Prisma.sql`AND ("createdAt", id) < (CAST(${createdAt.toISOString()} AS timestamp), ${values.id})`;
}

/**
 * Keyword search over post content: English full-text matching (stemmed, so
 * "running" finds "run") plus a substring fallback for partial words. Newest first.
 */
export function searchPostKeys(query, { cursor, limit }) {
  const contains = `%${escapeLikePattern(query)}%`;
  return prisma.$queryRaw`
    SELECT id, "createdAt" FROM "Post"
    WHERE (
      to_tsvector('english', content) @@ websearch_to_tsquery('english', ${query})
      OR content ILIKE ${contains}
    ) ${postCursorCondition(cursor)}
    ORDER BY "createdAt" DESC, id DESC
    LIMIT ${limit + 1}`;
}

export function findUserCardsByIds(ids) {
  return prisma.user.findMany({ where: { id: { in: ids } }, select: USER_CARD_SELECT });
}

export function findPostsByIds(ids, viewerId) {
  return prisma.post.findMany({ where: { id: { in: ids } }, select: buildPostSelect(viewerId) });
}
