import { USER_SUMMARY_SELECT } from '../users/users.selects.js';

/**
 * Columns for a post card. When a viewer is known, their like (if any) is
 * loaded in the same query so `hasLiked` never costs an extra round trip per post.
 */
export function buildPostSelect(viewerId) {
  return {
    id: true,
    content: true,
    imageUrl: true,
    likesCount: true,
    commentsCount: true,
    editedAt: true,
    createdAt: true,
    author: { select: USER_SUMMARY_SELECT },
    ...(viewerId && { likes: { where: { userId: viewerId }, select: { userId: true }, take: 1 } }),
  };
}

export function toPostResponse({ likes, ...post }) {
  return { ...post, hasLiked: Boolean(likes?.length) };
}
