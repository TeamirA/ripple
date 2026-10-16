import { USER_SUMMARY_SELECT } from '../users/users.selects.js';

export const REPLY_PREVIEW_LIMIT = 3;

export function buildCommentSelect(viewerId) {
  return {
    id: true,
    postId: true,
    parentId: true,
    content: true,
    likesCount: true,
    repliesCount: true,
    createdAt: true,
    author: { select: USER_SUMMARY_SELECT },
    ...(viewerId && { likes: { where: { userId: viewerId }, select: { userId: true }, take: 1 } }),
  };
}

/** Top-level comments also carry the first few replies so threads render in one request. */
export function buildThreadSelect(viewerId) {
  const commentSelect = buildCommentSelect(viewerId);
  return {
    ...commentSelect,
    replies: {
      select: commentSelect,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: REPLY_PREVIEW_LIMIT,
    },
  };
}

export function toCommentResponse({ likes, replies, ...comment }) {
  return {
    ...comment,
    hasLiked: Boolean(likes?.length),
    ...(replies && { replies: replies.map(toCommentResponse) }),
  };
}
