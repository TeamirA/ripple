import * as notificationsService from './notifications.service.js';

export async function listNotifications(req, res) {
  const page = await notificationsService.listNotifications(req.user.id, req.query);
  res.json(page);
}

export async function getUnreadCount(req, res) {
  const unreadCount = await notificationsService.getUnreadCount(req.user.id);
  res.set('Cache-Control', 'no-store').json({ unreadCount });
}

export async function markAllRead(req, res) {
  await notificationsService.markAllRead(req.user.id);
  res.status(204).end();
}
