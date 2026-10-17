import { prisma } from '../../config/database.js';
import { createdAtCursorWhere, createdAtOrderBy } from '../../utils/pagination.js';
import { USER_SUMMARY_SELECT } from '../users/users.selects.js';

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  isRead: true,
  createdAt: true,
  actor: { select: USER_SUMMARY_SELECT },
  post: { select: { id: true, content: true } },
  comment: { select: { id: true, content: true, parentId: true } },
};

export function createNotification({ type, recipientId, actorId, postId, commentId }) {
  return prisma.notification.create({
    data: { type, recipientId, actorId, postId, commentId },
    select: { id: true },
  });
}

/** Removes the notification for an action that was undone (unlike, unfollow). */
export function deleteNotifications({
  type,
  recipientId,
  actorId,
  postId = null,
  commentId = null,
}) {
  return prisma.notification.deleteMany({
    where: { type, recipientId, actorId, postId, commentId },
  });
}

export function findNotifications(recipientId, { cursor, limit }) {
  return prisma.notification.findMany({
    where: { recipientId, ...createdAtCursorWhere(cursor) },
    orderBy: createdAtOrderBy(),
    take: limit + 1,
    select: NOTIFICATION_SELECT,
  });
}

export function countUnread(recipientId) {
  return prisma.notification.count({ where: { recipientId, isRead: false } });
}

export function markAllRead(recipientId) {
  return prisma.notification.updateMany({
    where: { recipientId, isRead: false },
    data: { isRead: true },
  });
}
