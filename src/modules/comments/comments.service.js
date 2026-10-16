import { AppError } from '../../utils/AppError.js';
import { buildPage } from '../../utils/pagination.js';
import * as postsRepository from '../posts/posts.repository.js';
import * as commentsRepository from './comments.repository.js';
import { toCommentResponse } from './comments.selects.js';

function toCommentPage(rows, limit) {
  const page = buildPage(rows, limit);
  return { ...page, data: page.data.map(toCommentResponse) };
}

async function assertPostExists(postId) {
  const post = await postsRepository.findPostOwnership(postId);
  if (!post) throw AppError.notFound('Post not found');
  return post;
}

/**
 * Threads are one level deep: replying to a reply attaches to its top-level parent.
 * @returns {Promise<string | null>} the effective parent id
 */
async function resolveParentId(postId, parentId) {
  if (!parentId) return null;

  const parent = await commentsRepository.findCommentContext(parentId);
  if (!parent || parent.postId !== postId) {
    throw AppError.validation([{ field: 'body.parentId', message: 'Parent comment not found' }]);
  }
  return parent.parentId ?? parent.id;
}

export async function listComments(postId, pagination, viewerId) {
  await assertPostExists(postId);
  const rows = await commentsRepository.findTopLevelComments(postId, pagination, viewerId);
  return toCommentPage(rows, pagination.limit);
}

export async function listReplies(commentId, pagination, viewerId) {
  const parent = await commentsRepository.findCommentContext(commentId);
  if (!parent) throw AppError.notFound('Comment not found');
  const rows = await commentsRepository.findReplies(commentId, pagination, viewerId);
  return toCommentPage(rows, pagination.limit);
}

/**
 * Adds a comment or reply to a post.
 * @param {string} postId
 * @param {string} authorId
 * @param {{ content: string, parentId?: string }} input
 */
export async function addComment(postId, authorId, { content, parentId }) {
  await assertPostExists(postId);
  const effectiveParentId = await resolveParentId(postId, parentId);

  const comment = await commentsRepository.createComment({
    postId,
    authorId,
    parentId: effectiveParentId,
    content,
  });
  return toCommentResponse(comment);
}

/** Comment authors can delete their comments; post authors can moderate their threads. */
export async function deleteComment(commentId, userId) {
  const comment = await commentsRepository.findCommentContext(commentId);
  if (!comment) throw AppError.notFound('Comment not found');

  const canDelete = comment.authorId === userId || comment.post.authorId === userId;
  if (!canDelete) throw AppError.forbidden('You can only delete your own comments');

  await commentsRepository.deleteComment(comment);
}
