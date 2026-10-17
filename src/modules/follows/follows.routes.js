import { Router } from 'express';
import { writeRateLimiter } from '../../middlewares/rateLimiter.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { paginationQuerySchema } from '../../utils/pagination.js';
import { usernameParamsSchema } from '../users/users.schemas.js';
import * as followsController from './follows.controller.js';
import { suggestionsQuerySchema } from './follows.schemas.js';

const validateUsername = validateRequest({ params: usernameParamsSchema });
const validateUserList = validateRequest({
  params: usernameParamsSchema,
  query: paginationQuerySchema,
});

/** Mounted at /users/:username. */
export const userFollowsRouter = Router({ mergeParams: true });

userFollowsRouter.put(
  '/follow',
  requireAuth,
  writeRateLimiter,
  validateUsername,
  followsController.followUser,
);
userFollowsRouter.delete('/follow', requireAuth, validateUsername, followsController.unfollowUser);
userFollowsRouter.get('/followers', validateUserList, followsController.listFollowers);
userFollowsRouter.get('/following', validateUserList, followsController.listFollowing);

/** Mounted at /users/suggestions. */
export const suggestionsRouter = Router();

suggestionsRouter.get(
  '/',
  validateRequest({ query: suggestionsQuerySchema }),
  followsController.getSuggestions,
);
