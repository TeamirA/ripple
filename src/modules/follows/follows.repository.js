import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { createdAtCursorWhere, createdAtOrderBy } from '../../utils/pagination.js';
import { USER_CARD_SELECT } from '../users/users.selects.js';

/** @returns {Promise<{ isNewFollow: boolean, followersCount: number }>} */
export function addFollow(followerId, followingId) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.follow.createMany({
      data: { followerId, followingId },
      skipDuplicates: true,
    });
    if (count === 0) {
      const { followersCount } = await tx.user.findUniqueOrThrow({
        where: { id: followingId },
        select: { followersCount: true },
      });
      return { isNewFollow: false, followersCount };
    }
    await tx.user.update({ where: { id: followerId }, data: { followingCount: { increment: 1 } } });
    const { followersCount } = await tx.user.update({
      where: { id: followingId },
      data: { followersCount: { increment: 1 } },
      select: { followersCount: true },
    });
    return { isNewFollow: true, followersCount };
  });
}

/** @returns {Promise<{ wasFollowing: boolean, followersCount: number }>} */
export function removeFollow(followerId, followingId) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.follow.deleteMany({ where: { followerId, followingId } });
    if (count === 0) {
      const { followersCount } = await tx.user.findUniqueOrThrow({
        where: { id: followingId },
        select: { followersCount: true },
      });
      return { wasFollowing: false, followersCount };
    }
    await tx.user.update({ where: { id: followerId }, data: { followingCount: { decrement: 1 } } });
    const { followersCount } = await tx.user.update({
      where: { id: followingId },
      data: { followersCount: { decrement: 1 } },
      select: { followersCount: true },
    });
    return { wasFollowing: true, followersCount };
  });
}

export function findFollowers(userId, { cursor, limit }) {
  return prisma.follow.findMany({
    where: { followingId: userId, ...createdAtCursorWhere(cursor, 'desc', 'followerId') },
    orderBy: createdAtOrderBy('desc', 'followerId'),
    take: limit + 1,
    select: { createdAt: true, follower: { select: USER_CARD_SELECT } },
  });
}

export function findFollowing(userId, { cursor, limit }) {
  return prisma.follow.findMany({
    where: { followerId: userId, ...createdAtCursorWhere(cursor, 'desc', 'followingId') },
    orderBy: createdAtOrderBy('desc', 'followingId'),
    take: limit + 1,
    select: { createdAt: true, following: { select: USER_CARD_SELECT } },
  });
}

/** Returns which of `userIds` the viewer follows, in one query for a whole page. */
export async function findFollowedIdSet(viewerId, userIds) {
  if (!viewerId || userIds.length === 0) return new Set();
  const rows = await prisma.follow.findMany({
    where: { followerId: viewerId, followingId: { in: userIds } },
    select: { followingId: true },
  });
  return new Set(rows.map((row) => row.followingId));
}

/**
 * People followed by the people `userId` follows, ranked by how many of
 * them do so ("mutual" count), excluding the user and anyone already followed.
 */
export async function findFriendsOfFriendIds(userId, limit) {
  const rows = await prisma.$queryRaw`
    SELECT f2."followingId" AS id, COUNT(*)::int AS mutuals
    FROM "Follow" f1
    JOIN "Follow" f2 ON f2."followerId" = f1."followingId"
    WHERE f1."followerId" = ${userId}
      AND f2."followingId" <> ${userId}
      AND NOT EXISTS (
        SELECT 1 FROM "Follow" mine
        WHERE mine."followerId" = ${userId} AND mine."followingId" = f2."followingId"
      )
    GROUP BY f2."followingId"
    ORDER BY mutuals DESC, f2."followingId"
    LIMIT ${limit}`;
  return rows.map((row) => row.id);
}

/** Most-followed users the viewer does not follow yet, excluding `excludeIds`. */
export async function findMostFollowedIds(viewerId, excludeIds, limit) {
  const conditions = [Prisma.sql`TRUE`];
  if (excludeIds.length) conditions.push(Prisma.sql`u.id NOT IN (${Prisma.join(excludeIds)})`);
  if (viewerId) {
    conditions.push(Prisma.sql`u.id <> ${viewerId}`);
    conditions.push(Prisma.sql`NOT EXISTS (
      SELECT 1 FROM "Follow" f WHERE f."followerId" = ${viewerId} AND f."followingId" = u.id)`);
  }

  const rows = await prisma.$queryRaw`
    SELECT u.id FROM "User" u
    WHERE ${Prisma.join(conditions, ' AND ')}
    ORDER BY u."followersCount" DESC, u.id
    LIMIT ${limit}`;
  return rows.map((row) => row.id);
}

export function findUserCardsByIds(ids) {
  return prisma.user.findMany({ where: { id: { in: ids } }, select: USER_CARD_SELECT });
}
