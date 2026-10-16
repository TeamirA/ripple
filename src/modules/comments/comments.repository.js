import { prisma } from '../../config/database.js';
import { createdAtCursorWhere, createdAtOrderBy } from '../../utils/pagination.js';
import { buildCommentSelect, buildThreadSelect } from './comments.selects.js';

export function findTopLevelComments(postId, { cursor, limit }, viewerId) {
  return prisma.comment.findMany({
    where: { postId, parentId: null, ...createdAtCursorWhere(cursor, 'asc') },
    orderBy: createdAtOrderBy('asc'),
    take: limit + 1,
    select: buildThreadSelect(viewerId),
  });
}

export function findReplies(parentId, { cursor, limit }, viewerId) {
  return prisma.comment.findMany({
    where: { parentId, ...createdAtCursorWhere(cursor, 'asc') },
    orderBy: createdAtOrderBy('asc'),
    take: limit + 1,
    select: buildCommentSelect(viewerId),
  });
}

export function findCommentContext(id) {
  return prisma.comment.findUnique({
    where: { id },
    select: {
      id: true,
      postId: true,
      parentId: true,
      authorId: true,
      post: { select: { authorId: true } },
    },
  });
}

/** Inserts the comment and bumps the post (and parent) counters atomically. */
export function createComment({ postId, authorId, parentId, content }) {
  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: { postId, authorId, parentId, content },
      select: buildCommentSelect(authorId),
    });
    await tx.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } });
    if (parentId) {
      await tx.comment.update({
        where: { id: parentId },
        data: { repliesCount: { increment: 1 } },
      });
    }
    return comment;
  });
}

/** Deleting a top-level comment cascades to its replies, so the post counter drops by all of them. */
export function deleteComment({ id, postId, parentId }) {
  return prisma.$transaction(async (tx) => {
    const { repliesCount } = await tx.comment.delete({
      where: { id },
      select: { repliesCount: true },
    });
    const removedCount = parentId ? 1 : 1 + repliesCount;

    await tx.post.update({
      where: { id: postId },
      data: { commentsCount: { decrement: removedCount } },
    });
    if (parentId) {
      await tx.comment.update({
        where: { id: parentId },
        data: { repliesCount: { decrement: 1 } },
      });
    }
  });
}
