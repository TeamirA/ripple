import { logger } from '../../config/logger.js';
import { buildPage } from '../../utils/pagination.js';
import * as notificationsRepository from './notifications.repository.js';

export const NotificationType = Object.freeze({
  FOLLOW: 'FOLLOW',
  LIKE: 'LIKE',
  COMMENT: 'COMMENT',
  REPLY: 'REPLY',
});

const PREVIEW_LENGTH = 120;

function truncate(text) {
  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH - 1)}…` : text;
}

function toNotificationResponse({ post, comment, ...notification }) {
  return {
    ...notification,
    post: post && { id: post.id, preview: truncate(post.content) },
    comment: comment && { id: comment.id, preview: truncate(comment.content) },
  };
}

/**
 * Records an activity notification. Self-actions never notify, and a failure here
 * is logged rather than failing the like/follow/comment that triggered it.
 * @param {{ type: string, recipientId: string, actorId: string, postId?: string, commentId?: string }} event
 */
export async function notify(event) {
  if (event.recipientId === event.actorId) return;
  try {
    await notificationsRepository.createNotification(event);
  } catch (err) {
    logger.error({ err, event }, 'Failed to create notification');
  }
}

/** Withdraws the notification of an action that was undone. */
export async function withdrawNotification(event) {
  if (event.recipientId === event.actorId) return;
  await notificationsRepository.deleteNotifications(event);
}

export async function listNotifications(userId, pagination) {
  const rows = await notificationsRepository.findNotifications(userId, pagination);
  const page = buildPage(rows, pagination.limit);
  return { ...page, data: page.data.map(toNotificationResponse) };
}

export function getUnreadCount(userId) {
  return notificationsRepository.countUnread(userId);
}

export async function markAllRead(userId) {
  await notificationsRepository.markAllRead(userId);
}
