import { Router } from 'express';
import { writeRateLimiter } from '../../middlewares/rateLimiter.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { uploadSingleImage } from '../../middlewares/uploadImage.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import * as usersController from './users.controller.js';
import { updateProfileSchema, usernameParamsSchema } from './users.schemas.js';

export const usersRouter = Router();

usersRouter.patch(
  '/me',
  requireAuth,
  writeRateLimiter,
  validateRequest({ body: updateProfileSchema }),
  usersController.updateMyProfile,
);
usersRouter.put(
  '/me/avatar',
  requireAuth,
  writeRateLimiter,
  uploadSingleImage('avatar'),
  usersController.updateMyAvatar,
);
usersRouter.delete('/me/avatar', requireAuth, usersController.removeMyAvatar);

usersRouter.get(
  '/:username',
  validateRequest({ params: usernameParamsSchema }),
  usersController.getProfile,
);
