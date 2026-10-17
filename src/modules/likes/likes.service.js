import { AppError } from '../../utils/AppError.js';
import * as commentsRepository from '../comments/comments.repository.js';
import {
  NotificationType,
  notify,
  withdrawNotification,
} from '../notifications/notifications.service.js';
import * as postsRepository from '../posts/posts.repository.js';
import * as likesRepository from './likes.repository.js';

async function getPostOrThrow(postId) {
  const post = await postsRepository.findPostOwnership(postId);
  if (!post) throw AppError.notFound('Post not found');
  return post;
}

async function getCommentOrThrow(commentId) {
  const comment = await commentsRepository.findCommentContext(commentId);
  if (!comment) throw AppError.notFound('Comment not found');
  return comment;
}

/**
 * Likes a post (idempotent) and notifies its author on the first like.
 * @returns {Promise<{ likesCount: number, hasLiked: true }>}
 */
export async function likePost(userId, postId) {
  const post = await getPostOrThrow(postId);
  const { likesCount, isNewLike } = await likesRepository.addPostLike(userId, postId);
  if (isNewLike) {
    await notify({
      type: NotificationType.LIKE,
      recipientId: post.authorId,
      actorId: userId,
      postId,
    });
  }
  return { likesCount, hasLiked: true };
}

/** @returns {Promise<{ likesCount: number, hasLiked: false }>} */
export async function unlikePost(userId, postId) {
  const post = await getPostOrThrow(postId);
  const { likesCount, wasLiked } = await likesRepository.removePostLike(userId, postId);
  if (wasLiked) {
    await withdrawNotification({
      type: NotificationType.LIKE,
      recipientId: post.authorId,
      actorId: userId,
      postId,
    });
  }
  return { likesCount, hasLiked: false };
}

/** @returns {Promise<{ likesCount: number, hasLiked: true }>} */
export async function likeComment(userId, commentId) {
  const comment = await getCommentOrThrow(commentId);
  const { likesCount, isNewLike } = await likesRepository.addCommentLike(userId, commentId);
  if (isNewLike) {
    await notify({
      type: NotificationType.LIKE,
      recipientId: comment.authorId,
      actorId: userId,
      postId: comment.postId,
      commentId,
    });
  }
  return { likesCount, hasLiked: true };
}

/** @returns {Promise<{ likesCount: number, hasLiked: false }>} */
export async function unlikeComment(userId, commentId) {
  const comment = await getCommentOrThrow(commentId);
  const { likesCount, wasLiked } = await likesRepository.removeCommentLike(userId, commentId);
  if (wasLiked) {
    await withdrawNotification({
      type: NotificationType.LIKE,
      recipientId: comment.authorId,
      actorId: userId,
      postId: comment.postId,
      commentId,
    });
  }
  return { likesCount, hasLiked: false };
}
