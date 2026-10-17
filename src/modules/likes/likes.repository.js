import { prisma } from '../../config/database.js';

/**
 * Builds idempotent like/unlike operations for a likeable model. The insert uses
 * ON CONFLICT DO NOTHING, so concurrent double-clicks can never double count.
 */
function createLikeOperations({ likeModel, targetModel, targetKey }) {
  async function applyCounterChange(tx, targetId, change) {
    if (change === 0) {
      return tx[targetModel].findUniqueOrThrow({
        where: { id: targetId },
        select: { likesCount: true },
      });
    }
    return tx[targetModel].update({
      where: { id: targetId },
      data: { likesCount: { increment: change } },
      select: { likesCount: true },
    });
  }

  return {
    /** @returns {Promise<{ likesCount: number, isNewLike: boolean }>} */
    add: (userId, targetId) =>
      prisma.$transaction(async (tx) => {
        const { count } = await tx[likeModel].createMany({
          data: { userId, [targetKey]: targetId },
          skipDuplicates: true,
        });
        const { likesCount } = await applyCounterChange(tx, targetId, count);
        return { likesCount, isNewLike: count === 1 };
      }),

    /** @returns {Promise<{ likesCount: number, wasLiked: boolean }>} */
    remove: (userId, targetId) =>
      prisma.$transaction(async (tx) => {
        const { count } = await tx[likeModel].deleteMany({
          where: { userId, [targetKey]: targetId },
        });
        const { likesCount } = await applyCounterChange(tx, targetId, -count);
        return { likesCount, wasLiked: count === 1 };
      }),
  };
}

const postLikes = createLikeOperations({
  likeModel: 'like',
  targetModel: 'post',
  targetKey: 'postId',
});
const commentLikes = createLikeOperations({
  likeModel: 'commentLike',
  targetModel: 'comment',
  targetKey: 'commentId',
});

export const addPostLike = postLikes.add;
export const removePostLike = postLikes.remove;
export const addCommentLike = commentLikes.add;
export const removeCommentLike = commentLikes.remove;
