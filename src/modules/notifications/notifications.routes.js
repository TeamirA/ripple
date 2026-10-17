import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { paginationQuerySchema } from '../../utils/pagination.js';
import * as notificationsController from './notifications.controller.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  notificationsController.listNotifications,
);
notificationsRouter.get('/unread-count', notificationsController.getUnreadCount);
notificationsRouter.post('/read-all', notificationsController.markAllRead);
